#!/bin/bash

# CyberShield X — One-Command Setup
# Run: chmod +x setup.sh && ./setup.sh

set -e

echo "========================================"
echo "  CyberShield X — Setup"
echo "========================================"

# 1. Install server dependencies
echo ""
echo "[1/5] Installing server dependencies..."
cd server
npm install
cd ..

# 2. Install client dependencies
echo ""
echo "[2/5] Installing client dependencies..."
cd client
npm install
cd ..

# 3. Create .env file if it doesn't exist
if [ ! -f server/.env ]; then
  echo ""
  echo "[3/5] Creating server/.env file..."
  cat > server/.env << 'EOF'
PORT=5000
DATABASE_URL=postgresql://$(whoami)@localhost:5432/cybershield_x?host=/tmp
JWT_SECRET=cybershield_x_jwt_secret_key_2024
CSRF_SECRET=cybershield_x_csrf_secret_key_2024
SESSION_SECRET=cybershield_x_session_secret_2024
NODE_ENV=development
EOF
  echo "     Created server/.env — EDIT THIS if your PostgreSQL setup is different!"
else
  echo ""
  echo "[3/5] server/.env already exists, skipping"
fi

# 4. Create PostgreSQL database
echo ""
echo "[4/5] Setting up database..."
echo "     Make sure PostgreSQL is running!"
echo "     Attempting to create database 'cybershield_x'..."
createdb cybershield_x 2>/dev/null && echo "     Database created." || echo "     Database already exists or createdb failed — check PostgreSQL."

# 5. Initialize tables
echo ""
echo "[5/5] Initializing database tables..."
cd server
node db/init.js
cd ..

echo ""
echo "========================================"
echo "  Setup Complete!"
echo "========================================"
echo ""
echo "  To run the project:"
echo ""
echo "  Terminal 1 (Backend):"
echo "    cd server && npm run dev"
echo ""
echo "  Terminal 2 (Frontend):"
echo "    cd client && npm start"
echo ""
echo "  Then open: http://localhost:3000"
echo "========================================"
