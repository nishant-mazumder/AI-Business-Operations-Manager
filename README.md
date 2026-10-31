# AI-Business-Operations-Manager (NexusOps AI)

> Enterprise Full-Stack Business Operations, Demand Forecasting & Intelligence SaaS Platform for College Capstone Project.

---

## 🏗️ Architecture & Project Structure

```text
AI-Business-Operations-Manager/
├── Frontend/                       # React 19 + Vite + Tailwind CSS + Lucide UI
│   ├── src/
│   │   ├── components/            # Layout, Navigation, Modals, UI widgets
│   │   ├── context/               # Global state (AppContext)
│   │   ├── data/                  # Mock data (to be replaced by API client)
│   │   ├── pages/                 # 11 SaaS dashboard pages
│   │   ├── types/                 # TypeScript interfaces
│   │   └── lib/                   # Utilities, currency formatters (INR)
│   ├── package.json
│   └── vite.config.ts
├── backend/                        # Django REST API Backend
│   ├── manage.py
│   ├── config/                    # Django project configuration & settings
│   ├── apps/                      # Modular Django Apps
│   │   ├── accounts/              # User registration, login, JWT & profile
│   │   ├── businesses/            # Multi-store & business scoping
│   │   ├── imports/               # Multi-file CSV/Excel batch import pipeline
│   │   ├── sales/                 # Transactions & sales order analytics
│   │   ├── inventory/             # Products, SKUs & stock management
│   │   ├── purchases/             # Suppliers & purchase orders
│   │   ├── expenses/              # OPEX ledger & category spend
│   │   ├── analytics/             # Aggregated BI metrics & P&L calculations
│   │   ├── forecasting/           # XGBoost ML inference engine (10 features)
│   │   └── assistant/             # Grounded AI Business Assistant queries
│   ├── tests/                     # Automated backend test suites
│   ├── requirements.txt           # Python backend dependencies
│   ├── .env.example               # Environment variables template
│   └── venv/                      # Python virtual environment
├── ML_MODEL/
│   ├── xgb_sales_forecasting_model.json  # Pre-trained XGBoost regression model
│   └── feature_columns.json              # Exact 10 feature sequence
├── datasets/                       # User CSV/Excel upload datasets & templates
├── .gitignore
└── README.md
```

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript 6, Vite 8, Tailwind CSS, Recharts, Lucide React, Framer Motion
- **Backend**: Python 3.13, Django 5.2, Django REST Framework, SimpleJWT, CORS Headers, drf-spectacular (OpenAPI 3)
- **Database**: PostgreSQL 18 with `psycopg` (binary v3)
- **Data & Analytics**: Pandas 3.1, NumPy 2.5, OpenPyXL 3.1
- **Machine Learning**: XGBoost 3.4.1 (10-feature demand forecasting engine)

---

## 🚀 Getting Started (Windows PowerShell)

### 1. Backend Setup

```powershell
# Navigate to the backend directory
cd "c:\Users\acer\OneDrive\Desktop\AI-Business-Operations-Manager\backend"

# Activate the virtual environment
.\venv\Scripts\Activate.ps1

# Verify Django environment
python manage.py check
```

### 2. Frontend Setup

```powershell
# Navigate to the frontend directory
cd "c:\Users\acer\OneDrive\Desktop\AI-Business-Operations-Manager\Frontend"

# Run development server
npm run dev
```

Frontend runs at: `http://localhost:5173`
Backend runs at: `http://127.0.0.1:8000`

---

## 📋 Implementation Roadmap

- [x] **Phase 1**: Audit and project preparation (Virtual environment, Django structure, ML verification, Frontend build check)
- [x] **Phase 2**: PostgreSQL setup and connection (Database creation, user permissions, Django DATABASES config)
- [x] **Phase 3**: Authentication and user accounts (Registration, JWT login/refresh, profile endpoints)
- [x] **Phase 4**: Business profiles and multi-tenant data isolation (Pan-India stores, tenant scoping)
- [x] **Phase 5**: Multi-file CSV/Excel upload engine (Sales, Inventory, Purchases, Expenses, Suppliers with topological dependency order)
- [x] **Phase 6**: Data templates and business records (Downloadable sample datasets)
- [x] **Phase 7**: Real dashboard and analytics APIs (Overview KPIs, Gross Profit & Margins, Store performance)
- [x] **Phase 8**: Integrate trained XGBoost forecasting model (10-feature lag/rolling pipeline with confidence bounds)
- [x] **Phase 9**: Inventory recommendations engine (Rule-based explainable operational alerts)
- [x] **Phase 10**: AI Business Assistant grounded query engine (Natural language answers strictly backed by live DB records)
- [x] **Phase 11**: Frontend API integration (JWT AuthContext, ProtectedRoute, dynamic forms, Live AI Assistant & Forecasting)
- [x] **Phase 12**: Versioned API design & Swagger/OpenAPI documentation (`/api/docs/` and `/api/schema/`)
- [x] **Phase 13**: Automated testing, security, and data validation (23/23 tests passing)
- [x] **Phase 14**: Final end-to-end verification and capstone handover

---

## 🔑 Demo & Testing Credentials

- **Email**: `aarav.sharma@nexusops.in`
- **Password**: `StrongPassword@2026`
- **Role**: Director of Operations / VP Operations
- **Pan-India Flagship Stores**:
  - Mumbai Flagship #101 (`MUM-BKC`)
  - Bengaluru Tech Hub #204 (`BLR-IND`)
  - Delhi NCR Hub #305 (`DEL-CYB`)
  - Hyderabad Cyberabad #402 (`HYD-HIT`)

---

## 🧪 Running Automated Tests

Run the full 23-test PostgreSQL test suite:
```powershell
cd "c:\Users\acer\OneDrive\Desktop\AI-Business-Operations-Manager\backend"
.\venv\Scripts\python.exe manage.py test tests
```

---

## 📥 Sample Datasets for Testing Import

The `datasets/` folder contains 5 verified CSV templates ready for batch upload:
1. `suppliers.csv`
2. `inventory.csv`
3. `purchases.csv`
4. `sales.csv`
5. `expenses.csv`

To test batch importing:
1. Open the application at `http://localhost:5173`.
2. Click **"Import Data"** in the top navbar or sidebar.
3. Drag & drop or select any or all of the 5 files from `datasets/`.
4. Click **"Preview Import"** to inspect row-level validations.
5. Click **"Commit Import"** to persist into PostgreSQL with transactional safety.
