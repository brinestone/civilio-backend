#!/bin/bash

USER="$POSTGRES_USERNAME"
DB_NAME="$POSTGRES_DATABASE"
BACKUP_FILE="$BACKUP_FILENAME"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Backup file $BACKUP_FILE does not exist. Exiting with success."
    exit 0
fi

pg_restore -U $USER -d $DB_NAME -O "/$BACKUP_FILENAME"
