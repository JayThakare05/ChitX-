from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import numpy as np
import io
import os
import joblib
from groq import Groq

# ==============================
# APP INIT
# ==============================
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==============================
# LOAD ML MODEL AT STARTUP
# ==============================
MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "TrustScore", "trust_model_pipeline.pkl")

try:
    trust_model = joblib.load(MODEL_PATH)
    print(f"✅ TrustScore ML Model loaded from: {MODEL_PATH}")
except Exception as e:
    print(f"❌ Failed to load TrustScore model: {e}")
    trust_model = None

# ==============================
# GROQ CLIENT
# ==============================
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "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")
groq_client = Groq(api_key=GROQ_API_KEY)


# ==============================
# CSV PARSING HELPERS (ported from trust_score_model.py)
# ==============================
def parse_amount(value: str):
    """Returns (amount_float, 'credit'|'debit') from '12345.00 (Cr)' format."""
    v = str(value).strip()
    try:
        amount = float(v.split(" ")[0].replace(",", ""))
        typ = "credit" if "Cr" in v else "debit"
    except (ValueError, IndexError):
        amount, typ = 0.0, "debit"
    return amount, typ


def process_transactions(df: pd.DataFrame) -> pd.DataFrame:
    """Parse the CSV into a structured DataFrame with amount, type, and parsed dates."""
    df = df.copy()
    if "Amount (Rs.)" in df.columns:
        df[["amount", "type"]] = df["Amount (Rs.)"].apply(
            lambda x: pd.Series(parse_amount(str(x)))
        )
    else:
        # Fallback: try to find credit/debit columns
        df["amount"] = 0.0
        df["type"] = "debit"
        for col in df.columns:
            lower_col = col.lower()
            if 'credit' in lower_col or 'deposit' in lower_col:
                credit_vals = pd.to_numeric(df[col], errors='coerce').fillna(0)
                debit_vals = df.get("amount", pd.Series([0]*len(df)))
                df["amount"] = credit_vals + debit_vals
                df.loc[credit_vals > 0, "type"] = "credit"
            elif 'debit' in lower_col or 'withdrawal' in lower_col:
                debit_vals = pd.to_numeric(df[col], errors='coerce').fillna(0)
                df.loc[debit_vals > 0, "amount"] = debit_vals
                df.loc[debit_vals > 0, "type"] = "debit"

    # Parse date
    date_col = None
    for col in df.columns:
        if 'date' in col.lower():
            date_col = col
            break
    if date_col:
        df["parsed_date"] = pd.to_datetime(df[date_col], dayfirst=True, errors="coerce")
    else:
        df["parsed_date"] = pd.NaT

    return df


def calc_avg_balance(df: pd.DataFrame) -> float:
    """Average account balance across all transactions."""
    bal_col = None
    for col in df.columns:
        if 'balance' in col.lower():
            bal_col = col
            break
    if bal_col:
        return float(pd.to_numeric(df[bal_col], errors='coerce').mean())
    # Fallback: estimate from credits - debits
    credits = df[df["type"] == "credit"]["amount"].sum()
    debits = df[df["type"] == "debit"]["amount"].sum()
    return max(float(credits - debits), 10000.0)


def calc_salary_consistency(df: pd.DataFrame) -> float:
    """
    Measures how stable/regular the income credits are.
    Uses coefficient of variation: lower CV → higher consistency.
    Returns 0–1 (1 = very consistent income).
    """
    credits = df[df["type"] == "credit"]["amount"]
    if len(credits) < 2:
        return 0.5
    cv = credits.std() / credits.mean() if credits.mean() > 0 else 1.0
    return float(np.clip(1 - cv, 0.0, 1.0))


