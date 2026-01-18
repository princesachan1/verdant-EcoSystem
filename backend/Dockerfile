# Backend Dockerfile
FROM gcc:12 AS backend-builder

WORKDIR /app/backend

# Copy C source files
COPY c_modules/ ./c_modules/

# Compile C backend
RUN cd c_modules && \
    gcc -shared -fPIC -o verdant_backend.so \
        backend_ai.c \
        backend_logistics.c \
        backend_nutrition.c \
        -lm -O2

# Python runtime stage
FROM python:3.11-slim

WORKDIR /app/backend

# Copy requirements and install dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy compiled backend library
COPY --from=backend-builder /app/backend/c_modules/verdant_backend.so ./

# Copy Python server and database module
COPY server.py ./
COPY database.py ./

# Expose Flask port
EXPOSE 5000

# Run server
CMD ["python", "server.py"]
