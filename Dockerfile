# Use the official Python image from the Docker Hub
FROM python:3.9-slim

# Set the working directory in the container
WORKDIR /app

# Copy the backend folder contents to the working directory
COPY backend/ /app/backend

# Move to the backend directory
WORKDIR /app/backend

# Install any necessary dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the frontend folder as well to the working directory
COPY frontend/ /app/frontend

# Set the working directory to the backend where app.py is located
WORKDIR /app/backend

# Expose the port the app runs on
EXPOSE 5023

# Run the application using Gunicorn with Quart worker
CMD ["gunicorn", "-k", "quart.worker.GunicornUVLoopWorker", "-b", "0.0.0.0:5023", "app:app"]
