# Multi-stage build for mocogi Node.js app
# Stage 1: Build dependencies and application
FROM node:24-alpine3.22 AS builder

# Build arguments for metadata
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION=latest

# Build arguments for environment variables
ARG KEYCLOAK_URL
ARG KEYCLOAK_REALM
ARG KEYCLOAK_CLIENT_ID
ARG BACKEND_URL_PREFIX

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including devDependencies needed for build)
RUN npm ci --only=production=false

# Copy source code
COPY . .

# Set production environment for build
ENV NODE_ENV=production

# Set environment variables from build arguments for SvelteKit static env
ENV KEYCLOAK_URL=${KEYCLOAK_URL}
ENV KEYCLOAK_REALM=${KEYCLOAK_REALM}
ENV KEYCLOAK_CLIENT_ID=${KEYCLOAK_CLIENT_ID}
ENV BACKEND_URL_PREFIX=${BACKEND_URL_PREFIX}

# Build the application
RUN npm run build

# Prune dev dependencies after build
RUN npm prune --production

# Stage 2: Production runtime
FROM node:24-alpine3.22 AS runtime

# Add metadata labels
LABEL maintainer="alexander.dobrynin@th-koeln.de"
LABEL org.opencontainers.image.title="mocogi-frontend"
LABEL org.opencontainers.image.version=${VERSION}
LABEL org.opencontainers.image.created=${BUILD_DATE}
LABEL org.opencontainers.image.revision=${VCS_REF}
LABEL org.opencontainers.image.source="https://github.com/THK-ADV/modules"

# Install dumb-init for proper signal handling and security updates
RUN apk add --no-cache dumb-init && \
    apk upgrade --no-cache && \
    rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S mocogi -u 1001

# Set working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder --chown=mocogi:nodejs /app/build build/
COPY --from=builder --chown=mocogi:nodejs /app/node_modules node_modules/
COPY --from=builder --chown=mocogi:nodejs /app/package.json package.json

# Copy static files for nginx to serve (optional - nginx can serve these directly)
COPY --from=builder --chown=mocogi:nodejs /app/static static/

# Switch to non-root user
USER mocogi

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application with dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "build"] 