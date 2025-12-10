# 🚀 Quick Start

## Development Environment Startup

Run both backend and frontend servers with one command!

### macOS/Linux:
```bash
./start.sh
```

### Windows:
```cmd
start.bat
```

## What it does:
- ✅ Checks for required directories and virtual environments
- 🔧 Starts FastAPI backend server on `http://localhost:8000`
- 🎨 Starts Angular frontend server on `http://localhost:4200`
- 📚 API documentation available at `http://localhost:8000/docs`
- 🛑 Press `Ctrl+C` to stop both servers (Linux/macOS) or close windows (Windows)

## Prerequisites:
- Backend: Virtual environment at `backend/venv`
- Frontend: Node.js and npm installed
- Run from project root directory

## Individual Server Commands:

### Backend only:
```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

### Frontend only:
```bash
cd frontend
npm start
```

## URLs:
- 📱 **Frontend App**: http://localhost:4200
- 🔧 **Backend API**: http://65.1.94.243:8000
- 📚 **API Documentation**: http://65.1.94.243:8000/docs
- 🔍 **ReDoc Documentation**: http://65.1.94.243:8000/redoc