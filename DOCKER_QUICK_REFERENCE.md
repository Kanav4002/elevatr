# 🚀 Docker Quick Reference - Elevatr Project

## 📋 Quick Start Commands

```bash
# Start everything
docker compose up -d

# Stop everything
docker compose down

# View logs
docker compose logs -f

# Rebuild after code changes
docker compose up -d --build

# Check status
docker compose ps

# Access the app
# Frontend: http://localhost:5173
# Backend: http://localhost:4000
```

---

## 🏗️ Architecture Overview

```
Frontend (Port 5173)
    │ Nginx serving React
    │
    ↓ HTTP/WebSocket
Backend (Port 4000)
    │ Express + Socket.io + Node.js
    │
    ↓ MongoDB Protocol
MongoDB Atlas (Cloud)
    │ Database
```

---

## 📂 Docker Files in Project

| File | Purpose | Key Points |
|------|---------|------------|
| `docker-compose.yml` | Orchestrates all containers | Defines 3 services, networking, volumes |
| `backend/Dockerfile` | Backend container | Multi-stage build, Node.js 18 Alpine |
| `frontend/Dockerfile` | Frontend container | Build with Node → Serve with Nginx |
| `frontend/nginx.conf` | Web server config | SPA routing, gzip, caching |
| `.env` | Environment variables | DB_URL, JWT_SECRET, GEMINI_API_KEY |
| `.dockerignore` | Build exclusions | Excludes node_modules, .git, etc. |

---

## 🎯 Key Concepts

### Docker Image vs Container
- **Image** = Blueprint (recipe)
- **Container** = Running instance (cooked dish)

### Multi-Stage Build
```dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder
RUN npm ci && npm run build

# Stage 2: Production
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
```
**Result**: 1.5GB → 25MB ✅

### Volumes (Data Persistence)
```yaml
volumes:
  mongodb_data:/data/db        # Survives container restart
  ./backend/uploads:/app/uploads  # Shared with host
```

### Networks (Container Communication)
```yaml
networks:
  elevatr-network:
    driver: bridge
```
- Backend reaches MongoDB at: `mongodb://mongodb:27017`
- Frontend reaches Backend at: `http://backend:4000`

---

## 🔧 Common Commands

### Starting & Stopping
```bash
# Start all services
docker compose up -d

# Start with logs visible
docker compose up

# Stop containers (keeps data)
docker compose stop

# Stop and remove containers (keeps data)
docker compose down

# Stop and remove everything including data
docker compose down -v
```

### Viewing Information
```bash
# List running containers
docker compose ps

# View logs (all services)
docker compose logs

# Follow logs in real-time
docker compose logs -f

# View logs for specific service
docker compose logs backend

# Last 50 lines
docker compose logs --tail=50

# Check resource usage
docker stats
```

### Accessing Containers
```bash
# Open shell in backend
docker compose exec backend sh

# Open shell in frontend
docker compose exec frontend sh

# Access MongoDB
docker compose exec mongodb mongosh -u admin -p admin123

# Run command in container
docker compose exec backend npm list
docker compose exec backend node -v
```

### Rebuilding
```bash
# Rebuild all images
docker compose build

# Rebuild without cache
docker compose build --no-cache

# Rebuild and restart
docker compose up -d --build

# Rebuild specific service
docker compose build backend
```

### Cleaning Up
```bash
# Remove stopped containers
docker compose rm

# Remove unused images
docker image prune

# Remove all unused resources
docker system prune -a

# Check disk usage
docker system df
```

---

## 🐛 Troubleshooting

### Container won't start
```bash
# Check logs
docker compose logs backend

# Check if port is in use
lsof -i :4000
kill -9 <PID>

# Restart container
docker compose restart backend
```

### Can't log in (401 error)
```bash
# Check if database has users
docker compose exec mongodb mongosh -u admin -p admin123
> use elevatr
> db.users.countDocuments()

# If 0, register a new user first!
```

### Changes not reflecting
```bash
# Hard rebuild
docker compose down
docker compose build --no-cache
docker compose up -d

# Clear browser cache: Cmd+Shift+R (Mac)
```

### Container keeps restarting
```bash
# Check why
docker compose logs backend

# Common causes:
# - Port already in use
# - Missing environment variables
# - Database connection failed
# - Syntax error in code
```

### Out of space
```bash
# Clean everything
docker system prune -a
docker volume prune
```

---

## 🌐 Deployment

### Render (Recommended)

**Backend:**
```
Type: Web Service
Environment: Docker
Root Directory: backend
Environment Variables:
  - DB_URL
  - JWT_SECRET
  - GEMINI_API_KEY
  - CLIENT_URL
```

**Frontend:**
```
Type: Web Service
Environment: Docker
Root Directory: frontend
Build Args:
  - VITE_API_URL=https://elevatr-backend.onrender.com/api
  - VITE_SOCKET_URL=https://elevatr-backend.onrender.com
```

