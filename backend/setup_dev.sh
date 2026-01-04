#!/bin/bash

# AI Visibility Tracker - Development Startup Script
# This script starts all necessary services for local development

set -e

echo "================================================"
echo "AI Visibility Tracker - Development Setup"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found!${NC}"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo -e "${GREEN}✅ Created .env file${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  Please edit .env and add your API keys:${NC}"
    echo "   - OPENAI_API_KEY"
    echo "   - ANTHROPIC_API_KEY"
    echo ""
    read -p "Press Enter after you've added your API keys..."
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Creating Python virtual environment...${NC}"
    python3 -m venv venv
    echo -e "${GREEN}✅ Virtual environment created${NC}"
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt > /dev/null 2>&1
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Check PostgreSQL
echo "Checking PostgreSQL..."
if ! pg_isready -q; then
    echo -e "${RED}❌ PostgreSQL is not running${NC}"
    echo "Please start PostgreSQL and try again"
    exit 1
fi
echo -e "${GREEN}✅ PostgreSQL is running${NC}"

# Check Redis
echo "Checking Redis..."
if ! redis-cli ping > /dev/null 2>&1; then
    echo -e "${RED}❌ Redis is not running${NC}"
    echo "Please start Redis and try again"
    exit 1
fi
echo -e "${GREEN}✅ Redis is running${NC}"
echo ""

# Initialize database
echo "Initializing database..."
python scripts/init_db.py init
echo ""

# Test setup
echo "Testing setup..."
python scripts/test_setup.py
echo ""

echo "================================================"
echo -e "${GREEN}✅ Setup complete!${NC}"
echo "================================================"
echo ""
echo "To start the application, run these commands in separate terminals:"
echo ""
echo -e "${YELLOW}Terminal 1 - API Server:${NC}"
echo "  cd backend"
echo "  source venv/bin/activate"
echo "  uvicorn app.main:app --reload"
echo ""
echo -e "${YELLOW}Terminal 2 - Celery Worker:${NC}"
echo "  cd backend"
echo "  source venv/bin/activate"
echo "  celery -A app.worker.celery_app worker --loglevel=info"
echo ""
echo -e "${YELLOW}Terminal 3 - Celery Flower (optional):${NC}"
echo "  cd backend"
echo "  source venv/bin/activate"
echo "  celery -A app.worker.celery_app flower"
echo ""
echo "Or use Docker Compose from the root directory:"
echo "  docker-compose up"
echo ""
echo "================================================"
