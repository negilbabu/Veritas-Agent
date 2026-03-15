FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y gcc python3-dev && rm -rf /var/lib/apt/lists/*

# Install Torch CPU first
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

# 1. Copy requirements from the backend folder
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 2. Copy the entrypoint script specifically (since we need to chmod it)
# It is located at backend/entrypoint.sh
COPY backend/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# 3. Copy everything else from the backend folder into /app
COPY backend/ .

EXPOSE 8000

ENTRYPOINT ["/app/entrypoint.sh"]