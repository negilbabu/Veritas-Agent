FROM python:3.10-slim

WORKDIR /app

RUN apt-get update && apt-get install -y gcc python3-dev && rm -rf /var/lib/apt/lists/*

# Force the small CPU-only Torch first
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

# Now install the rest of the requirements
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]