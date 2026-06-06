# VendorBridge — Procurement & Vendor Management ERP

A full-stack ERP application built with **React + FastAPI + PostgreSQL**.

---

## Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | React 18, Vite, React Router, Recharts, Axios |
| Backend   | FastAPI, SQLAlchemy ORM, Pydantic v2 |
| Database  | PostgreSQL                        |
| Auth      | JWT (python-jose) + bcrypt        |
| PDF       | ReportLab                         |

---

## Screens Implemented

1. **Login / Register** — JWT auth, role-based access
2. **Dashboard** — KPI cards, recent POs, quick actions
3. **Vendor Management** — CRUD, status tracking, GST details
4. **RFQ Creation** — 3-step wizard (details → line items → assign vendors)
5. **Vendor Quotation Submission** — Pricing, GST calc, line items
6. **Quotation Comparison** — Side-by-side, lowest price highlight
7. **Approval Workflow** — L1 → L2 → Generate PO stages
8. **Purchase Order & Invoice** — Auto PO number, PDF download
9. **Activity Logs** — Immutable audit trail, filterable
10. **Reports & Analytics** — Charts, vendor stats, PO trends

---

## Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **PostgreSQL 14+**

---

## Setup Instructions

### Step 1 — PostgreSQL Database

Open `psql` as superuser and run:

```bash
psql -U postgres -f setup_db.sql
```

Or manually:

```sql
CREATE USER vendorbridge WITH PASSWORD 'vendorbridge123';
CREATE DATABASE vendorbridge_db OWNER vendorbridge;
GRANT ALL PRIVILEGES ON DATABASE vendorbridge_db TO vendorbridge;
\c vendorbridge_db
GRANT ALL ON SCHEMA public TO vendorbridge;
```

---

### Step 2 — Backend (FastAPI)

```bash
cd vendorbridge/backend

# Create virtual environment
python3 -m venv venv

# Activate (Linux/Mac)
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment (edit if needed)
# Default DATABASE_URL = postgresql://vendorbridge:vendorbridge123@localhost:5432/vendorbridge_db
cp .env .env  # already present

# Start the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend starts at **http://localhost:8000**  
Swagger UI: **http://localhost:8000/docs**

> Tables are auto-created on first startup via SQLAlchemy.

---

### Step 3 — Frontend (React)

Open a **new terminal**:

```bash
cd vendorbridge/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs at **http://localhost:5173**

---

## Quick Start (both servers at once)

### Linux/Mac

```bash
# Terminal 1 — Backend
cd backend && source venv/bin/activate && uvicorn main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend && npm run dev
```

### Windows

```bat
# Terminal 1
cd backend
venv\Scripts\activate
uvicorn main:app --reload --port 8000

# Terminal 2
cd frontend
npm run dev
```

---

## First Login

1. Go to http://localhost:5173
2. Click **Register** and create an account
3. Choose role: `procurement_officer`, `manager`, `vendor`, or `admin`
4. Login and explore the dashboard

---

## User Roles

| Role | Capabilities |
|------|-------------|
| `procurement_officer` | Create RFQs, compare quotes, generate POs/invoices |
| `vendor` | Submit quotations, track RFQ status |
| `manager` | Approve/reject procurement requests |
| `admin` | Manage users, vendors, view analytics |

---

## Full Procurement Workflow

```
1. Register vendors → Vendors page
2. Create RFQ → RFQ's page (assign vendors)
3. Publish RFQ → sends to vendors
4. Submit quotations → Quotations page (per vendor)
5. Compare quotations → Compare Quotes page
6. Select best quote → initiates Approval Workflow
7. L1 Approval → L2 Approval → PO Auto-generated
8. Download PDF invoice → Invoices page
9. Mark as paid
10. Track everything → Activity & Logs
```

---

## Environment Variables (backend/.env)

```
DATABASE_URL=postgresql://vendorbridge:vendorbridge123@localhost:5432/vendorbridge_db
SECRET_KEY=vendorbridge-super-secret-key-2024-change-in-production
```

---

## Project Structure

```
vendorbridge/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── database.py      # SQLAlchemy engine + session
│   │   │   └── security.py      # JWT + password hashing
│   │   ├── models/
│   │   │   └── models.py        # All SQLAlchemy models
│   │   ├── schemas/
│   │   │   └── schemas.py       # Pydantic request/response schemas
│   │   └── routers/
│   │       ├── auth.py          # Login, register
│   │       ├── vendors.py       # Vendor CRUD
│   │       ├── rfqs.py          # RFQ management
│   │       ├── quotations.py    # Quotation submission
│   │       ├── approvals.py     # Approval workflow
│   │       ├── purchase_orders.py # PO + PDF generation
│   │       ├── dashboard.py     # Stats API
│   │       ├── activity.py      # Audit logs
│   │       └── users.py         # User management
│   ├── main.py                  # FastAPI app entry point
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── api/index.js         # Axios API client
│   │   ├── context/AuthContext.jsx
│   │   ├── components/
│   │   │   ├── Layout.jsx
│   │   │   └── Sidebar.jsx
│   │   └── pages/
│   │       ├── Login.jsx
│   │       ├── Register.jsx
│   │       ├── Dashboard.jsx
│   │       ├── Vendors.jsx
│   │       ├── RFQs.jsx
│   │       ├── Quotations.jsx
│   │       ├── QuotationComparison.jsx
│   │       ├── Approvals.jsx
│   │       ├── PurchaseOrders.jsx
│   │       ├── Invoices.jsx
│   │       ├── Reports.jsx
│   │       └── Activity.jsx
│   ├── package.json
│   └── vite.config.js
│
├── setup_db.sql                 # PostgreSQL setup script
└── README.md
```

---

## Troubleshooting

**"Module not found" on backend startup**
→ Make sure venv is activated and `pip install -r requirements.txt` completed

**PostgreSQL connection refused**
→ Check PostgreSQL is running: `sudo systemctl start postgresql`
→ Verify credentials match `.env`

**CORS errors in browser**
→ Make sure backend is running on port 8000
→ Frontend must be on port 5173 (default Vite)

**PDF download fails**
→ ReportLab must be installed: `pip install reportlab`

---

## API Documentation

Full Swagger docs available at: **http://localhost:8000/docs**  
ReDoc: **http://localhost:8000/redoc**

## Team Details

| Name | GitHub |
|------|--------|
| Bhinsra Om | [@om-bhinsara](https://github.com/om-bhinsara) |
| DHRUVIL DAVE | [@dhruvildave235](https://github.com/dhruvildave235) |
| Hetvi | [@hetvi1422](https://github.com/hetvi1422) |
| Srushti | [@SRUSHTI0401](https://github.com/SRUSHTI0401) |