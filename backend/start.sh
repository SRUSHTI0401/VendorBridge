#!/bin/bash
# Run from vendorbridge/backend/

echo "=== VendorBridge Backend Setup ==="

# Create venv if not exists
if [ ! -d "venv" ]; then
  echo "Creating virtual environment..."
  python3 -m venv venv
fi

# Activate and install
echo "Installing dependencies..."
venv/bin/pip install -r requirements.txt --quiet

echo "Starting FastAPI server on http://localhost:8000"
echo "API Docs available at http://localhost:8000/docs"
echo ""
venv/bin/uvicorn main:app --reload --host 0.0.0.0 --port 8000
