# ============================================
# Stage 1: Builder
# ============================================
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Copy package files and install ALL dependencies (including dev)
COPY package*.json ./
RUN bun install --legacy-peer-deps

# Copy source and build
COPY . .
RUN bun run build

# ============================================
# Stage 2: Production
# ============================================
FROM oven/bun:1-alpine

WORKDIR /app

# Copy package files and install ONLY production dependencies
COPY package*.json ./
RUN bun install --legacy-peer-deps --production

# Copy built artifacts, server, and lib from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/lib ./lib
COPY server.js ./

# Expose ports
EXPOSE 5001

# Start server
CMD ["bun", "server.js"]
