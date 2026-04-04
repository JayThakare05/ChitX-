from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import random

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class KYCData(BaseModel):
    income: float
    expenses: float
    employment: str
    hasBankStatement: bool

@app.post("/ai/process")
async def process_request():
    return {"message": "AI Processing Bridge Active"}

@app.post("/ai/calculate-score")
async def calculate_score(data: KYCData):
    try:
        # Base logic: Income to Expense ratio
        ratio = (data.income / (data.income + data.expenses)) if (data.income + data.expenses) > 0 else 0
        base_score = ratio * 70

        # Employment bonus
        bonuses = {
            "Salaried": 10,
            "Business": 15,
            "Student": 5
        }
        employment_bonus = bonuses.get(data.employment, 0)

        # Bank statement bonus
        bank_bonus = 15 if data.hasBankStatement else 0
        
        # Calculate final score
        final_score = base_score + employment_bonus + bank_bonus
        
        # Cap at 100
        final_score = min(100, max(15, round(final_score)))

        return {
            "trustScore": final_score,
            "analysis": "Trust score calculated professionally based on income/expense ratio and verified employment type."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
