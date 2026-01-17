#!/bin/bash

echo "=== MCP Discovery API Setup ==="
echo ""

# Check if .env already exists
if [ -f .env ]; then
    echo "Warning: .env file already exists!"
    read -p "Overwrite? (y/n): " overwrite
    if [ "$overwrite" != "y" ]; then
        echo "Keeping existing .env file"
        exit 0
    fi
fi

echo "Please enter your credentials:"
echo ""

# Supabase URL
read -p "Supabase Project URL (e.g., https://xxx.supabase.co): " SUPABASE_URL

# Supabase Service Role Key
echo "Supabase Service Role Key (from Project Settings > API > service_role):"
read -s SUPABASE_KEY
echo ""

# OpenAI API Key
echo "OpenAI API Key (from platform.openai.com/api-keys):"
read -s OPENAI_KEY
echo ""

# Create .env file
cat > .env << EOF
# MCP Discovery API Environment Variables
SUPABASE_URL=$SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_KEY
OPENAI_API_KEY=$OPENAI_KEY
LOG_LEVEL=info
EOF

echo ""
echo "Created .env file successfully!"
echo ""
echo "Next steps:"
echo "1. Run the schema in Supabase SQL Editor (copy from src/db/schema.sql)"
echo "2. Seed the database: npm run seed"
echo "3. Generate embeddings: npm run generate-embeddings"
echo "4. Deploy to Railway: railway up"
