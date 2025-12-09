# -----------------------------
# Stage 1: Builder (Node.js + pkg)
# -----------------------------
FROM node:18-alpine AS builder

ARG TARGET_PLATFORM=node18-linux-x64
ARG BINARY_NAME=pgctl-linux

WORKDIR /app

COPY package*.json ./

# Install production dependencies first (pkg needs them to bundle)
RUN npm ci --production

# Install pkg globally
RUN npm install -g pkg@5.8.1

COPY index.js ./
COPY src/ ./src/

# Build the binary
RUN echo "🔨 Building binary for ${TARGET_PLATFORM}..." && \
    pkg . --targets ${TARGET_PLATFORM} --output build/${BINARY_NAME} && \
    ls -lh build/

# -----------------------------
# Stage 2: Minimal runtime image
# -----------------------------
# Using Debian slim because pkg-built Node binaries require glibc (not musl from Alpine)
FROM debian:bookworm-slim

WORKDIR /app

# Install minimal runtime dependencies including PostgreSQL client
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    postgresql-client \
 && rm -rf /var/lib/apt/lists/*

# Copy the standalone binary from builder
ARG BINARY_NAME=pgctl-linux
COPY --from=builder /app/build/${BINARY_NAME} /app/pgctl

# Make executable
RUN chmod +x /app/pgctl

# Create non-root user for security
RUN groupadd -r -g 1000 pgctl && \
    useradd -r -u 1000 -g pgctl pgctl && \
    chown -R pgctl:pgctl /app

USER pgctl

ENTRYPOINT ["/app/pgctl"]
