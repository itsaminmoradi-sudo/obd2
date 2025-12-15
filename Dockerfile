# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code into the container
COPY app/ ./app
COPY pids/ ./pids

# Make port 8000 available to the world outside this container
EXPOSE 8000

# Run main.py when the container launches
CMD ["python", "-m", "app.main"]
