#!/bin/sh
set -e

# Ensure data and logs directories exist
mkdir -p /app/data /app/logs

# Initialize database if it doesn't exist
if [ ! -f /app/data/shift_logs.db ]; then
  echo "Initializing database..."
  cd /app
  node server/database/setup.js
  EXIT_CODE=$?
  if [ $EXIT_CODE -ne 0 ]; then
    echo "ERROR: Database initialization failed with exit code $EXIT_CODE!"
    exit 1
  fi
  echo "Database initialized successfully."
else
  echo "Database already exists, skipping initialization."
fi

# Start the server
echo "Starting server..."
cd /app
exec node server/index.js


