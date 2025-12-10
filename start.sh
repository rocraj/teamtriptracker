#!/bin/bash

# TeamTripTracker Development Server Startup Script
echo "🚀 Starting TeamTripTracker Development Environment..."
echo ""

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $(jobs -p) 2>/dev/null
    exit 0
}

# Trap Ctrl+C to cleanup
trap cleanup SIGINT

# Check if we're in the right directory
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    echo "   Current directory: $(pwd)"
    echo "   Expected structure: backend/ and frontend/ folders"
    exit 1
fi

# Start Backend Server
echo "🔧 Starting Backend Server (Python/FastAPI)..."
cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Error: Virtual environment not found at backend/venv"
    echo "   Please create it first: python3 -m venv venv"
    exit 1
fi

# Activate virtual environment and start backend
(
    source venv/bin/activate
    echo "✅ Backend virtual environment activated"
    echo "📦 Installing/updating backend dependencies..."
    pip install -r requirements.txt --quiet
    echo "🌐 Starting FastAPI server on http://localhost:8000"
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
) &

BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start Frontend Server
echo ""
echo "🎨 Starting Frontend Server (Angular)..."
cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

echo "🌐 Starting Angular dev server on http://localhost:4200"
(
    npm start
) &

FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Both servers are starting up..."
echo ""
echo "📱 Frontend: http://localhost:4200"
echo "🔧 Backend:  http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for both processes
wait