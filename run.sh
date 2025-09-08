#!/bin/bash

# Inkwell Development Server Launcher
# This script starts backend and frontend in background with logging and exits

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Development ports (different from production)
DEV_BACKEND_PORT=7893
DEV_FRONTEND_PORT=7894

# Log and PID file paths
LOG_DIR=".dev_logs"
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"
PID_FILE="$LOG_DIR/pids.txt"

echo -e "${BLUE}🚀 Starting Inkwell Development Environment${NC}"

# Check if we're in the correct directory
if [ ! -f "pyproject.toml" ]; then
    echo -e "${RED}❌ Error: Please run this script from the inkwell-internal root directory${NC}"
    exit 1
fi

# Create logs directory
mkdir -p "$LOG_DIR"

# Function to rotate logs (keep last 1000 lines)
rotate_log() {
    local logfile=$1
    if [ -f "$logfile" ] && [ $(wc -l < "$logfile" 2>/dev/null || echo "0") -gt 1000 ]; then
        echo -e "${YELLOW}📋 Rotating log file: $logfile${NC}"
        tail -n 1000 "$logfile" > "$logfile.tmp" && mv "$logfile.tmp" "$logfile"
    fi
}

# Rotate existing logs
rotate_log "$BACKEND_LOG"
rotate_log "$FRONTEND_LOG"

# Function to kill processes on specific ports
kill_port_processes() {
    local port=$1
    local service_name=$2
    
    echo -e "${YELLOW}🔍 Checking for existing processes on port ${port}...${NC}"
    
    # Find processes using the port (works on both macOS and Linux)
    local pids=$(lsof -ti :${port} 2>/dev/null || true)
    
    if [ ! -z "$pids" ]; then
        echo -e "${YELLOW}🛑 Found existing ${service_name} process(es) on port ${port}, stopping them...${NC}"
        echo "$pids" | xargs kill -TERM 2>/dev/null || true
        sleep 2
        
        # Force kill if still running
        local remaining_pids=$(lsof -ti :${port} 2>/dev/null || true)
        if [ ! -z "$remaining_pids" ]; then
            echo -e "${YELLOW}🔥 Force killing remaining processes...${NC}"
            echo "$remaining_pids" | xargs kill -KILL 2>/dev/null || true
            sleep 1
        fi
        echo -e "${GREEN}✓ Port ${port} cleared${NC}"
    else
        echo -e "${GREEN}✓ Port ${port} is available${NC}"
    fi
}

# Stop any existing processes on our development ports
kill_port_processes $DEV_BACKEND_PORT "backend"
kill_port_processes $DEV_FRONTEND_PORT "frontend"

# Install Python dependencies if needed
echo -e "${YELLOW}📦 Checking Python dependencies...${NC}"
if ! python -c "import fastapi, uvicorn, click, aiosqlite" 2>/dev/null; then
    echo -e "${YELLOW}Installing Python dependencies...${NC}"
    pip install -r requirements.txt
else
    echo -e "${GREEN}✓ Python dependencies available${NC}"
fi

# Check if Node.js dependencies are installed
echo -e "${YELLOW}📦 Checking Node.js dependencies...${NC}"
cd frontend
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing Node.js dependencies...${NC}"
    npm install
else
    echo -e "${GREEN}✓ Node.js dependencies available${NC}"
fi
cd ..

# Initialize database (using the development database path)
echo -e "${YELLOW}🗄️ Initializing database...${NC}"
export INKWELL_DB_PATH="./.dev_database/inkwell_dev.db"
mkdir -p .dev_database
python -c "
import sys
sys.path.insert(0, '.')
from pathlib import Path
from inkwell.database import init_database
from inkwell.config import config
config.database_path = Path('.dev_database/inkwell_dev.db')
config.ensure_inkwell_directory = lambda: None
init_database()
print('Development database initialized')
"

