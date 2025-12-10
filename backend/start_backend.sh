#!/bin/bash

# TeamTripTracker Backend Daemon Startup Script
# This script starts the FastAPI backend as a daemon service

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_NAME="teamtriptracker-backend"
PID_FILE="/tmp/${PROJECT_NAME}.pid"
LOG_FILE="/tmp/${PROJECT_NAME}.log"
ERROR_LOG_FILE="/tmp/${PROJECT_NAME}.error.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 TeamTripTracker Backend Daemon Manager${NC}"
echo "================================================"

# Function to check if daemon is running
is_running() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            return 0
        else
            rm -f "$PID_FILE"
            return 1
        fi
    fi
    return 1
}

# Function to start the daemon
start_daemon() {
    if is_running; then
        echo -e "${YELLOW}⚠️  Backend is already running (PID: $(cat $PID_FILE))${NC}"
        echo -e "   Use './start_backend.sh status' to check or './start_backend.sh stop' to stop"
        return 1
    fi

    echo -e "${BLUE}🔧 Starting backend daemon...${NC}"

    # Check if virtual environment exists
    if [ ! -d "venv" ]; then
        echo -e "${RED}❌ Error: Virtual environment not found${NC}"
        echo "   Please create it first: python3 -m venv venv"
        return 1
    fi

    # Check if requirements are installed
    echo "📦 Checking dependencies..."
    source venv/bin/activate
    pip install -r requirements.txt --quiet

    # Start the daemon
    echo "🌐 Starting FastAPI server as daemon..."
    
    # Start uvicorn in background with nohup
    nohup venv/bin/uvicorn app.main:app \
        --host 0.0.0.0 \
        --port 8000 \
        --reload \
        > "$LOG_FILE" 2> "$ERROR_LOG_FILE" &
    
    # Save PID
    echo $! > "$PID_FILE"
    
    # Wait a moment to check if it started successfully
    sleep 2
    
    if is_running; then
        PID=$(cat "$PID_FILE")
        echo -e "${GREEN}✅ Backend daemon started successfully!${NC}"
        echo "   PID: $PID"
        echo "   Backend URL: http://localhost:8000"
        echo "   API Docs: http://localhost:8000/docs"
        echo "   Logs: $LOG_FILE"
        echo "   Error logs: $ERROR_LOG_FILE"
    else
        echo -e "${RED}❌ Failed to start backend daemon${NC}"
        echo "Check error logs: $ERROR_LOG_FILE"
        return 1
    fi
}

# Function to stop the daemon
stop_daemon() {
    if ! is_running; then
        echo -e "${YELLOW}⚠️  Backend daemon is not running${NC}"
        return 1
    fi

    PID=$(cat "$PID_FILE")
    echo -e "${BLUE}🛑 Stopping backend daemon (PID: $PID)...${NC}"
    
    kill "$PID"
    
    # Wait for process to stop
    local count=0
    while ps -p "$PID" > /dev/null 2>&1 && [ $count -lt 10 ]; do
        sleep 1
        count=$((count + 1))
    done
    
    if ps -p "$PID" > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Process didn't stop gracefully, forcing...${NC}"
        kill -9 "$PID"
    fi
    
    rm -f "$PID_FILE"
    echo -e "${GREEN}✅ Backend daemon stopped${NC}"
}

# Function to restart the daemon
restart_daemon() {
    echo -e "${BLUE}🔄 Restarting backend daemon...${NC}"
    stop_daemon
    sleep 2
    start_daemon
}

# Function to show daemon status
status_daemon() {
    echo -e "${BLUE}📊 Backend Daemon Status${NC}"
    echo "------------------------"
    
    if is_running; then
        PID=$(cat "$PID_FILE")
        echo -e "${GREEN}✅ Status: Running${NC}"
        echo "   PID: $PID"
        echo "   Backend URL: http://localhost:8000"
        echo "   API Docs: http://localhost:8000/docs"
        echo "   Log file: $LOG_FILE"
        echo "   Error log: $ERROR_LOG_FILE"
        
        # Show recent logs
        if [ -f "$LOG_FILE" ]; then
            echo ""
            echo "📝 Recent logs (last 10 lines):"
            tail -10 "$LOG_FILE"
        fi
    else
        echo -e "${RED}❌ Status: Not running${NC}"
    fi
}

# Function to show logs
logs_daemon() {
    if [ ! -f "$LOG_FILE" ]; then
        echo -e "${YELLOW}⚠️  No log file found${NC}"
        return 1
    fi
    
    echo -e "${BLUE}📝 Backend Logs (Press Ctrl+C to stop)${NC}"
    echo "======================================"
    tail -f "$LOG_FILE"
}

# Main script logic
case "${1:-start}" in
    start)
        start_daemon
        ;;
    stop)
        stop_daemon
        ;;
    restart)
        restart_daemon
        ;;
    status)
        status_daemon
        ;;
    logs)
        logs_daemon
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs}"
        echo ""
        echo "Commands:"
        echo "  start   - Start the backend daemon"
        echo "  stop    - Stop the backend daemon"
        echo "  restart - Restart the backend daemon"
        echo "  status  - Show daemon status and recent logs"
        echo "  logs    - Follow live logs (Ctrl+C to stop)"
        echo ""
        echo "Examples:"
        echo "  ./start_backend.sh start"
        echo "  ./start_backend.sh status"
        echo "  ./start_backend.sh logs"
        exit 1
        ;;
esac