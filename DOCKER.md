# Docker Deployment Guide

## Quick Start

```bash
# Start everything
docker-compose up -d --build

# Stop everything
docker-compose down

# View logs
docker-compose logs -f
```

**Access:**
- Frontend: http://localhost:8080
- Backend API: http://localhost:5000
- Database: PostgreSQL on port 5432

---

## Architecture

### Services
1. **Frontend** (React + Vite → nginx)
2. **Backend** (Python Flask + C AI Engine)
3. **Database** (PostgreSQL)

### Multi-Stage Builds

**Backend:**
- Stage 1: Compile C modules (`verdant_backend.so`)
- Stage 2: Run Flask with compiled library

**Frontend:**
- Stage 1: Build React app with Vite
- Stage 2: Serve with nginx

---

## Common Commands

### Rebuild Specific Service
```bash
# Backend only
docker-compose up -d --build backend

# Frontend only
docker-compose up -d --build frontend

# Database only
docker-compose up -d --build db
```

### Debugging
```bash
# View logs for specific service
docker-compose logs -f backend

# Access container shell
docker exec -it verdant-backend bash

# Check container status
docker ps
```

### Database
```bash
# Access PostgreSQL CLI
docker exec -it verdant-postgres psql -U verdant_user -d verdant_db

# View database logs
docker-compose logs -f db
```

---

## Data Persistence

All data is stored in PostgreSQL (Docker volume):
- Menu items
- User accounts
- Orders & transactions
- Reviews

**Volume:** `postgres_data` (auto-created)

---

## Troubleshooting

### Backend won't start
```bash
# Check if C library compiled
docker exec verdant-backend ls -la verdant_backend.so

# View backend logs
docker-compose logs backend
```

### Frontend can't reach backend
```bash
# Verify network
docker network inspect majorproject_verdant-network

# Check nginx config
docker exec verdant-frontend cat /etc/nginx/nginx.conf
```

### Database connection issues
```bash
# Check database is running
docker ps | grep postgres

# Test connection
docker exec verdant-backend python -c "import database; database.test_connection()"
```

---

## Production Deployment

### 1. Use Production WSGI Server
Update `backend/Dockerfile`:
```dockerfile
RUN pip install gunicorn
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "server:app"]
```

### 2. Set Environment Variables
Create `.env` file:
```env
DB_HOST=db
DB_PORT=5432
DB_NAME=verdant_db
DB_USER=verdant_user
DB_PASSWORD=your_secure_password
```

### 3. Enable Health Checks
Add to `docker-compose.yml`:
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:5000/api/menu"]
  interval: 30s
  timeout: 10s
  retries: 3
```

---

## Summary

✅ **3 Services**: Frontend (nginx) + Backend (Flask+C) + Database (PostgreSQL)  
✅ **One Command**: `docker-compose up -d --build`  
✅ **Data Persists**: PostgreSQL volume  
✅ **AI Engine**: C modules compiled at build time  

**That's it!** 🚀