# Start backend server in background with logging
echo -e "${BLUE}🔧 Starting FastAPI backend on port ${DEV_BACKEND_PORT}...${NC}"
PYTHONPATH=. nohup python -c "
import uvicorn
from inkwell.server import app
from inkwell.config import config
from pathlib import Path
import os

# Override config for development
config.backend_port = ${DEV_BACKEND_PORT}
config.database_path = Path('.dev_database/inkwell_dev.db')

# Set environment variable for database path
os.environ['INKWELL_DB_PATH'] = '.dev_database/inkwell_dev.db'

# Start server
uvicorn.run(
    'inkwell.server:app',
    host='127.0.0.1',
    port=${DEV_BACKEND_PORT},
    reload=True,
    access_log=True
)
" > "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Configure frontend for development
echo -e "${BLUE}⚛️  Configuring frontend for development...${NC}"
cd frontend

# Create a temporary package.json with the correct proxy and port
cp package.json package.json.backup
sed 's/"proxy": "http:\/\/localhost:7891"/"proxy": "http:\/\/localhost:'${DEV_BACKEND_PORT}'"/' package.json.backup | \
sed 's/"start": "PORT=7892 react-scripts start"/"start": "PORT='${DEV_FRONTEND_PORT}' react-scripts start"/' > package.json

# Start frontend server in background with logging
echo -e "${BLUE}⚛️  Starting React frontend on port ${DEV_FRONTEND_PORT}...${NC}"
BROWSER=none PORT=${DEV_FRONTEND_PORT} nohup npm start > "../$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!

# Restore original package.json after a delay
(sleep 10 && mv package.json.backup package.json) &

cd ..

# Save PIDs to file for stop script
echo "BACKEND_PID=$BACKEND_PID" > "$PID_FILE"
echo "FRONTEND_PID=$FRONTEND_PID" >> "$PID_FILE"
echo "DEV_BACKEND_PORT=$DEV_BACKEND_PORT" >> "$PID_FILE"
echo "DEV_FRONTEND_PORT=$DEV_FRONTEND_PORT" >> "$PID_FILE"

# Wait a moment to ensure services start
sleep 2

echo ""
echo -e "${GREEN}✅ Development environment started successfully!${NC}"
echo ""
echo -e "${GREEN}🌐 Frontend: http://localhost:${DEV_FRONTEND_PORT}${NC}"
echo -e "${GREEN}🔌 Backend API: http://localhost:${DEV_BACKEND_PORT}${NC}"
echo -e "${GREEN}📚 API Docs: http://localhost:${DEV_BACKEND_PORT}/docs${NC}"
echo ""
echo -e "${YELLOW}📋 Logs:${NC}"
echo -e "   Backend: ${BACKEND_LOG}"
echo -e "   Frontend: ${FRONTEND_LOG}"
echo ""
echo -e "${BLUE}📊 Monitor logs: ${NC}tail -f ${BACKEND_LOG}"
echo -e "${BLUE}🛑 Stop servers: ${NC}./stop.sh"
echo ""
echo -e "${YELLOW}💡 The development database is stored in .dev_database/inkwell_dev.db${NC}"
echo -e "${YELLOW}🔄 Both servers will auto-reload on file changes${NC}"
echo ""

# Wait a moment for frontend to fully start, then open browser
echo -e "${BLUE}🌐 Opening browser...${NC}"
sleep 3

# Cross-platform browser opening
if command -v open >/dev/null 2>&1; then
    # macOS
    open "http://localhost:${DEV_FRONTEND_PORT}"
elif command -v xdg-open >/dev/null 2>&1; then
    # Linux
    xdg-open "http://localhost:${DEV_FRONTEND_PORT}"
elif command -v start >/dev/null 2>&1; then
    # Windows (Git Bash/WSL)
    start "http://localhost:${DEV_FRONTEND_PORT}"
else
    echo -e "${YELLOW}⚠️  Could not detect system browser opener. Please manually open: http://localhost:${DEV_FRONTEND_PORT}${NC}"
fi