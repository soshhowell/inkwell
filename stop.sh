#!/bin/bash

# Inkwell Development Server Stop Script
# This script gracefully stops the development servers started by run.sh

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Log and PID file paths
LOG_DIR=".dev_logs"
PID_FILE="$LOG_DIR/pids.txt"

echo -e "${BLUE}🛑 Stopping Inkwell Development Environment${NC}"

# Check if PID file exists
if [ ! -f "$PID_FILE" ]; then
    echo -e "${YELLOW}⚠️  No PID file found. Services may not be running or were started manually.${NC}"
    echo -e "${YELLOW}Checking for processes on development ports...${NC}"
    
    # Try to find and stop processes on development ports
    BACKEND_PORT_PIDS=$(lsof -ti :7893 2>/dev/null || true)
    FRONTEND_PORT_PIDS=$(lsof -ti :7894 2>/dev/null || true)
    
    if [ ! -z "$BACKEND_PORT_PIDS" ]; then
        echo -e "${YELLOW}🛑 Found processes on port 7893, stopping them...${NC}"
        echo "$BACKEND_PORT_PIDS" | xargs kill -TERM 2>/dev/null || true
        sleep 2
        # Force kill if still running
        REMAINING_BACKEND=$(lsof -ti :7893 2>/dev/null || true)
        if [ ! -z "$REMAINING_BACKEND" ]; then
            echo "$REMAINING_BACKEND" | xargs kill -KILL 2>/dev/null || true
        fi
        echo -e "${GREEN}✓ Backend processes stopped${NC}"
    fi
    
    if [ ! -z "$FRONTEND_PORT_PIDS" ]; then
        echo -e "${YELLOW}🛑 Found processes on port 7894, stopping them...${NC}"
        echo "$FRONTEND_PORT_PIDS" | xargs kill -TERM 2>/dev/null || true
        sleep 2
        # Force kill if still running
        REMAINING_FRONTEND=$(lsof -ti :7894 2>/dev/null || true)
        if [ ! -z "$REMAINING_FRONTEND" ]; then
            echo "$REMAINING_FRONTEND" | xargs kill -KILL 2>/dev/null || true
        fi
        echo -e "${GREEN}✓ Frontend processes stopped${NC}"
    fi
    
    if [ -z "$BACKEND_PORT_PIDS" ] && [ -z "$FRONTEND_PORT_PIDS" ]; then
        echo -e "${GREEN}✓ No development processes found running${NC}"
    fi
    
    exit 0
fi

# Source the PID file to get process IDs
source "$PID_FILE"

# Function to stop a process gracefully
stop_process() {
    local pid=$1
    local name=$2
    
    if [ -z "$pid" ]; then
        echo -e "${YELLOW}⚠️  No PID found for $name${NC}"
        return
    fi
    
    # Check if process is still running
    if ! kill -0 "$pid" 2>/dev/null; then
        echo -e "${YELLOW}⚠️  $name process (PID: $pid) is not running${NC}"
        return
    fi
    
    echo -e "${YELLOW}🛑 Stopping $name (PID: $pid)...${NC}"
    
    # Try graceful shutdown first
    kill -TERM "$pid" 2>/dev/null || true
    
    # Wait up to 5 seconds for graceful shutdown
    for i in {1..5}; do
        if ! kill -0 "$pid" 2>/dev/null; then
            echo -e "${GREEN}✓ $name stopped gracefully${NC}"
            return
        fi
        sleep 1
    done
    
    # Force kill if still running
    echo -e "${YELLOW}🔥 Force stopping $name...${NC}"
    kill -KILL "$pid" 2>/dev/null || true
    sleep 1
    
    if ! kill -0 "$pid" 2>/dev/null; then
        echo -e "${GREEN}✓ $name force stopped${NC}"
    else
        echo -e "${RED}❌ Failed to stop $name (PID: $pid)${NC}"
    fi
}

# Stop backend process
stop_process "$BACKEND_PID" "Backend"

# Stop frontend process
stop_process "$FRONTEND_PID" "Frontend"

# Also check and clean up any remaining processes on the ports
echo -e "${YELLOW}🔍 Checking for remaining processes on development ports...${NC}"

# Clean up backend port
REMAINING_BACKEND=$(lsof -ti :${DEV_BACKEND_PORT:-7893} 2>/dev/null || true)
if [ ! -z "$REMAINING_BACKEND" ]; then
    echo -e "${YELLOW}🛑 Found remaining processes on backend port, stopping them...${NC}"
    echo "$REMAINING_BACKEND" | xargs kill -TERM 2>/dev/null || true
    sleep 2
    STILL_REMAINING_BACKEND=$(lsof -ti :${DEV_BACKEND_PORT:-7893} 2>/dev/null || true)
    if [ ! -z "$STILL_REMAINING_BACKEND" ]; then
        echo "$STILL_REMAINING_BACKEND" | xargs kill -KILL 2>/dev/null || true
    fi
fi

# Clean up frontend port
REMAINING_FRONTEND=$(lsof -ti :${DEV_FRONTEND_PORT:-7894} 2>/dev/null || true)
if [ ! -z "$REMAINING_FRONTEND" ]; then
    echo -e "${YELLOW}🛑 Found remaining processes on frontend port, stopping them...${NC}"
    echo "$REMAINING_FRONTEND" | xargs kill -TERM 2>/dev/null || true
    sleep 2
    STILL_REMAINING_FRONTEND=$(lsof -ti :${DEV_FRONTEND_PORT:-7894} 2>/dev/null || true)
    if [ ! -z "$STILL_REMAINING_FRONTEND" ]; then
        echo "$STILL_REMAINING_FRONTEND" | xargs kill -KILL 2>/dev/null || true
    fi
fi

# Remove PID file
if [ -f "$PID_FILE" ]; then
    rm "$PID_FILE"
    echo -e "${GREEN}✓ Cleaned up PID file${NC}"
fi

echo ""
echo -e "${GREEN}✅ Development environment stopped successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Logs are preserved in:${NC}"
echo -e "   Backend: $LOG_DIR/backend.log"
echo -e "   Frontend: $LOG_DIR/frontend.log"
echo ""
echo -e "${BLUE}🚀 Start again with: ${NC}./run.sh"
echo ""