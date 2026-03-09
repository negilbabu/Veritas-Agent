# Use a lightweight Python image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# Install system dependencies needed for some Python packages
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file from the backend folder
COPY backend/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire backend application
COPY backend/ .

# Expose the port FastAPI runs on
EXPOSE 8000

# Command to run the server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]