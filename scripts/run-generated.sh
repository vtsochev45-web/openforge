#!/bin/bash

# OpenForge - Run Generated App
# Usage: ./scripts/run-generated.sh [project-id]
# If no project-id provided, lists available projects

set -e

GENERATED_DIR="./generated"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 OpenForge - Run Generated App${NC}"
echo ""

# Check if generated directory exists
if [ ! -d "$GENERATED_DIR" ]; then
    echo -e "${RED}Error: No generated projects found${NC}"
    echo "Generate an app first at http://localhost:3000"
    exit 1
fi

# Get list of projects
PROJECTS=($(ls -1t "$GENERATED_DIR" 2>/dev/null || true))

if [ ${#PROJECTS[@]} -eq 0 ]; then
    echo -e "${RED}Error: No projects in generated/ directory${NC}"
    echo "Generate an app first at http://localhost:3000"
    exit 1
fi

# If project ID provided, use it
if [ -n "$1" ]; then
    PROJECT_ID="$1"
    PROJECT_DIR="$GENERATED_DIR/$PROJECT_ID"
    
    if [ ! -d "$PROJECT_DIR" ]; then
        echo -e "${RED}Error: Project '$PROJECT_ID' not found${NC}"
        echo ""
        echo "Available projects:"
        for p in "${PROJECTS[@]}"; do
            echo "  - $p"
        done
        exit 1
    fi
else
    # Show list and ask user to select
    echo "Available projects:"
    echo ""
    
    i=1
    for p in "${PROJECTS[@]}"; do
        # Get project name from project.json if exists
        if [ -f "$GENERATED_DIR/$p/project.json" ]; then
            NAME=$(cat "$GENERATED_DIR/$p/project.json" | grep '"name"' | head -1 | cut -d'"' -f4)
            echo -e "  ${GREEN}$i)${NC} $p ${YELLOW}($NAME)${NC}"
        else
            echo -e "  ${GREEN}$i)${NC} $p"
        fi
        ((i++))
    done
    
    echo ""
    read -p "Select project (number or ID): " SELECTION
    
    # Check if input is a number
    if [[ "$SELECTION" =~ ^[0-9]+$ ]] && [ "$SELECTION" -le "${#PROJECTS[@]}" ]; then
        PROJECT_ID="${PROJECTS[$((SELECTION-1))]}"
    else
        PROJECT_ID="$SELECTION"
    fi
    
    PROJECT_DIR="$GENERATED_DIR/$PROJECT_ID"
    
    if [ ! -d "$PROJECT_DIR" ]; then
        echo -e "${RED}Error: Project '$PROJECT_ID' not found${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${BLUE}📁 Project: ${GREEN}$PROJECT_ID${NC}"
echo ""

# Change to project directory
cd "$PROJECT_DIR"

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: No package.json found${NC}"
    exit 1
fi

# Check if already has node_modules
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
    echo ""
fi

# Check if it's a full-stack app (has prisma)
if [ -f "prisma/schema.prisma" ]; then
    echo -e "${YELLOW}🗄️  Database setup detected${NC}"
    
    # Check if .env exists
    if [ ! -f ".env" ]; then
        echo -e "${YELLOW}📝 Creating .env file...${NC}"
        
        # Generate random secret
        SECRET=$(openssl rand -base64 32 2>/dev/null || echo "your-secret-key-change-this")
        
        cat > .env << EOF
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="$SECRET"
NEXTAUTH_URL="http://localhost:3001"
EOF
        echo -e "${GREEN}✅ .env created${NC}"
    fi
    
    # Generate Prisma client
    if [ ! -d "node_modules/.prisma" ]; then
        echo -e "${YELLOW}🔧 Generating Prisma client...${NC}"
        npx prisma generate
    fi
    
    # Push database schema
    echo -e "${YELLOW}🗄️  Setting up database...${NC}"
    npx prisma db push --accept-data-loss
    echo ""
fi

# Find an available port
PORT=3001
while lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; do
    ((PORT++))
done

echo -e "${GREEN}🚀 Starting development server on port $PORT...${NC}"
echo ""
echo -e "${BLUE}App will be available at: ${GREEN}http://localhost:$PORT${NC}"
echo ""

# Start the app
PORT=$PORT npm run dev
