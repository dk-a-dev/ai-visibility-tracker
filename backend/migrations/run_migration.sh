#!/bin/bash
# Run database migration to add gemini_visibility column

echo "🔄 Running database migration: add_gemini_visibility"
echo "=================================================="

# Get database connection details from environment or use defaults
DB_HOST=${POSTGRES_HOST:-localhost}
DB_PORT=${POSTGRES_PORT:-5432}
DB_NAME=${POSTGRES_DB:-ai_visibility}
DB_USER=${POSTGRES_USER:-devuser}

# Check if running in Docker
if [ -f /.dockerenv ]; then
    echo "Running inside Docker container"
    DB_HOST="postgres"
fi

# Run the migration
PGPASSWORD=${POSTGRES_PASSWORD:-devpass} psql \
    -h $DB_HOST \
    -p $DB_PORT \
    -U $DB_USER \
    -d $DB_NAME \
    -f /app/migrations/add_gemini_visibility.sql

if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully"
else
    echo "❌ Migration failed"
    exit 1
fi
