# ============================================
# PRODUCTION DOCKERFILE — Multi-Stage Build
# Workforce Management System (WMS) Backend
# ============================================

# ---------- Stage 1: Build ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for Docker layer caching
COPY package.json package-lock.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm install --ignore-scripts

# Copy Prisma schema & generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source code & build
COPY tsconfig.json nest-cli.json ./
COPY src ./src/

RUN npm run build

# ---------- Stage 2: Production ----------
FROM node:20-alpine AS production

# Security: run as non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install ONLY production dependencies
RUN npm install --omit=dev --ignore-scripts

# Copy Prisma schema & regenerate client (production-only deps)
COPY prisma ./prisma/
RUN npx prisma generate

# Copy compiled output from builder stage
COPY --from=builder /app/dist ./dist

# Copy seed script (needed for database initialization)
COPY seed-all-data.js ./

# Set ownership to non-root user
RUN chown -R appuser:appgroup /app

USER appuser

# Expose application port
EXPOSE 3001

# Health check — polls the root endpoint every 30s
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/ || exit 1

# Start the production server
CMD ["node", "dist/main.js"]
