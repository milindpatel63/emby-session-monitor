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

# Install Cloudflare Tunnel
RUN apt-get update && apt-get install -y wget && \
    wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb && \
    dpkg -i cloudflared-linux-amd64.deb && \
    rm cloudflared-linux-amd64.deb && \
    apt-get clean

# Expose the port the app runs on
EXPOSE 5023

# Run the application and Cloudflare Tunnel in the background
CMD ["sh", "-c", "cloudflared tunnel --no-autoupdate run --token ${CLOUDFLARE_TUNNEL_TOKEN} & hypercorn app:app -b 0.0.0.0:5023"]
