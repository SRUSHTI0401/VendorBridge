#!/bin/bash
# Run from vendorbridge/frontend/

echo "=== VendorBridge Frontend Setup ==="
echo "Installing dependencies..."
npm install

echo "Starting development server on http://localhost:5173"
npm run dev
