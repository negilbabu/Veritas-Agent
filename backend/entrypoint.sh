#!/bin/sh
# This script evaluates the PORT variable and then 'execs' uvicorn
# Using exec ensures uvicorn becomes PID 1 and handles signals correctly.

# Default to 8000 if PORT is not set
PORT="${PORT:-8000}"

echo "Starting Veritas Backend on port $PORT..."
exec uvicorn app.main:app --host 0.0.0.0 --port "$PORT"