### Docker Hub
```bash
# Login
docker login

# Tag images
docker tag elevatr-backend username/elevatr-backend:latest
docker tag elevatr-frontend username/elevatr-frontend:latest

# Push
docker push username/elevatr-backend:latest
docker push username/elevatr-frontend:latest
```

---

## 🎓 Viva Prep - Key Points

### 1. What is Docker?
Containerization platform that packages app + dependencies into isolated containers.

### 2. Why Docker?
- Consistency across environments
- Isolation between services
- Easy deployment
- Scalability

### 3. Image vs Container?
- Image = Blueprint (static)
- Container = Running instance (dynamic)

### 4. Multi-stage build?
Build in multiple stages, copy only needed artifacts to final image.
**Benefit**: Smaller images (1.5GB → 25MB)

### 5. Docker Compose?
Tool to run multi-container apps. One `docker-compose.yml` defines entire stack.

### 6. Volumes?
Persistent storage that survives container restarts.

### 7. Networks?
Allow containers to communicate using service names.

### 8. Health checks?
Monitor container health, auto-restart if unhealthy.

### 9. Why Alpine?
Minimal Linux distro, 6x smaller than standard images.

### 10. Security measures?
- Non-root user
- No secrets in Dockerfile
- Minimal base image
- .dockerignore for sensitive files

---

## 📊 File Sizes

| Component | Without Docker | With Docker |
|-----------|----------------|-------------|
| Backend Image | N/A | 200 MB |
| Frontend Image | N/A | 25 MB |
| Total | Install Node, MongoDB, deps | 225 MB (portable!) |

---

## 🔒 Security Checklist

- ✅ Use `.env` file for secrets
- ✅ Add `.env` to `.gitignore`
- ✅ Run as non-root user (USER node)
- ✅ Use minimal base image (Alpine)
- ✅ Use `.dockerignore` to exclude sensitive files
- ✅ Add security headers in Nginx
- ✅ Don't expose unnecessary ports

---

## 🚀 Performance Tips

1. **Layer caching**: Put least-changing commands first
2. **Multi-stage builds**: Reduce final image size
3. **Alpine images**: Smaller, faster downloads
4. **Health checks**: Auto-recovery
5. **Resource limits**: Prevent one container from using all resources

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
```

---

## 📱 Project URLs

### Local Development (Docker)
- Frontend: http://localhost:5173
- Backend: http://localhost:4000
- Health: http://localhost:4000/api/health
- MongoDB: localhost:27017

### Production (Render)
- Frontend: https://elevatr-frontend.onrender.com
- Backend: https://elevatr-backend.onrender.com

---

## 🎯 Common Workflows

### Daily Development
```bash
# Morning: Start work
docker compose up -d

# During day: View logs if needed
docker compose logs -f backend

# Evening: Stop work
docker compose stop
```

### After Code Changes
```bash
docker compose down
docker compose up -d --build
```

### Before Deployment
```bash
# Test locally
docker compose up -d
# Test at http://localhost:5173

# Tag for production
docker tag elevatr-backend:latest elevatr-backend:v1.0

# Push to registry
docker push elevatr-backend:v1.0
```

### Troubleshooting Session
```bash
# 1. Check status
docker compose ps

# 2. Check logs
docker compose logs backend

# 3. Access container
docker compose exec backend sh

# 4. Check network
docker network inspect elevatr_elevatr-network

# 5. Restart if needed
docker compose restart backend
```

---

## 💡 Tips & Tricks

### View Container IP Address
```bash
docker inspect elevatr-backend --format='{{.NetworkSettings.Networks.elevatr_elevatr-network.IPAddress}}'
```

### Copy Files
```bash
# From container to host
docker cp elevatr-backend:/app/logs/error.log ./

# From host to container
docker cp ./config.json elevatr-backend:/app/
```

### Execute One-off Commands
```bash
# Run npm command
docker compose exec backend npm install new-package

# Check environment
docker compose exec backend env

# Test database connection
docker compose exec backend node -e "require('./config/connectDB')()"
```

### Monitor Resource Usage
```bash
# Live stats
docker stats

# Continuous monitoring
watch -n 1 docker stats --no-stream
```

---

## 🔗 Useful Links

- Docker Docs: https://docs.docker.com
- Docker Hub: https://hub.docker.com
- Compose Spec: https://compose-spec.io
- Best Practices: https://docs.docker.com/develop/dev-best-practices

---

## 📚 Additional Reading

- **Full Guide**: `DOCKER_COMPLETE_GUIDE.md` (400+ lines, detailed explanations)
- **Original Guide**: `DOCKER_GUIDE.md` (deployment focus)
- **Docker Hub**: Search for official images

---

**🎓 Print this out and keep it handy during your viva!** ✅

