FROM python:3.10-slim

WORKDIR /app

# 1. Install system dependencies
RUN apt-get update && apt-get install -y gcc python3-dev && rm -rf /var/lib/apt/lists/*

# 2. Install Torch CPU first
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

# 3. Copy requirements and install
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 4. Copy everything from your backend folder
# (Make sure you are building from the project root)
COPY backend/ .

EXPOSE 8000

# 5. The "Magic" CMD
# This does exactly what the script did, but directly in Docker.
# It uses the shell form to allow the $PORT variable to work.
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}