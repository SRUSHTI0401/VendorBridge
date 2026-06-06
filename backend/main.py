from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base
from app.models import models  # noqa - ensure models are imported before create_all
from app.routers import auth, vendors, rfqs, quotations, approvals, purchase_orders, activity, dashboard, users

app = FastAPI(title="VendorBridge API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables
Base.metadata.create_all(bind=engine)

# Include routers
app.include_router(auth.router)
app.include_router(vendors.router)
app.include_router(rfqs.router)
app.include_router(quotations.router)
app.include_router(approvals.router)
app.include_router(purchase_orders.router)
app.include_router(activity.router)
app.include_router(dashboard.router)
app.include_router(users.router)

@app.get("/")
def root():
    return {"message": "VendorBridge API is running", "docs": "/docs"}
