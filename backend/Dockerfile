# Backend Dockerfile - Multi-stage build for optimization

# Stage 1: Base
FROM node:18-alpine AS base
WORKDIR /app

# Install dependencies only when needed
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Development dependencies (for building if needed)
FROM base AS deps-dev
COPY package*.json ./
RUN npm ci

# Stage 3: Runner - Production image
FROM base AS runner
WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Create uploads directory for file storage
RUN mkdir -p uploads/resumes uploads/profiles && \
    chown -R node:node uploads

# Use non-root user for security
USER node

# Expose the port the app runs on
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "server.js"]

