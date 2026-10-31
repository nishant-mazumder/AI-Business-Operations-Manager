# NexusOps AI — Intelligent Business Operations Manager (India Edition)

> **College Capstone Project**: AI-Powered Business Operations & Demand Forecasting SaaS Dashboard (Frontend Demonstration)

---

## 🌟 Overview & Localization

**NexusOps AI** is an enterprise-grade, high-performance business analytics and operations manager designed with a clean, high-contrast **white SaaS aesthetic** tailored for Indian commercial operations.

- **Currency**: **INR (₹ - Indian Rupees)** throughout the entire application, utilizing standard Indian numbering notation (`₹1,28,450`, `₹12,84,500`, etc.).
- **Operations Lead**: **Aarav Sharma** (Director of Operations / VP Operations).
- **Store Network**: Pan-India hubs including **Mumbai Flagship (BKC)**, **Bengaluru Tech Hub (Indiranagar)**, **Delhi NCR Hub (Gurugram)**, and **Hyderabad Cyberabad (HITEC City)**.
- **Payment & Banking Ecosystem**: UPI (Google Pay, PhonePe, Paytm QR), Razorpay POS Terminal, RuPay, HDFC/ICICI NetBanking, and NEFT/RTGS.

---

## 🚀 Key Implemented Modules & Routes

| Route | Module | Key Capabilities |
|---|---|---|
| `/` | **Overview Dashboard** | Greeting card (`Good morning, Aarav!`), time filter pills, 6 formatted KPI cards with sparklines in ₹ INR, dual-year comparison financial bar chart (Income/Expenses/Profit tabs), product sales donut with legend, expenses progress breakdown, and live transactions feed. |
| `/sales` | **Sales & Revenue** | Gross revenue velocity area chart in ₹, category horizontal bar breakdown, filterable/searchable sales ledger, transaction receipt modal, and "Record Sale" action. |
| `/forecasting` | **Demand Forecasting** | 10-feature retail lag simulation (`sales_lag_7`, `sales_lag_14`, `sales_lag_28`, rolling means) from `ML_MODEL/feature_columns.json`. Historical vs. Predicted ComposedChart with vertical "Today" reference line, 90% confidence corridor, peak demand detection, and model evaluation metrics (MAE 3.84, RMSE 5.12, MAPE 5.9%, R² 0.948). |
| `/inventory` | **Inventory Management** | Stock level vs. Reorder safety buffer bar chart, category unit pie chart, SKU catalog table with Indian pricing (`₹32,999`, etc.), low/out-of-stock badges, quick stock adjustment modal (+/- units), and edit pricing/threshold drawer. |
| `/purchases` | **Purchases & Suppliers** | Procurement spend charts in ₹, purchase order lifecycle tracking (Pending, In Transit, Received), Indian supplier directory (Synapse Tech India, Godrej & Ergoflex, Silicon Matrix India, Blue Tokai), and "New Purchase Order" modal. |
| `/expenses` | **Expense Management** | Monthly budget vs. actual spend chart in ₹, expense category breakdown, searchable accounts payable ledger with Indian vendors, edit/delete expense actions, and browser CSV download. |
| `/analytics` | **BI Analytics Center** | 10-month composed financial trajectory with Gross Margin % overlay, weekday vs. weekend sales velocity by department, Indian multi-store performance matrix, and inventory turnover (DSI) scorecard. |
| `/assistant` | **AI Business Assistant** | Conversational chat interface with simulated intelligent reasoning over Indian store data, interactive prompt pills, typing indicator, and embedded mini metric widgets in ₹. |
| `/recommendations` | **Smart Recommendations** | Priority-ranked prescriptive advice cards (Critical, High, Medium, Opportunity) with metrics in ₹, suggested actions, and working "Mark Completed" / "Dismiss" state handlers. |
| `/reports` | **Financial Reports Center** | Pre-configured Profit & Loss (P&L), Sales Audit, OPEX Ledger, and Inventory Valuation reports in ₹ with print-friendly layout (`window.print()`) and functional CSV export for every report. |
| `/settings` | **System Settings** | Interactive business profile for Aarav Sharma, functional currency selector (`INR - Default`), timezone (`Asia/Kolkata - IST`), low-stock threshold buffers, and alert dispatch preferences. |

---

## 💻 How to Run Using PowerShell

Open PowerShell, navigate to the frontend directory, and run:

```powershell
# Navigate to the frontend directory
cd "c:\Users\acer\OneDrive\Desktop\AI-Business-Operations-Manager\Frontend"

# Start the Vite development server
npm run dev
```

The application will be live at:
👉 **`http://localhost:5173`** (or `http://127.0.0.1:5173`)
