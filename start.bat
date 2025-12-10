@echo off
title TeamTripTracker Development Server

echo 🚀 Starting TeamTripTracker Development Environment...
echo.

REM Check if we're in the right directory
if not exist "backend\" (
    echo ❌ Error: Please run this script from the project root directory
    echo    Current directory: %CD%
    echo    Expected structure: backend\ and frontend\ folders
    pause
    exit /b 1
)

if not exist "frontend\" (
    echo ❌ Error: Please run this script from the project root directory
    echo    Current directory: %CD%
    echo    Expected structure: backend\ and frontend\ folders
    pause
    exit /b 1
)

REM Start Backend Server
echo 🔧 Starting Backend Server (Python/FastAPI)...
cd backend

REM Check if virtual environment exists
if not exist "venv\" (
    echo ❌ Error: Virtual environment not found at backend\venv
    echo    Please create it first: python -m venv venv
    pause
    exit /b 1
)

REM Start backend in new window
start "Backend Server" cmd /k "venv\Scripts\activate && pip install -r requirements.txt --quiet && echo ✅ Backend starting on http://localhost:8000 && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

cd ..

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start Frontend Server
echo.
echo 🎨 Starting Frontend Server (Angular)...
cd frontend

REM Check if node_modules exists
if not exist "node_modules\" (
    echo 📦 Installing frontend dependencies...
    call npm install
)

REM Start frontend in new window
start "Frontend Server" cmd /k "echo ✅ Frontend starting on http://localhost:4200 && npm start"

cd ..

echo.
echo ✅ Both servers are starting up in separate windows...
echo.
echo 📱 Frontend: http://localhost:4200
echo 🔧 Backend:  http://65.1.94.243:8000
echo 📚 API Docs: http://65.1.94.243:8000/docs
echo.
echo Close the terminal windows to stop the servers
echo.
pause