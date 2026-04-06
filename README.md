# ChitX - AI-Powered Decentralized Chit Fund Protocol

ChitX is a modern, AI-governed decentralized chit fund platform that enables transparent, peer-to-peer saving and borrowing. By leveraging AI for trust scoring and payout prioritization, ChitX eliminates the need for middleman commissions while ensuring fair and efficient fund allocation.

## 🚀 Project Overview

ChitX consists of four main components:
1.  **Frontend**: A premium React dashboard built with Vite and TailwindCSS for user interaction.
2.  **Backend**: An Express.js server managing users, pools, transactions, and on-chain interactions.
3.  **AI Oracle**: A FastAPI service powered by Groq and ML models that calculates trust scores and provides financial insights.
4.  **AI Models Server**: A specialized Flask server for handling deep-dive simulations and risk assessments.

---

## 🛠️ Prerequisites

Before running the project, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18+)
- [Python](https://www.python.org/) (3.9+)
- [MongoDB](https://www.mongodb.com/) (running locally or a remote URI)
- [Git](https://git-scm.com/)

---

## ⚙️ Setup & Installation

### 1. Clone the Repository
```bash
git clone https://github.com/JayThakare05/ChitX-.git
cd ChitX-
```

### 2. Configure Environment Variables
You will need to create `.env` files in three directories. Refer to the `.env.sample` files in each folder.

- **Backend**: Update `backend/.env` with your Mongo URI and Polygon RPC details.
- **AI Service**: Update `ai_service/.env` with your Groq API Key.
- **Frontend**: Optional, but recommended for custom API endpoints.

---

## 🏃 Running the Project

To run the complete ChitX ecosystem, you will need **four separate terminals**:

### Terminal 1: Backend Server
```bash
cd backend
npm install
npm start
```
*Runs on: http://localhost:5000*


### Terminal 2: Frontend Dashboard
```bash
cd frontend
npm install
npm run dev
```
*Runs on: http://localhost:5173*

### Terminal 3: AI Oracle Service
```bash
cd ai_service
pip install -r req.txt
python app.py
```
*Runs on: http://localhost:8000*

### Terminal 4: AI Models & Simulation Server
```bash
cd ai_service/models/all_models
python server.py
```
*Runs on: http://localhost:5050*

---

## 📜 Core Features

-   **AI Trust Score**: Automated bank statement parsing and trust scoring for on-chain collateral allocation.
-   **Dynamic Pool Bifurcation**: AI-driven grouping of users based on priority and risk profiles.
-   **Emergency Fund**: Fast-track AI verification of medical/emergency documents for immediate payouts.
-   **Global Chatbot**: Context-aware financial Oracle to help you manage your chit fund strategy.
-   **On-Chain Settlements**: Transparent payouts and contributions via the Polygon Amoy Testnet.

---

## 🤝 Project Structure

-   `/frontend`: React/Vite/Tailwind source code.
-   `/backend`: Node.js/Express server and MongoDB models.
-   `/ai_service`: FastAPI AI Oracle and document verification logic.
-   `/contracts`: Solidity smart contracts for the CTX token and Treasury.
-   `/ai_service/models`: Trained ML models and simulation logic.

---

© 2024 ChitX Protocol. Built for a more equitable financial future.
