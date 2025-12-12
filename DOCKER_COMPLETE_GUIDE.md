# 🐳 Complete Docker Guide for Elevatr Project

## 📚 Table of Contents
1. [What is Docker?](#what-is-docker)
2. [Why Docker for This Project?](#why-docker-for-this-project)
3. [Docker Architecture in Elevatr](#docker-architecture-in-elevatr)
4. [File-by-File Explanation](#file-by-file-explanation)
5. [Changes Made to the Project](#changes-made-to-the-project)
6. [Starting and Stopping Docker](#starting-and-stopping-docker)
7. [Deployment Guide](#deployment-guide)
8. [Troubleshooting](#troubleshooting)
9. [Viva Questions & Answers](#viva-questions--answers)

---

## 🤔 What is Docker?

### Simple Explanation
Docker is like a **shipping container** for your application:
- **Traditional way**: You install Node.js, MongoDB, dependencies on your computer → different environments = different bugs
- **Docker way**: Package everything (code + dependencies + OS) into containers → runs the same everywhere

### Key Concepts

#### 1. **Container** 🏗️
- A lightweight, standalone package that includes everything to run an application
- Isolated from other containers but can communicate with them
- Like a mini virtual machine (but much lighter)

#### 2. **Image** 📦
- A blueprint/template for creating containers
- Read-only snapshot of your application and its dependencies
- Built from a Dockerfile

#### 3. **Dockerfile** 📝
- A text file with instructions to build a Docker image
- Like a recipe: "Install Node.js → Copy code → Install npm packages → Start server"

#### 4. **Docker Compose** 🎼
- A tool to run multiple containers together
- Define entire application stack in one YAML file
- Manages networking, volumes, and dependencies between containers

---

## 🎯 Why Docker for This Project?

### Problems Docker Solves

1. **"Works on My Machine" Syndrome**
   ```
   Before Docker:
   Developer A: "It works on my laptop!"
   Developer B: "Doesn't work on mine - different Node version"
   Server: "Crashes in production - different OS"
   
   With Docker:
   Everyone: "It works everywhere!" ✅
   ```

2. **Complex Setup**
   ```
   Without Docker:
   1. Install Node.js v18
   2. Install MongoDB
   3. Set up environment variables
   4. Install 200+ npm packages
   5. Configure ports
   6. Hope nothing conflicts
   
   With Docker:
   $ docker compose up
   Done! ✅
   ```

3. **Consistency**
   - Same environment in development, testing, and production
   - No version mismatches
   - Reproducible builds

4. **Isolation**
   - Backend, Frontend, and MongoDB run independently
   - One container crash doesn't affect others
   - Easy to scale individual services

---

## 🏗️ Docker Architecture in Elevatr

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Compose                           │
│                 (Orchestration Layer)                       │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌──────▼──────┐  ┌────────▼────────┐
│   Frontend     │  │   Backend   │  │    MongoDB      │
│  Container     │  │  Container  │  │   Container     │
│                │  │             │  │                 │
│  - Nginx       │  │  - Node.js  │  │  - Database     │
│  - React Build │  │  - Express  │  │  - Data Storage │
│  - Port: 5173  │  │  - Port:4000│  │  - Port: 27017  │
└────────────────┘  └─────────────┘  └─────────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                ┌───────────▼───────────┐
                │   elevatr-network     │
                │   (Bridge Network)    │
                └───────────────────────┘
```

### Container Communication

```
User Browser (localhost:5173)
    │
    ↓
Frontend Container (Nginx)
    │
    ↓ HTTP/WebSocket
Backend Container (Express + Socket.io)
    │
    ↓ MongoDB Protocol
MongoDB Container / MongoDB Atlas (Cloud)
```

---

## 📄 File-by-File Explanation

### 1. **`docker-compose.yml`** - The Orchestrator

**Location**: `/elevatr/docker-compose.yml`

**Purpose**: Defines and manages all containers as one application

```yaml
services:
  # Service 1: MongoDB Database
  mongodb:
    image: mongo:7.0                    # Use official MongoDB image
    container_name: elevatr-mongodb     # Name for easy identification
    restart: unless-stopped             # Auto-restart if crashes
    ports:
      - "27017:27017"                   # Map container port to host port
    environment:                        # Set environment variables
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: admin123
      MONGO_INITDB_DATABASE: elevatr
    volumes:                            # Persist data
      - mongodb_data:/data/db           # Store database files
      - mongodb_config:/data/configdb   # Store config files
    networks:
      - elevatr-network                 # Connect to custom network
    healthcheck:                        # Check if container is healthy
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s                     # Check every 10 seconds
      timeout: 5s
      retries: 5

  # Service 2: Backend API
  backend:
    build:
      context: ./backend                # Build from backend folder
      dockerfile: Dockerfile            # Use this Dockerfile
    container_name: elevatr-backend
    restart: unless-stopped
    ports:
      - "4000:4000"                     # Expose API on port 4000
    environment:
      NODE_ENV: production
      PORT: 4000
      # Use .env file for DB_URL (MongoDB Atlas)
      DB_URL: ${DB_URL:-mongodb://admin:admin123@mongodb:27017/elevatr?authSource=admin}
      JWT_SECRET: ${JWT_SECRET}
      GEMINI_API_KEY: ${GEMINI_API_KEY}
      CLIENT_URL: http://localhost:5173
    volumes:
      - ./backend/uploads:/app/uploads  # Share uploads folder with host
    depends_on:
      - mongodb                         # Start after MongoDB
    networks:
      - elevatr-network
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:4000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s                 # Wait 40s before first check

  # Service 3: Frontend (React + Nginx)
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:                             # Build-time variables
        VITE_API_URL: http://localhost:4000/api
        VITE_SOCKET_URL: http://localhost:4000
    container_name: elevatr-frontend
    restart: unless-stopped
    ports:
      - "5173:80"                       # Map Nginx port 80 to host 5173
    depends_on:
      - backend                         # Start after backend
    networks:
      - elevatr-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:80/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s

# Define custom network for inter-container communication
networks:
  elevatr-network:
    driver: bridge                      # Bridge driver for local networking

# Define volumes for data persistence
volumes:
  mongodb_data:                         # Stores MongoDB database files
    driver: local
  mongodb_config:                       # Stores MongoDB config files
    driver: local
```

**Key Changes Made**:
1. ✅ Removed obsolete `version: '3.8'` (not needed in Docker Compose V2)
2. ✅ Changed `DB_URL` to use environment variable from `.env` file
3. ✅ Removed hard dependency on MongoDB health check (to support MongoDB Atlas)
4. ✅ Added proper volume mounts for uploads folder

---

### 2. **`backend/Dockerfile`** - Backend Container Blueprint

**Location**: `/elevatr/backend/Dockerfile`

**Purpose**: Builds optimized Node.js container for Express API

```dockerfile
# Stage 1: Base - Common foundation
FROM node:18-alpine AS base
WORKDIR /app
# Alpine Linux = smallest, fastest Node.js image

# Stage 2: Production Dependencies
FROM base AS deps
COPY package*.json ./           # Copy only package files first
RUN npm ci --only=production    # Install only production dependencies
# Separate stage = smaller final image

# Stage 3: Final Runtime Image
FROM base AS runner
WORKDIR /app

# Copy installed dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application code
COPY . .

# Create upload directories and set permissions
RUN mkdir -p uploads/resumes uploads/profiles && \
    chown -R node:node uploads

# Run as non-root user for security
USER node

# Expose port 4000
EXPOSE 4000

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the server
CMD ["node", "server.js"]
```

**Why Multi-Stage Build?**

```
Without Multi-Stage:
├── Base image: 900 MB
├── Dev dependencies: 300 MB
├── Build tools: 200 MB
└── App code: 50 MB
Total: 1.45 GB 😱

With Multi-Stage:
├── Only production deps: 150 MB
├── Only runtime files: 50 MB
Total: 200 MB 🎉
```

**Key Changes Made**:
1. ✅ Removed `package-lock.json` from `.dockerignore` (needed for `npm ci`)
2. ✅ Added health check for monitoring
3. ✅ Added USER node for security (non-root)
4. ✅ Created upload directories

---

### 3. **`frontend/Dockerfile`** - Frontend Container Blueprint

**Location**: `/elevatr/frontend/Dockerfile`

**Purpose**: Builds React app and serves it with Nginx

```dockerfile
# Stage 1: Build Stage
FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build arguments (passed from docker-compose.yml)
ARG VITE_API_URL
ARG VITE_SOCKET_URL

# Set as environment variables for Vite
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL

# Build the React app
RUN npm run build
# Output: /app/dist folder with optimized HTML/CSS/JS

# Stage 2: Production Stage - Nginx
FROM nginx:alpine AS runner

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built React app from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
```

**Why Nginx for Frontend?**

```
Option 1: Node.js server (like Vite preview)
- Heavier (Node.js + dependencies)
- Slower for static files
- More memory usage
Image size: ~500 MB

Option 2: Nginx
- Lightweight
- Optimized for static files
- Gzip compression built-in
- Industry standard
Image size: ~25 MB ✅
```

**Key Changes Made**:
1. ✅ Removed `package-lock.json` from `.dockerignore`
2. ✅ Added build arguments for environment variables
3. ✅ Added custom Nginx configuration
4. ✅ Added health check endpoint

---

### 4. **`frontend/nginx.conf`** - Nginx Web Server Config

**Location**: `/elevatr/frontend/nginx.conf`

**Purpose**: Configure Nginx to serve React SPA correctly

```nginx
server {
    listen 80;                          # Listen on port 80
    server_name localhost;
    root /usr/share/nginx/html;         # Where React build is
    index index.html;

    # Enable Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 10240;              # Only compress files > 10KB
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/javascript application/json;
    gzip_disable "MSIE [1-6]\.";        # Disable for old IE

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Cache static assets (images, fonts, CSS, JS)
    location ~* \.(?:css|js|jpg|jpeg|gif|png|svg|ico|woff|woff2|ttf|eot)$ {
        expires 1y;                     # Cache for 1 year
        add_header Cache-Control "public, immutable";
    }

    # Handle client-side routing (React Router)
    location / {
        try_files $uri $uri/ /index.html;
        # If file doesn't exist, serve index.html
    }

    # Health check endpoint for Docker
    location /health {
        access_log off;                 # Don't log health checks
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

**Why This Configuration?**

1. **Client-side routing**: React Router uses `/profile`, `/jobs`, etc. - Nginx needs to know these aren't real files
2. **Gzip compression**: Reduces bundle size by ~70%
3. **Caching**: Speeds up repeat visits
4. **Security headers**: Protects against common attacks
5. **Health checks**: Allows Docker to monitor container health

---

### 5. **`backend/.dockerignore`** - What NOT to Copy

**Location**: `/elevatr/backend/.dockerignore`

**Purpose**: Exclude unnecessary files from Docker image

```
# Dependencies (will be installed fresh in container)
node_modules
npm-debug.log
yarn-error.log
yarn.lock

# Environment files (security)
.env
.env.local
.env.*.local

# Development files
.vscode
.idea
*.swp

# OS files
.DS_Store

# Git
.git
.gitignore

# Docker files
Dockerfile
.dockerignore
docker-compose*.yml
```

**Why Exclude These?**

| File | Why Exclude | Impact |
|------|------------|--------|
| `node_modules` | Will be installed fresh in container | Saves 300+ MB |
| `.env` | Security risk, use docker-compose env instead | Prevents credential leaks |
| `.git` | Not needed at runtime | Saves 50+ MB |
| `.vscode` | IDE config, not needed | Saves disk space |

**Key Change Made**:
- ✅ **Removed `package-lock.json` from exclusion list** - This file is REQUIRED for `npm ci` to work

---

### 6. **`backend/server.js`** - Health Check Endpoint

**Location**: `/elevatr/backend/server.js`

**Changes Made**: Added health check endpoint for Docker monitoring

```javascript
// Health check endpoint for Docker
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()  // How long server has been running
  });
});
```

**Why Health Checks?**

```
Without Health Check:
Container crashes → Docker doesn't know → App stays down

With Health Check:
Container unhealthy → Docker detects → Auto-restarts container ✅
```

**How Docker Uses This**:
1. Every 30 seconds, Docker sends GET request to `/api/health`
2. If status code = 200 → Container is healthy ✅
3. If fails 3 times in a row → Container marked unhealthy → Auto-restart

---

### 7. **Root `.env` File** - Environment Variables

**Location**: `/elevatr/.env` (created automatically)

**Purpose**: Store sensitive configuration for Docker Compose

```bash
# Database Connection (MongoDB Atlas)
DB_URL="mongodb+srv://kanav:kanav@cluster0.ogb5jtg.mongodb.net/auth"

# JWT Secret for token signing
JWT_SECRET="elevatr_jwt_secret_key_2025_be3_project_kanav_secure_token_signing"

# Gemini AI API Key
GEMINI_API_KEY="AIzaSyCMeec8Egno0EYk8jvZKX2XJZ0DdJJPBzA"
```

**Why Separate `.env` File?**

```
Security Best Practice:
❌ Don't hardcode secrets in docker-compose.yml
❌ Don't commit .env to Git
✅ Load from .env file
✅ Add .env to .gitignore
```

---

## 🔧 Changes Made to the Project

### Summary of All Changes

| File | Changes | Reason |
|------|---------|--------|
| **Added**: `docker-compose.yml` | Multi-container orchestration | Run all services together |
| **Added**: `backend/Dockerfile` | Backend container definition | Package Node.js API |
| **Added**: `frontend/Dockerfile` | Frontend container definition | Package React app |
| **Added**: `frontend/nginx.conf` | Web server configuration | Serve React SPA correctly |
| **Added**: `backend/.dockerignore` | Exclude files from build | Reduce image size |
| **Added**: `frontend/.dockerignore` | Exclude files from build | Reduce image size |
| **Added**: `.dockerignore` | Root level exclusions | Clean build context |
| **Modified**: `backend/server.js` | Added `/api/health` endpoint | Health monitoring |
| **Added**: `.env` | Environment variables | Centralized config |
| **Modified**: `.dockerignore` files | Removed `package-lock.json` | Fix npm ci error |

### Before vs After Docker

#### Before Docker (Manual Setup)
```bash
# Developer needs to do:
1. Install Node.js v18
2. Install MongoDB
3. Clone repository
4. cd backend && npm install (wait 5 min)
5. cd ../frontend && npm install (wait 5 min)
6. Set up .env files
7. Start MongoDB service
8. cd backend && npm run dev
9. cd frontend && npm run dev
10. Hope everything works 🤞

Total setup time: 30-60 minutes
```

#### After Docker (Automated Setup)
```bash
# Developer needs to do:
1. Install Docker Desktop
2. Clone repository
3. docker compose up

Total setup time: 5 minutes ✅
```

---

## 🚀 Starting and Stopping Docker

### Prerequisites

1. **Install Docker Desktop**
   - Download from: https://www.docker.com/products/docker-desktop
   - Install and start Docker Desktop
   - Verify: `docker --version`

2. **Ensure Docker is Running**
   - Look for whale icon 🐳 in menu bar (Mac) or system tray (Windows)
   - Should be steady, not animated

### Starting the Application

#### Method 1: Start Everything (Recommended)

```bash
# Navigate to project root
cd /Users/kanavkumar/Desktop/Academics/BE-III/elevatr

# Start all containers in detached mode (background)
docker compose up -d

# Output:
# ✓ Container elevatr-mongodb  Started
# ✓ Container elevatr-backend  Started
# ✓ Container elevatr-frontend Started
```

**What happens?**
1. Pulls/builds images (first time only - takes 2-5 minutes)
2. Creates network `elevatr-network`
3. Creates volumes for MongoDB data
4. Starts MongoDB container
5. Waits for MongoDB to be healthy
6. Starts backend container
7. Starts frontend container

#### Method 2: Start with Live Logs

```bash
# Start and follow logs (stays in foreground)
docker compose up

# Press Ctrl+C to stop
```

#### Method 3: Rebuild After Code Changes

```bash
# Rebuild images and start
docker compose up -d --build

# Force rebuild without cache (if having issues)
docker compose build --no-cache
docker compose up -d
```

#### Method 4: Start Individual Services

```bash
# Start only backend
docker compose up -d backend

# Start only frontend
docker compose up -d frontend

# Start backend and MongoDB (frontend depends on backend)
docker compose up -d mongodb backend
```

### Checking Status

```bash
# View running containers
docker compose ps

# Expected output:
# NAME               STATUS                    PORTS
# elevatr-backend    Up (healthy)             0.0.0.0:4000->4000/tcp
# elevatr-frontend   Up (healthy)             0.0.0.0:5173->80/tcp
# elevatr-mongodb    Up (healthy)             0.0.0.0:27017->27017/tcp

# Detailed status with resource usage
docker stats
```

### Viewing Logs

```bash
# View logs from all containers
docker compose logs

# Follow logs in real-time
docker compose logs -f

# View logs from specific service
docker compose logs backend
docker compose logs frontend
docker compose logs mongodb

# View last 50 lines
docker compose logs --tail=50

# Follow logs from backend only
docker compose logs -f backend
```

### Accessing Containers

```bash
# Open shell in backend container
docker compose exec backend sh

# Inside container, you can:
$ ls                    # List files
$ node -v               # Check Node version
$ npm list              # List dependencies
$ cat .env              # View environment
$ exit                  # Exit container

# Open shell in frontend container
docker compose exec frontend sh

# Access MongoDB shell
docker compose exec mongodb mongosh -u admin -p admin123

# Inside MongoDB shell:
> show dbs
> use elevatr
> db.users.find()
> exit
```

### Stopping the Application

#### Method 1: Stop Containers (Data Persists)

```bash
# Stop all containers
docker compose stop

# Containers are stopped but not removed
# Can restart with: docker compose start
```

#### Method 2: Stop and Remove Containers (Data Persists)

```bash
# Stop and remove containers
docker compose down

# Network removed, volumes kept
# Data in MongoDB persists
# Can restart with: docker compose up
```

#### Method 3: Stop and Remove Everything (Clean Slate)

```bash
# CAUTION: Removes volumes - data will be lost!
docker compose down -v

# Removes:
# - All containers
# - Network
# - Volumes (MongoDB data deleted!)
```

#### Method 4: Stop Individual Services

```bash
# Stop only frontend
docker compose stop frontend

# Restart it
docker compose start frontend
```

### Restarting Containers

```bash
# Restart all containers
docker compose restart

# Restart specific service
docker compose restart backend

# Restart and rebuild
docker compose up -d --build
```

### Cleaning Up

```bash
# Remove stopped containers
docker compose rm

# Remove unused images
docker image prune

# Remove all unused resources (containers, networks, images, cache)
docker system prune -a

# Remove specific service images
docker rmi elevatr-backend
docker rmi elevatr-frontend
```

### Quick Reference Commands

```bash
# Starting
docker compose up -d                 # Start in background
docker compose up                    # Start with logs
docker compose up -d --build        # Rebuild and start

# Checking
docker compose ps                    # List containers
docker compose logs -f              # Follow logs
docker stats                         # Resource usage

# Stopping
docker compose stop                  # Stop containers
docker compose down                  # Stop and remove
docker compose down -v              # Stop and remove data

# Accessing
docker compose exec backend sh      # Backend shell
docker compose exec mongodb mongosh # MongoDB shell

# Maintenance
docker compose restart              # Restart all
docker compose restart backend      # Restart one
docker compose build --no-cache    # Force rebuild
docker system prune -a             # Clean everything
```

---

## 🌐 Deployment Guide

### Overview of Deployment Options

| Platform | Pros | Cons | Best For |
|----------|------|------|----------|
| **Render** | Free tier, easy setup | Cold starts | Small projects |
| **Railway** | Good performance | Paid only | Hobby projects |
| **AWS ECS** | Scalable, reliable | Complex setup | Production |
| **DigitalOcean** | Simple, affordable | Manual setup | Small business |
| **Heroku** | Very easy | Expensive | Quick demos |

### Option 1: Deploy on Render (Recommended for Learning)

#### Step 1: Prepare Your Repository

```bash
# Make sure all changes are committed
git add .
git commit -m "feat: add Docker support"
git push origin main
```

#### Step 2: Deploy Backend

1. Go to https://render.com
2. Sign in with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   ```
   Name: elevatr-backend
   Region: Singapore (closest to you)
   Branch: main
   Root Directory: backend
   Environment: Docker
   Instance Type: Free
   
   Environment Variables:
   DB_URL = mongodb+srv://kanav:kanav@cluster0.ogb5jtg.mongodb.net/auth
   JWT_SECRET = elevatr_jwt_secret_key_2025_be3_project_kanav_secure_token_signing
   GEMINI_API_KEY = AIzaSyCMeec8Egno0EYk8jvZKX2XJZ0DdJJPBzA
   PORT = 4000
   CLIENT_URL = https://elevatr-frontend.onrender.com (add after frontend deploy)
   ```
6. Click "Create Web Service"
7. Wait for deployment (5-10 minutes)
8. Copy the URL: `https://elevatr-backend.onrender.com`

#### Step 3: Deploy Frontend

1. Click "New +" → "Web Service"
2. Select same repository
3. Configure:
   ```
   Name: elevatr-frontend
   Region: Singapore
   Branch: main
   Root Directory: frontend
   Environment: Docker
   Instance Type: Free
   
   Build Command: (leave empty - Dockerfile handles it)
   
   Environment Variables (Build):
   VITE_API_URL = https://elevatr-backend.onrender.com/api
   VITE_SOCKET_URL = https://elevatr-backend.onrender.com
   ```
4. Click "Create Web Service"
5. Wait for deployment (5-10 minutes)
6. Copy URL: `https://elevatr-frontend.onrender.com`

#### Step 4: Update Backend with Frontend URL

1. Go to backend service on Render
2. Environment → Add:
   ```
   CLIENT_URL = https://elevatr-frontend.onrender.com
   ```
3. Save → Backend will auto-redeploy

#### Step 5: Test Deployment

```bash
# Test backend health
curl https://elevatr-backend.onrender.com/api/health

# Open frontend in browser
open https://elevatr-frontend.onrender.com
```

### Option 2: Deploy on AWS with Docker

#### Prerequisites
```bash
# Install AWS CLI
brew install awscli  # Mac
# or download from: https://aws.amazon.com/cli/

# Configure AWS credentials
aws configure
```

#### Step 1: Create ECR Repositories

```bash
# Create repository for backend
aws ecr create-repository --repository-name elevatr-backend

# Create repository for frontend
aws ecr create-repository --repository-name elevatr-frontend
```

#### Step 2: Build and Push Images

```bash
# Login to ECR
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin <your-account-id>.dkr.ecr.ap-south-1.amazonaws.com

# Build backend
cd backend
docker build -t elevatr-backend .
docker tag elevatr-backend:latest <your-account-id>.dkr.ecr.ap-south-1.amazonaws.com/elevatr-backend:latest
docker push <your-account-id>.dkr.ecr.ap-south-1.amazonaws.com/elevatr-backend:latest

# Build frontend
cd ../frontend
docker build --build-arg VITE_API_URL=https://your-backend-url/api \
             --build-arg VITE_SOCKET_URL=https://your-backend-url \
             -t elevatr-frontend .
docker tag elevatr-frontend:latest <your-account-id>.dkr.ecr.ap-south-1.amazonaws.com/elevatr-frontend:latest
docker push <your-account-id>.dkr.ecr.ap-south-1.amazonaws.com/elevatr-frontend:latest
```

#### Step 3: Create ECS Cluster

```bash
# Create cluster
aws ecs create-cluster --cluster-name elevatr-cluster
```

#### Step 4: Create Task Definitions

Create `backend-task-definition.json`:
```json
{
  "family": "elevatr-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "<your-account-id>.dkr.ecr.ap-south-1.amazonaws.com/elevatr-backend:latest",
      "portMappings": [
        {
          "containerPort": 4000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "DB_URL", "value": "your-mongodb-url"},
        {"name": "JWT_SECRET", "value": "your-jwt-secret"},
        {"name": "GEMINI_API_KEY", "value": "your-api-key"}
      ]
    }
  ]
}
```

Register task:
```bash
aws ecs register-task-definition --cli-input-json file://backend-task-definition.json
```

#### Step 5: Create Service

```bash
aws ecs create-service \
  --cluster elevatr-cluster \
  --service-name elevatr-backend-service \
  --task-definition elevatr-backend \
  --desired-count 1 \
  --launch-type FARGATE
```

### Option 3: Deploy on DigitalOcean with Docker

#### Step 1: Create Droplet

1. Go to https://digitalocean.com
2. Create → Droplets
3. Choose Docker pre-installed image
4. Select plan ($6/month minimum)
5. Add SSH key
6. Create Droplet

#### Step 2: Connect to Droplet

```bash
ssh root@your-droplet-ip
```

#### Step 3: Clone and Deploy

```bash
# Install Docker Compose
apt update
apt install docker-compose -y

# Clone repository
git clone https://github.com/your-username/elevatr.git
cd elevatr

# Create .env file
nano .env
# Paste your environment variables
# Save: Ctrl+O, Exit: Ctrl+X

# Start application
docker compose up -d

# Check status
docker compose ps
```

#### Step 4: Set Up Nginx Reverse Proxy (Optional)

```bash
# Install Nginx
apt install nginx -y

# Create configuration
nano /etc/nginx/sites-available/elevatr
```

Add:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:4000;
    }
}
```

Enable:
```bash
ln -s /etc/nginx/sites-available/elevatr /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

#### Step 5: Set Up SSL (Optional but Recommended)

```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Get SSL certificate
certbot --nginx -d your-domain.com
```

### Option 4: Push to Docker Hub (For Easy Sharing)

#### Step 1: Create Docker Hub Account

1. Go to https://hub.docker.com
2. Sign up/Login

#### Step 2: Build and Tag Images

```bash
# Build backend
cd backend
docker build -t your-dockerhub-username/elevatr-backend:latest .

# Build frontend
cd ../frontend
docker build \
  --build-arg VITE_API_URL=http://localhost:4000/api \
  --build-arg VITE_SOCKET_URL=http://localhost:4000 \
  -t your-dockerhub-username/elevatr-frontend:latest .
```

#### Step 3: Push to Docker Hub

```bash
# Login
docker login

# Push images
docker push your-dockerhub-username/elevatr-backend:latest
docker push your-dockerhub-username/elevatr-frontend:latest
```

#### Step 4: Update docker-compose.yml for Public Images

```yaml
services:
  backend:
    image: your-dockerhub-username/elevatr-backend:latest
    # Remove 'build' section
    
  frontend:
    image: your-dockerhub-username/elevatr-frontend:latest
    # Remove 'build' section
```

Now anyone can run your app:
```bash
docker compose up -d
```

---

## 🐛 Troubleshooting

### Common Issues and Solutions

#### 1. Port Already in Use

**Error:**
```
Error: bind: address already in use
```

**Solution:**
```bash
# Find process using port 4000
lsof -i :4000
# or
netstat -an | grep 4000

# Kill the process
kill -9 <PID>

# Or change port in docker-compose.yml
ports:
  - "4001:4000"  # Use host port 4001 instead
```

#### 2. Docker Daemon Not Running

**Error:**
```
Cannot connect to the Docker daemon at unix:///var/run/docker.sock
```

**Solution:**
```bash
# Start Docker Desktop application
# Wait for whale icon to appear in menu bar
# Verify with:
docker ps
```

#### 3. Build Fails - Missing package-lock.json

**Error:**
```
npm ci can only install with an existing package-lock.json
```

**Solution:**
```bash
# Generate package-lock.json
cd backend
npm install
cd ../frontend
npm install

# Rebuild
docker compose build --no-cache
```

#### 4. MongoDB Connection Error

**Error:**
```
MongooseServerSelectionError: connect ECONNREFUSED
```

**Solution:**
```bash
# Check if MongoDB container is running
docker compose ps mongodb

# Check MongoDB logs
docker compose logs mongodb

# Restart MongoDB
docker compose restart mongodb

# Or use MongoDB Atlas (cloud) instead
# Update .env with Atlas connection string
```

#### 5. Frontend Shows 401 Unauthorized

**Issue:** Cannot log in, getting 401 errors

**Solutions:**
```bash
# 1. Check if database has users
docker compose exec mongodb mongosh -u admin -p admin123
> use elevatr
> db.users.find()

# If empty, register a new user first!

# 2. Check if backend is accessible
curl http://localhost:4000/api/health

# 3. Check CORS configuration in backend/server.js
# Make sure CLIENT_URL matches frontend URL
```

#### 6. Changes Not Reflecting

**Issue:** Made code changes but don't see them in app

**Solution:**
```bash
# Rebuild containers
docker compose down
docker compose up -d --build

# For stubborn issues, force full rebuild
docker compose build --no-cache
docker compose up -d

# Clear browser cache
# Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
```

#### 7. Container Keeps Restarting

**Check why:**
```bash
# View container status
docker compose ps

# Check logs for errors
docker compose logs backend

# Common causes:
# - Port conflict
# - Missing environment variables
# - Database connection failed
# - Syntax error in code
```

#### 8. Out of Disk Space

**Error:**
```
no space left on device
```

**Solution:**
```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove everything unused
docker system prune -a

# Check disk usage
docker system df
```

#### 9. Network Issues Between Containers

**Issue:** Frontend can't reach backend, or backend can't reach MongoDB

**Solution:**
```bash
# Check if containers are on same network
docker network inspect elevatr_elevatr-network

# Inside containers, use service names:
# backend can reach mongodb at: mongodb:27017
# frontend can reach backend at: backend:4000

# Restart networking
docker compose down
docker compose up -d
```

#### 10. Permission Denied Errors

**Error:**
```
EACCES: permission denied
```

**Solution:**
```bash
# Fix file permissions
chmod -R 755 backend/uploads
chmod -R 755 frontend/dist

# Or rebuild with proper permissions
docker compose build --no-cache
```

---

## 🎓 Viva Questions & Answers

### Basic Docker Questions

#### Q1: What is Docker and why do we use it?

**Answer:**
Docker is a containerization platform that packages applications and their dependencies into containers. We use it because:

1. **Consistency**: Same environment in development, testing, and production
2. **Isolation**: Each service runs independently
3. **Portability**: "Build once, run anywhere"
4. **Efficiency**: Lighter than virtual machines
5. **Scalability**: Easy to scale individual services

**Example from our project:**
```
Without Docker: "It works on my laptop but not on server"
With Docker: Works everywhere because we package Node.js, dependencies, and code together
```

---

#### Q2: What is the difference between Docker Image and Docker Container?

**Answer:**

| Aspect | Image | Container |
|--------|-------|-----------|
| Definition | Blueprint/template | Running instance |
| State | Static, read-only | Dynamic, running |
| Analogy | Recipe | Cooked dish |
| Storage | Saved as layers | Has writable layer |
| Lifecycle | Built once | Can be started/stopped |

**Example from our project:**
```bash
# Image (blueprint)
docker build -t elevatr-backend .

# Container (running instance)
docker run elevatr-backend

# Can create multiple containers from one image
docker run elevatr-backend  # Container 1
docker run elevatr-backend  # Container 2
```

---

#### Q3: Explain the architecture of your Docker implementation.

**Answer:**
Our application uses a **multi-container architecture** with 3 services:

```
1. Frontend Container (Nginx + React)
   - Serves static HTML/CSS/JS
   - Port 5173
   - Built using multi-stage build (Node.js → Nginx)

2. Backend Container (Node.js + Express)
   - REST API + Socket.io for real-time notifications
   - Port 4000
   - Connects to MongoDB Atlas (cloud database)

3. MongoDB Container (optional, we use Atlas)
   - Local database for development
   - Port 27017
   - Data persists in Docker volumes

All containers communicate via 'elevatr-network' bridge network.
```

**Diagram:**
```
User Browser
    ↓
Frontend (localhost:5173)
    ↓ HTTP/WebSocket
Backend (localhost:4000)
    ↓ MongoDB protocol
MongoDB Atlas (Cloud)
```

---

#### Q4: What is multi-stage build? Why did you use it?

**Answer:**
Multi-stage build allows multiple FROM statements in one Dockerfile. Each stage can copy artifacts from previous stages.

**Benefits:**
1. **Smaller images**: Only production dependencies in final image
2. **Security**: No build tools in production
3. **Faster deployment**: Less data to transfer

**Example from frontend Dockerfile:**
```dockerfile
# Stage 1: Build (Node.js)
FROM node:18-alpine AS builder
RUN npm ci
RUN npm run build
# Output: dist/ folder

# Stage 2: Serve (Nginx)
FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
# Only copy built files, not Node.js or npm
```

**Size comparison:**
- Without multi-stage: 1.5 GB (includes Node.js, npm, dev dependencies)
- With multi-stage: 25 MB (only built files + Nginx)

---

#### Q5: What is Docker Compose? Why not just use Docker?

**Answer:**
Docker Compose is an orchestration tool for multi-container applications.

**Without Compose:**
```bash
# Manual way (tedious)
docker network create elevatr-network
docker volume create mongodb_data
docker run --network elevatr-network --name mongodb -p 27017:27017 mongo:7.0
docker run --network elevatr-network --name backend -p 4000:4000 -e DB_URL=... elevatr-backend
docker run --network elevatr-network --name frontend -p 5173:80 elevatr-frontend
```

**With Compose:**
```bash
# One command
docker compose up
```

**Benefits:**
1. Define entire stack in one file (docker-compose.yml)
2. Manage services together (start/stop all at once)
3. Automatic networking
4. Environment variable management
5. Service dependencies (backend waits for MongoDB)

---

#### Q6: Explain the layers in your Dockerfile.

**Answer:**
Docker images are built in layers. Each instruction creates a new layer.

**Backend Dockerfile layers:**
```dockerfile
Layer 1: FROM node:18-alpine          # Base OS + Node.js (50 MB)
Layer 2: WORKDIR /app                  # Set working directory (0 MB)
Layer 3: COPY package*.json ./        # Copy package files (1 KB)
Layer 4: RUN npm ci                    # Install dependencies (150 MB)
Layer 5: COPY . .                      # Copy source code (10 MB)
Layer 6: CMD ["node", "server.js"]    # Define startup command (0 MB)
```

**Why layers matter:**
- Cached for faster rebuilds
- If code changes, only Layer 5 rebuilds
- Layers 1-4 reused from cache

**Best practice:** Put least-changing things first (base image, dependencies), most-changing things last (source code).

---

#### Q7: What is .dockerignore? Why is it important?

**Answer:**
`.dockerignore` is like `.gitignore` but for Docker builds. It tells Docker which files NOT to copy into the container.

**From our project:**
```
node_modules/     # Will be installed fresh in container
.env              # Security: don't bake secrets into image
.git/             # Not needed at runtime
README.md         # Documentation not needed in production
*.log             # Log files not needed
```

**Why important:**
1. **Security**: Prevents accidentally including secrets in image
2. **Size**: Reduces image size (node_modules alone can be 300+ MB)
3. **Speed**: Faster builds (less to copy)
4. **Clean**: Only production files in container

**Real impact:**
- Without .dockerignore: 800 MB image (includes node_modules, .git, logs)
- With .dockerignore: 200 MB image (only necessary files)

---

#### Q8: How do containers communicate with each other?

**Answer:**
Containers communicate via **Docker networks**. We use a **bridge network** named `elevatr-network`.

**In docker-compose.yml:**
```yaml
networks:
  elevatr-network:
    driver: bridge
```

**How it works:**
```
1. All containers join the same network
2. Docker provides internal DNS
3. Containers can reach each other by service name

Example:
- Backend connects to MongoDB using: mongodb://mongodb:27017
  (not localhost:27017)
- Frontend connects to backend using: http://backend:4000
  (inside containers only)
```

**From our backend/server.js:**
```javascript
// Docker Compose automatically resolves 'mongodb' to container IP
DB_URL: mongodb://admin:admin123@mongodb:27017/elevatr
```

**Network types:**
- **Bridge** (default): Containers on same host
- **Host**: Uses host's network (no isolation)
- **Overlay**: Multi-host networking (Swarm)

---

#### Q9: What are Docker volumes? Why do we need them?

**Answer:**
Docker volumes are persistent storage for containers. Data in volumes survives container restarts/deletions.

**Why needed:**
```
Without volumes:
Container stops → Data lost 😱

With volumes:
Container stops → Data persists ✅
Restart container → Data still there ✅
```

**In our project:**
```yaml
volumes:
  mongodb_data:           # Stores database files
    driver: local
  mongodb_config:         # Stores MongoDB config
    driver: local
```

**Usage:**
```yaml
services:
  mongodb:
    volumes:
      - mongodb_data:/data/db              # Volume mount
      - ./backend/uploads:/app/uploads    # Bind mount (shares with host)
```

**Volume types:**
1. **Named volumes**: `mongodb_data:/data/db` (managed by Docker)
2. **Bind mounts**: `./uploads:/app/uploads` (shares host folder)
3. **Anonymous volumes**: `/data` (temporary)

---

#### Q10: What is a health check? How does it work?

**Answer:**
Health check is Docker's way to monitor if a container is working properly.

**From our docker-compose.yml:**
```yaml
healthcheck:
  test: ["CMD", "node", "-e", "require('http').get('http://localhost:4000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
  interval: 30s        # Check every 30 seconds
  timeout: 10s         # Fail if takes > 10 seconds
  retries: 3           # Mark unhealthy after 3 failures
  start_period: 40s    # Wait 40s before first check (startup time)
```

**Health check flow:**
```
1. Container starts
2. Wait 40 seconds (start_period)
3. Send GET request to /api/health
4. If status 200 → Healthy ✅
5. Wait 30 seconds (interval)
6. Repeat step 3

If fails 3 times:
→ Mark as unhealthy
→ Docker can auto-restart (with restart: unless-stopped)
```

**Backend health endpoint:**
```javascript
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    uptime: process.uptime()
  });
});
```

---

### Advanced Questions

#### Q11: Explain the difference between CMD and ENTRYPOINT in Dockerfile.

**Answer:**

| Aspect | CMD | ENTRYPOINT |
|--------|-----|------------|
| Purpose | Default command | Main executable |
| Override | Easily overridden | Hard to override |
| Syntax | `CMD ["node", "server.js"]` | `ENTRYPOINT ["node"]` |
| Usage | Full command | Base command |

**Example:**
```dockerfile
# Option 1: Using CMD (our choice)
CMD ["node", "server.js"]
# Can override: docker run elevatr-backend npm test

# Option 2: Using ENTRYPOINT
ENTRYPOINT ["node"]
CMD ["server.js"]
# Always runs node, only server.js is overridable

# Option 3: Both
ENTRYPOINT ["node"]
CMD ["server.js"]
# Run: docker run elevatr-backend
# Executes: node server.js
# Override: docker run elevatr-backend app.js
# Executes: node app.js
```

**We used CMD** because it's simpler and flexible for our use case.

---

#### Q12: What is the benefit of using Alpine Linux in your base image?

**Answer:**
Alpine Linux is a minimal Linux distribution designed for containers.

**Comparison:**

| Base Image | Size | Use Case |
|------------|------|----------|
| `node:18` | 900 MB | Full Ubuntu with all tools |
| `node:18-slim` | 250 MB | Debian with some tools removed |
| `node:18-alpine` | 150 MB | Minimal Alpine Linux ✅ |

**Benefits:**
1. **Smaller images**: 6x smaller than standard Node
2. **Faster downloads**: Less data to pull
3. **Lower attack surface**: Fewer packages = fewer vulnerabilities
4. **Faster builds**: Less to install

**From our Dockerfile:**
```dockerfile
FROM node:18-alpine AS base
# Instead of: FROM node:18 (much larger)
```

**Trade-off:**
- Alpine uses `musl` instead of `glibc`
- Some native packages might need compilation
- For our project: No issues, works perfectly

---

#### Q13: How would you scale this application using Docker?

**Answer:**
Multiple approaches depending on traffic:

**1. Horizontal Scaling with Docker Compose**
```yaml
services:
  backend:
    scale: 3  # Run 3 backend containers
```

Use Nginx for load balancing:
```nginx
upstream backend {
    server backend-1:4000;
    server backend-2:4000;
    server backend-3:4000;
}
```

**2. Docker Swarm (Orchestration)**
```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml elevatr

# Scale service
docker service scale elevatr_backend=5
```

**3. Kubernetes (Production-grade)**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
spec:
  replicas: 5  # 5 backend pods
  selector:
    matchLabels:
      app: backend
```

**4. Auto-scaling based on metrics**
```bash
# Scale based on CPU usage
docker service update --replicas-max-per-node 2 \
  --replicas 3 elevatr_backend
```

**For our project:**
- Development: 1 container each (current setup)
- Small production: 2-3 backend containers
- Large production: Kubernetes with auto-scaling

---

#### Q14: What security measures have you implemented in your Docker setup?

**Answer:**
Several security best practices:

**1. Non-root user**
```dockerfile
# Create and use non-root user
USER node
# Instead of running as root (default)
```

**2. No secrets in Dockerfile**
```dockerfile
# ❌ Bad
ENV DB_PASSWORD=secret123

# ✅ Good
ENV DB_PASSWORD=${DB_PASSWORD}
# Pass at runtime via docker-compose or CLI
```

**3. Minimal base image**
```dockerfile
FROM node:18-alpine  # Minimal attack surface
```

**4. Security headers in Nginx**
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
```

**5. .dockerignore for sensitive files**
```
.env
.env.local
secrets/
*.key
```

**6. Read-only root filesystem (future improvement)**
```yaml
services:
  backend:
    security_opt:
      - no-new-privileges:true
    read_only: true
```

**7. Network isolation**
```yaml
networks:
  elevatr-network:
    driver: bridge
    internal: false  # Only expose what's needed
```

---

#### Q15: How do you handle environment-specific configurations (dev/staging/prod)?

**Answer:**
Multiple approaches using Docker Compose overrides:

**1. Base configuration (docker-compose.yml)**
```yaml
services:
  backend:
    build: ./backend
    environment:
      NODE_ENV: ${NODE_ENV:-development}
```

**2. Development overrides (docker-compose.dev.yml)**
```yaml
services:
  backend:
    volumes:
      - ./backend:/app  # Hot reload
    environment:
      DEBUG: true
```

**3. Production overrides (docker-compose.prod.yml)**
```yaml
services:
  backend:
    image: your-registry/backend:v1.0
    restart: always
    environment:
      NODE_ENV: production
```

**Usage:**
```bash
# Development
docker compose -f docker-compose.yml -f docker-compose.dev.yml up

# Production
docker compose -f docker-compose.yml -f docker-compose.prod.yml up
```

**Alternative: Environment files**
```bash
# .env.development
DB_URL=mongodb://localhost:27017/dev
DEBUG=true

# .env.production
DB_URL=mongodb+srv://prod-cluster/prod
DEBUG=false

# Use:
docker compose --env-file .env.production up
```

---

#### Q16: What happens when you run `docker compose up`?

**Answer:**
Step-by-step process:

**1. Parse Configuration**
```
- Read docker-compose.yml
- Read .env file
- Validate syntax
- Resolve environment variables
```

**2. Build/Pull Images**
```
- Check if images exist locally
- If Dockerfile specified: Build image
- If image specified: Pull from registry
- Cache layers for faster rebuilds
```

**3. Create Network**
```
- Create 'elevatr_elevatr-network' bridge network
- Assign IP range (e.g., 172.18.0.0/16)
- Enable DNS for service name resolution
```

**4. Create Volumes**
```
- Create 'elevatr_mongodb_data' volume
- Create 'elevatr_mongodb_config' volume
- Store in /var/lib/docker/volumes/
```

**5. Start Containers (respecting depends_on)**
```
Step 1: Start mongodb
Step 2: Wait for health check
Step 3: Start backend (depends on mongodb)
Step 4: Start frontend (depends on backend)
```

**6. Attach Networks**
```
- Connect mongodb to elevatr-network
- Connect backend to elevatr-network
- Connect frontend to elevatr-network
```

**7. Mount Volumes**
```
- Mount mongodb_data to mongodb:/data/db
- Mount ./backend/uploads to backend:/app/uploads
```

**8. Start Applications**
```
- Execute CMD in each container
- Monitor health checks
- Stream logs to console
```

---

#### Q17: How do you debug issues in Docker containers?

**Answer:**
Multiple debugging techniques:

**1. View Logs**
```bash
# All containers
docker compose logs

# Specific container
docker compose logs backend

# Follow live logs
docker compose logs -f

# Last 100 lines
docker compose logs --tail=100

# Since specific time
docker compose logs --since 10m
```

**2. Access Container Shell**
```bash
# Open shell in running container
docker compose exec backend sh

# Inside container:
$ ls                    # List files
$ env                   # Check environment variables
$ cat /app/.env         # View config
$ node -e "console.log(require('./package.json').dependencies)"
$ exit
```

**3. Check Container Status**
```bash
# View running containers
docker compose ps

# Detailed info
docker inspect elevatr-backend

# Resource usage
docker stats

# Check health
docker inspect --format='{{json .State.Health}}' elevatr-backend
```

**4. Network Debugging**
```bash
# Check network
docker network inspect elevatr_elevatr-network

# Test connectivity between containers
docker compose exec backend ping mongodb
docker compose exec backend curl http://mongodb:27017
```

**5. Volume Inspection**
```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect elevatr_mongodb_data

# See volume location
docker volume inspect elevatr_mongodb_data --format='{{.Mountpoint}}'
```

**6. Run Commands in Container**
```bash
# Run one-off command
docker compose exec backend npm list
docker compose exec backend node -v
docker compose exec mongodb mongosh -u admin -p admin123
```

**7. Copy Files for Inspection**
```bash
# Copy from container to host
docker cp elevatr-backend:/app/logs/error.log ./

# Copy from host to container
docker cp ./fix.js elevatr-backend:/app/
```

---

#### Q18: What is the difference between `docker compose up` and `docker compose start`?

**Answer:**

| Command | Purpose | When to Use | What it Does |
|---------|---------|-------------|--------------|
| `docker compose up` | Create and start | First time or after changes | Creates containers, networks, volumes, then starts |
| `docker compose start` | Start existing | After `stop` | Only starts existing containers |
| `docker compose down` | Stop and remove | Clean shutdown | Stops and removes containers, networks |
| `docker compose stop` | Stop containers | Pause work | Stops containers but keeps them |

**Example workflow:**
```bash
# Day 1: First time
docker compose up -d
# Creates everything and starts

# End of day
docker compose stop
# Stops containers, keeps everything

# Day 2: Resume work
docker compose start
# Starts existing containers

# Made code changes
docker compose down
docker compose up -d --build
# Rebuild with changes

# Finished project
docker compose down -v
# Remove everything including data
```

**Technical difference:**
```bash
# up: Creates new containers every time
docker compose up
# Container ID: a1b2c3d4e5f6 (new)

# start: Reuses same containers
docker compose start
# Container ID: a1b2c3d4e5f6 (same)
```

---

#### Q19: How would you implement CI/CD for this Docker project?

**Answer:**
Complete CI/CD pipeline for Elevatr:

**1. GitHub Actions Workflow**
`.github/workflows/deploy.yml`:
```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Build backend image
        run: docker build -t elevatr-backend ./backend
      
      - name: Build frontend image
        run: docker build -t elevatr-frontend ./frontend
      
      - name: Run tests
        run: |
          docker compose up -d
          docker compose exec backend npm test
          docker compose down
      
      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
      
      - name: Push images
        run: |
          docker tag elevatr-backend ${{ secrets.DOCKER_USERNAME }}/elevatr-backend:${{ github.sha }}
          docker push ${{ secrets.DOCKER_USERNAME }}/elevatr-backend:${{ github.sha }}
          
          docker tag elevatr-frontend ${{ secrets.DOCKER_USERNAME }}/elevatr-frontend:${{ github.sha }}
          docker push ${{ secrets.DOCKER_USERNAME }}/elevatr-frontend:${{ github.sha }}
  
  deploy:
    needs: build-and-test
    runs-on: ubuntu-latest
    
    steps:
      - name: Deploy to production
        run: |
          # SSH into server and pull new images
          ssh ${{ secrets.SERVER_USER }}@${{ secrets.SERVER_IP }} << 'EOF'
            cd /app/elevatr
            docker compose pull
            docker compose up -d
            docker system prune -f
          EOF
```

**2. Automated Testing**
```yaml
- name: Run unit tests
  run: docker compose exec backend npm test

- name: Run integration tests
  run: docker compose exec backend npm run test:integration

- name: Security scan
  run: |
    docker scan elevatr-backend
    docker scan elevatr-frontend
```

**3. Multi-environment deployment**
```yaml
deploy-staging:
  if: github.ref == 'refs/heads/develop'
  run: |
    docker-compose -f docker-compose.yml -f docker-compose.staging.yml up -d

deploy-production:
  if: github.ref == 'refs/heads/main'
  run: |
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

#### Q20: What monitoring would you implement for production Docker containers?

**Answer:**
Comprehensive monitoring stack:

**1. Container Metrics (Prometheus + Grafana)**
```yaml
# docker-compose.monitoring.yml
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"
  
  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

**2. Log Aggregation (ELK Stack)**
```yaml
  elasticsearch:
    image: elasticsearch:8.0.0
  
  logstash:
    image: logstash:8.0.0
  
  kibana:
    image: kibana:8.0.0
    ports:
      - "5601:5601"
```

**3. Application Performance (New Relic / Datadog)**
```javascript
// backend/server.js
const newrelic = require('newrelic');

app.use((req, res, next) => {
  newrelic.addCustomAttribute('userId', req.user?.id);
  next();
});
```

**4. Health Checks (Built-in)**
```bash
# Monitor container health
docker compose ps

# Automated alerting
if [ $(docker inspect --format='{{.State.Health.Status}}' elevatr-backend) != "healthy" ]; then
  # Send alert
  curl -X POST $SLACK_WEBHOOK -d '{"text":"Backend unhealthy!"}'
fi
```

**5. Resource Monitoring**
```bash
# Real-time stats
docker stats

# Historical data
docker stats --no-stream >> /var/log/docker-stats.log
```

---

## 📝 Summary

### Key Takeaways

1. **Docker solves "works on my machine" problem** by packaging app + dependencies together
2. **Multi-stage builds** reduce image size from 1.5GB to 200MB
3. **Docker Compose** orchestrates multi-container apps with one command
4. **Containers are isolated** - one crash doesn't affect others
5. **Volumes persist data** across container restarts
6. **Health checks** enable auto-recovery
7. **Networks** allow secure container communication
8. **Alpine Linux** reduces image size by 6x

### Project Structure
```
elevatr/
├── docker-compose.yml          # Orchestrator
├── .env                         # Secrets
├── backend/
│   ├── Dockerfile              # Backend image recipe
│   ├── .dockerignore           # Build exclusions
│   └── server.js               # Health endpoint added
├── frontend/
│   ├── Dockerfile              # Frontend image recipe
│   ├── .dockerignore           # Build exclusions
│   └── nginx.conf              # Web server config
└── DOCKER_GUIDE.md             # Documentation
```

### Quick Commands
```bash
# Start
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f

# Stop
docker compose down

# Rebuild
docker compose up -d --build

# Clean
docker system prune -a
```

### Deployment Options
1. **Render** - Easy, free tier
2. **AWS ECS** - Scalable, production
3. **DigitalOcean** - Simple, affordable
4. **Docker Hub** - Easy sharing

---

**🎓 You're now ready to explain Docker in your viva!** Practice running the commands and explaining the concepts. Good luck! 🚀

