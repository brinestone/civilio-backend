#!/bin/bash


DB_USER="$POSTGRES_USER"
DB_HOST="$POSTGRES_HOST"
DB_NAME="$POSTGRES_DATABASE"

if ! pg_isready -U "$DB_USER" -d "$DB_NAME" -h "$DB_HOST"; then
    echo "Error: database is not ready"
    exit 1
fi

echo "Database is ready"

MIGRATIONS_DIR="/drop/migrations"
if [ ! -d "$MIGRATIONS_DIR" ]; then
    echo "Error: directory '$MIGRATIONS_DIR' not found."
    exit 1
fi
PGPASSWORD="$POSTGRES_PASSWORD"
find "$MIGRATIONS_DIR" -type f -name "*.sql" | sort | while read -r sql_file; do
    echo "Executing '$sql_file'"
    psql -U "$DB_USER" -d "$DB_NAME" -h "$DB_HOST" -f "$sql_file"
    if [ $? -ne 0 ]; then
        echo "Error while executing '$sql_file'. Exiting."
        exit 1
    fi
    done
unset PGPASSWORD
echo "All files executed"