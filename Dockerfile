# OBD2 Diagnostic Tool Dockerfile
# Multi-stage build for production deployment

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Add metadata
LABEL maintainer="OBD2 Diagnostic Tool"
LABEL description="OBD2 Diagnostic Tool with pure Python stdlib stack"
LABEL version="1.0.0"

# No additional system dependencies needed - pure Python stdlib implementation

# Copy repository files
COPY . .

# Ensure scripts are executable
RUN chmod +x backend/server.py

# Create non-root user for security
RUN useradd -m -u 1000 obd2user && \
    chown -R obd2user:obd2user /app
USER obd2user

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:$PORT/health')" || exit 1

# Expose configurable port
EXPOSE 8000

# Set environment variables
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# Default command
CMD ["python", "backend/server.py"]