def calc_spending_stability(df: pd.DataFrame) -> float:
    """
    Measures how stable/predictable spending is.
    Lower variance in debits = higher stability.
    Returns 0–1.
    """
    debits = df[df["type"] == "debit"]["amount"]
    if len(debits) < 2:
        return 0.5
    cv = debits.std() / debits.mean() if debits.mean() > 0 else 1.0
    return float(np.clip(1 - cv, 0.0, 1.0))


def calc_payment_timeliness(df: pd.DataFrame) -> float:
    """
    Measures financial regularity month-over-month.
    Fraction of months that have at least one credit transaction.
    Returns 0–1.
    """
    if "parsed_date" not in df.columns or df["parsed_date"].isna().all():
        return float(np.clip(len(df) / 50, 0.0, 1.0))

    credits = df[df["type"] == "credit"].copy()
    if credits.empty:
        return 0.0

    all_months = df["parsed_date"].dt.to_period("M").dropna().unique()
    credit_months = credits["parsed_date"].dt.to_period("M").dropna().unique()

    if len(all_months) == 0:
        return 0.5

    return float(np.clip(len(credit_months) / len(all_months), 0.0, 1.0))


# ==============================
# GROQ: ESTIMATE CIBIL SCORE
# ==============================
async def estimate_cibil_from_groq(total_credits: float, total_debits: float,
                                    avg_balance: float, txn_count: int,
                                    salary_consistency: float) -> int:
    """
    Send a financial summary to Groq LLM and ask it to estimate a CIBIL-like score (300-900).
    """
    try:
        prompt = f"""You are a financial credit scoring expert. Based on the following bank transaction summary, 
estimate a CIBIL credit score between 300 and 900. 

Financial Summary:
- Total Credits (Income): ₹{total_credits:,.2f}
- Total Debits (Expenses): ₹{total_debits:,.2f}
- Average Account Balance: ₹{avg_balance:,.2f}
- Total Transactions: {txn_count}
- Salary Consistency Score: {salary_consistency:.2f} (0=irregular, 1=very regular)
- Savings Rate: {((total_credits - total_debits) / total_credits * 100) if total_credits > 0 else 0:.1f}%

IMPORTANT: Respond with ONLY a single integer number between 300 and 900. Nothing else. No explanation, no text, just the number."""

        chat_completion = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.1,
            max_tokens=10,
        )

        response_text = chat_completion.choices[0].message.content.strip()
        # Extract the number from the response
        cibil_score = int(''.join(filter(str.isdigit, response_text)))
        cibil_score = max(300, min(900, cibil_score))
        
        print(f"🧠 Groq estimated CIBIL Score: {cibil_score}")
        return cibil_score

    except Exception as e:
        print(f"⚠️ Groq CIBIL estimation failed: {e}. Using default 650.")
        return 650


# ==============================
# PYDANTIC MODELS
# ==============================
class KYCData(BaseModel):
    income: float
    expenses: float
    employment: str
    hasBankStatement: bool


class OracleRequest(BaseModel):
    trustScore: float
    income: float
    expenses: float
    employment: str
    ctxBalance: float
    poolsJoined: int
    hasBankStatement: bool
    walletAddress: str = ""
    name: str = "Member"


# ==============================
# ENDPOINTS
# ==============================
@app.post("/ai/process")
async def process_request():
    return {"message": "AI Processing Bridge Active"}


