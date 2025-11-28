# FortuneOne AI Widget Backend - Docker Image for Railway
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev for build)
RUN npm install

# Copy TypeScript config and source
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript to JavaScript
RUN npm run build

# Copy JSON config files to dist
RUN cp -r src/modules/business-config/*.json dist/modules/business-config/ 2>/dev/null || mkdir -p dist/modules/business-config && cp src/modules/business-config/*.json dist/modules/business-config/

# Remove dev dependencies for smaller image
RUN npm prune --production

# Expose port
EXPOSE 4000

# Set environment variable
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

# Start the server
CMD ["node", "dist/server.js"]
