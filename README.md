# 🇮🇳 India CGE Model — Policy Simulator

A professional, Computable General Equilibrium (CGE) model for the Indian economy, featuring a 6-sector closed-economy framework. This tool allows policy makers and researchers to simulate the impacts of tax changes, subsidies, and factor supply shocks on GDP, employment, and sectoral output.

## 🚀 Features

- **Decoupled Architecture**: Modern Flask API backend with a premium React/Vite frontend.
- **6-Sector Framework**: Covers Agriculture (AGR), Manufacturing (MFG), Services (SRV), Energy (ENG), Construction (CON), and Government (GOV).
- **Social Accounting Matrix (SAM)**: Balanced input-output structure calibrated to approximation of India's GDP.
- **Advanced Solver**: Uses `scipy.optimize.root` with a hybrid method to solve the non-linear system of equations.
- **Premium UI**: Glassmorphism dashboard with real-time data visualization using Recharts.

## 🛠️ Tech Stack

- **Backend**: Python, Flask, NumPy, SciPy, Flask-CORS
- **Frontend**: React, Vite, Recharts, Lucide, Custom CSS (Premium Glassmorphism)

## 📦 Project Structure

```text
.
├── backend/            # Flask API backend
│   ├── app.py          # Flask entry point
│   ├── requirements.txt # Python dependencies
│   └── src/
│       ├── api.py          # Flask Blueprints
│       ├── cge_solver.py   # Math model & solver
│       ├── sam_data.py     # Social Accounting Matrix calibration
│       └── policy_engine.py # Simulation deltas
├── frontend/           # React application
│   └── src/            # Dashboard UI & API services
└── README.md
```

## 🏁 Getting Started

### 1. Backend Setup
```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Start the API server (Port 5000)
python app.py
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Navigate to `http://localhost:5173` to view the dashboard.

## 📝 Model Specification

The model assumes:
- **Production**: Cobb-Douglas production functions for all sectors.
- **Utility**: Cobb-Douglas household utility over goods.
- **Factors**: Labor and Capital (market-clearing).
- **Numeraire**: Wage (w = 1.0) is fixed as the price anchor.
- **Equations**: Solves a system of 25+ simultaneous equations (zero-profit, market clearing, FOCs).

---
*Developed for research and policy simulation.*
