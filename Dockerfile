# Step 1: Set base image
FROM python:3.10-slim

# Step 2: Set the working directory in the container
WORKDIR /app

# Step 3: Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Step 4: Copy the project files into the container
COPY . .

# Step 5: Expose the port the app runs on
EXPOSE 5023

# Step 6: Set environment variables
ENV FLASK_APP=app.py
ENV FLASK_ENV=production

# Step 7: Run the app
CMD ["flask", "run", "--host=0.0.0.0", "--port=5023"]