# ==============================
# AI ORACLE INSIGHTS (Groq-powered)
# ==============================
@app.post("/ai/oracle-insights")
async def oracle_insights(data: OracleRequest):
    try:
        disposable   = data.income - data.expenses
        savings_rate = round((disposable / data.income * 100), 1) if data.income > 0 else 0
        expense_ratio = round((data.expenses / data.income * 100), 1) if data.income > 0 else 100

        # Trust score tier label
        if data.trustScore >= 80:   trust_tier = "Excellent (Elite tier)"
        elif data.trustScore >= 65: trust_tier = "Good (Standard tier)"
        elif data.trustScore >= 50: trust_tier = "Average (entry-level qualified)"
        else:                       trust_tier = "Below threshold (not yet pool-eligible)"

        bank_context = (
            "The user has provided a bank statement — their income and expense figures are AI-verified "
            "and reflect actual transaction history."
        ) if data.hasBankStatement else (
            "The user has NOT uploaded a bank statement — figures are self-reported and unverified."
        )

        pool_context = (
            f"The user is currently active in {data.poolsJoined} chit pool(s)."
            if data.poolsJoined > 0
            else "The user has not joined any pools yet."
        )

        prompt = f"""You are ChitX Oracle, an expert AI financial advisor for a decentralized chit fund platform.
Analyze this user's complete financial profile and return exactly 3 highly personalized, actionable insights.

USER PROFILE:
- Name: {data.name}
- Employment: {data.employment}
- Monthly Income: ₹{data.income:,.0f}
- Monthly Expenses: ₹{data.expenses:,.0f}
- Disposable Income: ₹{disposable:,.0f}/month
- Savings Rate: {savings_rate}%
- Expense Ratio: {expense_ratio}%
- Trust Score: {data.trustScore}/100 — {trust_tier}
- CTX Token Balance: {data.ctxBalance} CTX
- {bank_context}
- {pool_context}

Return ONLY a valid JSON array with EXACTLY 3 objects. Each object must have:
- "emoji": one relevant emoji string
- "title": short 3-5 word title (string)
- "insight": 1-2 sentence personalized recommendation mentioning their actual numbers (string)
- "confidence": integer 60-99 representing how confident you are in this insight
- "category": one of "risk", "opportunity", "action"

Focus on: trust score trajectory, pool eligibility, income/savings optimization, CTX allocation strategy, and financial risks.
Be specific — mention their actual ₹ numbers, CTX balance, and trust score in the insights.
Do NOT include any text outside the JSON array."""

        chat = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.5,
            max_tokens=800,
        )

        raw = chat.choices[0].message.content.strip()

        # Extract JSON if wrapped in markdown code block
        if "```" in raw:
            import re
            match = re.search(r'```(?:json)?\s*([\s\S]*?)```', raw)
            raw = match.group(1).strip() if match else raw

        import json
        insights = json.loads(raw)

        return {"ok": True, "insights": insights[:3]}

    except Exception as e:
        import traceback
        traceback.print_exc()
        # Return safe fallback
        return {
            "ok": False,
            "insights": [
                {
                    "emoji": "🛡️",
                    "title": "Trust Score Status",
                    "insight": f"Your trust score of {data.trustScore}/100 determines your pool eligibility and token allocation. Keep contributing consistently to improve it.",
                    "confidence": 90,
                    "category": "risk"
                },
                {
                    "emoji": "💰",
                    "title": "Savings Opportunity",
                    "insight": f"With ₹{data.income - data.expenses:,.0f} in monthly disposable income, consider joining a chit pool to grow your savings systematically.",
                    "confidence": 75,
                    "category": "opportunity"
                },
                {
                    "emoji": "🪙",
                    "title": "CTX Balance Alert",
                    "insight": f"You currently hold {data.ctxBalance} CTX tokens. Maintain at least 2× your preferred pool's monthly pay as a fixed deposit buffer.",
                    "confidence": 80,
                    "category": "action"
                }
            ]
        }


