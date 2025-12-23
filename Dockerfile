# Use Node.js 18 LTS as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Create app directory
RUN mkdir -p /app/uploads /app/logs

# Copy package.json and package-lock.json first
COPY package*.json ./

# Clear npm cache and install dependencies
RUN npm cache clean --force

# Install all dependencies (including devDependencies for build)
RUN npm install --no-optional

# Copy application files
COPY . .

# Build the application if needed
RUN npm run build 2>/dev/null || true

# Remove development dependencies to reduce image size
RUN npm prune --production

# Set permissions for uploads directory
RUN chown -R node:node /app/uploads /app/logs

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of the app directory to nodejs user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js || exit 1

# Start the application
CMD ["npm", "start"]