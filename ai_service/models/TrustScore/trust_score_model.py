# =====================================
# 🚀 CHITX TRUST SCORE PREDICTOR
# =====================================
import streamlit as st
import pandas as pd
import numpy as np
import joblib

# ==============================
# LOAD MODEL
# ==============================
model = joblib.load("trust_model_pipeline.pkl")

st.set_page_config(page_title="ChitX AI Trust System", layout="centered")
st.title("🧠 ChitX Trust Score Predictor")
st.markdown("Upload your bank statement CSV + fill in the basic details below.")

# ==============================
# CSV PARSER
# ==============================
def parse_amount(value: str):
    """Returns (amount_float, 'credit'|'debit') from '12345.00 (Cr)' format."""
    v = str(value).strip()
    try:
        amount = float(v.split(" ")[0])
        typ = "credit" if "Cr" in v else "debit"
    except (ValueError, IndexError):
        amount, typ = 0.0, "debit"
    return amount, typ


def process_transactions(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df[["amount", "type"]] = df["Amount (Rs.)"].apply(
        lambda x: pd.Series(parse_amount(str(x)))
    )
    # Parse date
    df["Tran Date"] = pd.to_datetime(df["Tran Date"], dayfirst=True, errors="coerce")
    return df


# ==============================
# FEATURE EXTRACTORS FROM CSV
# ==============================
def calc_avg_balance(df: pd.DataFrame) -> float:
    """Average account balance across all transactions."""
    return float(df["Balance (Rs.)"].mean())


def calc_salary_consistency(df: pd.DataFrame) -> float:
    """
    Measures how stable/regular the income credits are.
    Uses coefficient of variation (CV): lower CV → higher consistency.
    Returns 0–1 (1 = very consistent income).
    """
    credits = df[df["type"] == "credit"]["amount"]
    if len(credits) < 2:
        return 0.5
    cv = credits.std() / credits.mean()
    # CV of 0 → score 1.0; CV of 1 → score 0.0; clipped
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
    cv = debits.std() / debits.mean()
    return float(np.clip(1 - cv, 0.0, 1.0))


def calc_payment_timeliness(df: pd.DataFrame) -> float:
    """
    Measures financial regularity month-over-month.
    Fraction of months that have at least one credit transaction.
    Returns 0–1.
    """
    if df["Tran Date"].isna().all():
        # fallback: if dates can't be parsed, use transaction density
        return float(np.clip(len(df) / 50, 0.0, 1.0))

    credits = df[df["type"] == "credit"].copy()
    if credits.empty:
        return 0.0

    # All months present in the dataset
    all_months = df["Tran Date"].dt.to_period("M").dropna().unique()
    credit_months = credits["Tran Date"].dt.to_period("M").dropna().unique()

    if len(all_months) == 0:
        return 0.5

    return float(np.clip(len(credit_months) / len(all_months), 0.0, 1.0))


# ==============================
# SECTION 1: BANK STATEMENT UPLOAD
# ==============================
st.header("📄 Step 1: Upload Bank Statement")
uploaded_file = st.file_uploader(
    "Upload CSV (columns: Tran Id, Tran Date, Remarks, Amount (Rs.), Balance (Rs.))",
    type=["csv"]
)

# Derived-from-CSV features (shown as read-only after parsing)
avg_balance_from_csv = None
salary_c, spending_s, payment_t = 0.7, 0.7, 0.8  # safe defaults

if uploaded_file is not None:
    try:
        raw_df = pd.read_csv(uploaded_file)
        txn_df = process_transactions(raw_df)

        avg_balance_from_csv = calc_avg_balance(txn_df)
        salary_c = calc_salary_consistency(txn_df)
        spending_s = calc_spending_stability(txn_df)
        payment_t = calc_payment_timeliness(txn_df)

        st.success("✅ Bank statement processed successfully")

        # Show derived features as info
        col1, col2, col3, col4 = st.columns(4)
        col1.metric("Avg Balance (₹)", f"₹{avg_balance_from_csv:,.0f}")
        col2.metric("Salary Consistency", f"{salary_c:.2f}")
        col3.metric("Spending Stability", f"{spending_s:.2f}")
        col4.metric("Payment Timeliness", f"{payment_t:.2f}")

    except KeyError as e:
        st.error(f"❌ Missing expected column in CSV: {e}. Using default feature values.")
    except Exception as e:
        st.error(f"❌ Error processing file: {e}. Using default feature values.")
else:
    st.info("ℹ️ No file uploaded — avg_balance must be entered manually and transaction features use defaults.")

# ==============================
# SECTION 2: MANUAL INPUTS
# ==============================
st.header("📝 Step 2: Enter Your Details")

col_a, col_b = st.columns(2)
with col_a:
    income = st.number_input("Monthly Income (₹)", min_value=1000, value=50000, step=500)
    expenses = st.number_input("Monthly Expenses (₹)", min_value=500, value=30000, step=500)
    employment = st.selectbox("Employment Type", ["Student", "Salaried", "Business"])
    employment_map = {"Student": 0, "Salaried": 1, "Business": 2}
    employment_code = employment_map[employment]

with col_b:
    credit_score = st.number_input("Credit Score (CIBIL)", min_value=300, max_value=900, value=700)
    defaults = st.number_input("Number of Past Defaults", min_value=0, max_value=10, value=0)
    participation = st.number_input("Chit Participation Count", min_value=0, max_value=20, value=3)

    # avg_balance: pre-fill from CSV if available, else let user enter
    if avg_balance_from_csv is not None:
        avg_balance = st.number_input(
            "Average Balance (₹) — auto-filled from CSV",
            value=float(avg_balance_from_csv),
            disabled=True
        )
        avg_balance = avg_balance_from_csv
    else:
        avg_balance = st.number_input("Average Balance (₹)", min_value=0, value=30000, step=1000)

# ==============================
# DERIVED RATIOS
# ==============================
savings_ratio = np.clip((income - expenses) / income, 0, 1) if income > 0 else 0.0
expense_ratio = np.clip(expenses / income, 0, 1) if income > 0 else 1.0

# ==============================
# PREDICT
# ==============================
st.header("🔍 Step 3: Get Trust Score")

if st.button("🚀 Predict Trust Score", use_container_width=True):

    input_data = pd.DataFrame([{
        "income": income,
        "expenses": expenses,
        "employment": employment_code,
        "credit_score": credit_score,
        "avg_balance": avg_balance,
        "salary_consistency": salary_c,
        "spending_stability": spending_s,
        "savings_ratio": savings_ratio,
        "expense_ratio": expense_ratio,
        "payment_timeliness": payment_t,
        "defaults": defaults,
        "participation_count": participation
    }])

    prediction = model.predict(input_data)[0]
    score = round(float(prediction), 2)

    # Confidence band
    if score > 75:
        confidence, conf_color = "High ✅", "green"
    elif score > 50:
        confidence, conf_color = "Medium ⚠️", "orange"
    else:
        confidence, conf_color = "Low ❌", "red"

    st.markdown("---")
    result_col1, result_col2 = st.columns(2)
    result_col1.metric("💯 Trust Score", f"{score} / 100")
    result_col2.metric("📊 Confidence", confidence)

    # Progress bar visual
    st.progress(int(score))

    # Feature breakdown
    with st.expander("🔍 All Features Used in Prediction"):
        st.dataframe(input_data.T.rename(columns={0: "Value"}), use_container_width=True)