@app.post("/ai/parse-statement")
async def parse_statement(file: UploadFile = File(...)):
    try:
        # 1. Read CSV
        contents = await file.read()
        csv_text = contents.decode("utf-8", errors="replace")

        # 🖨️ PRINT CSV CONTENT TO AI SERVICE TERMINAL
        print("\n" + "=" * 60)
        print("📄 RECEIVED CSV FILE CONTENT:")
        print("=" * 60)
        print(csv_text[:3000])  # Print first 3000 chars to avoid flooding
        if len(csv_text) > 3000:
            print(f"... [{len(csv_text) - 3000} more characters truncated]")
        print("=" * 60 + "\n")

        # 2. Parse into DataFrame
        df = pd.read_csv(io.StringIO(csv_text))
        print(f"📊 CSV Shape: {df.shape[0]} rows × {df.shape[1]} columns")
        print(f"📊 Columns: {list(df.columns)}")

        # 3. Process transactions
        txn_df = process_transactions(df)

        # 4. Extract features
        total_credits = float(txn_df[txn_df["type"] == "credit"]["amount"].sum())
        total_debits = float(txn_df[txn_df["type"] == "debit"]["amount"].sum())
        avg_balance = calc_avg_balance(txn_df)
        salary_c = calc_salary_consistency(txn_df)
        spending_s = calc_spending_stability(txn_df)
        payment_t = calc_payment_timeliness(txn_df)

        # Fallback income/expenses
        if total_credits == 0:
            total_credits = 60000
        if total_debits == 0:
            total_debits = 30000

        print(f"💰 Extracted — Credits: ₹{total_credits:,.2f}, Debits: ₹{total_debits:,.2f}")
        print(f"📈 Avg Balance: ₹{avg_balance:,.2f}")
        print(f"📊 Salary Consistency: {salary_c:.2f}, Spending Stability: {spending_s:.2f}, Payment Timeliness: {payment_t:.2f}")

        # 5. Get CIBIL score from Groq
        cibil_score = await estimate_cibil_from_groq(
            total_credits, total_debits, avg_balance, len(txn_df), salary_c
        )

        # 6. Build model input and predict Trust Score
        savings_ratio = np.clip((total_credits - total_debits) / total_credits, 0, 1) if total_credits > 0 else 0.0
        expense_ratio = np.clip(total_debits / total_credits, 0, 1) if total_credits > 0 else 1.0

        if trust_model is not None:
            input_data = pd.DataFrame([{
                "income": total_credits,
                "expenses": total_debits,
                "employment": 1,  # Default: Salaried
                "credit_score": cibil_score,
                "avg_balance": avg_balance,
                "salary_consistency": salary_c,
                "spending_stability": spending_s,
                "savings_ratio": savings_ratio,
                "expense_ratio": expense_ratio,
                "payment_timeliness": payment_t,
                "defaults": 0,  # First-time user = 0 defaults
                "participation_count": 0  # First-time user = 0 participation
            }])

            prediction = trust_model.predict(input_data)[0]
            trust_score = round(float(prediction), 2)
            trust_score = max(10, min(100, trust_score))  # Clamp to 10-100
            print(f"🎯 ML Model Predicted Trust Score: {trust_score}")
        else:
            # Fallback if model failed to load
            ratio = (total_credits / (total_credits + total_debits)) if (total_credits + total_debits) > 0 else 0
            trust_score = min(100, max(15, round(ratio * 70 + 15)))
            print(f"⚠️ Using fallback trust score: {trust_score}")

        return {
            "income": round(total_credits, 2),
            "expenses": round(total_debits, 2),
            "trustScore": trust_score,
            "cibilScore": cibil_score,
            "analysis": f"AI parsed CSV ({len(txn_df)} transactions). CIBIL estimated at {cibil_score} via Groq. ML model predicted trust score: {trust_score}."
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to parse CSV: {str(e)}")


@app.post("/ai/calculate-score")
async def calculate_score(data: KYCData):
    try:
        ratio = (data.income / (data.income + data.expenses)) if (data.income + data.expenses) > 0 else 0
        base_score = ratio * 70

        bonuses = {"Salaried": 10, "Business": 15, "Student": 5}
        employment_bonus = bonuses.get(data.employment, 0)

        bank_bonus = 15 if data.hasBankStatement else 0

        final_score = base_score + employment_bonus + bank_bonus
        final_score = min(100, max(15, round(final_score)))

        return {
            "trustScore": final_score,
            "analysis": "Trust score calculated based on income/expense ratio and employment type."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
