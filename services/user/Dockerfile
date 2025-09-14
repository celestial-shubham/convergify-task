# AI: User Service Dockerfile (Claude assisted)
FROM node:18-alpine

WORKDIR /app

# Copy workspace root package files
COPY package*.json ./
COPY packages/ ./packages/

# Copy service-specific files
COPY services/user/ ./services/user/

# Install workspace dependencies from root
RUN npm install --legacy-peer-deps

# Build common package first
RUN cd packages/common && npm run build

# Build the service
RUN cd services/user && npm run build

# Change working directory to service
WORKDIR /app/services/user

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/graphql?query={__typename} || exit 1

# Start the service
CMD ["npm", "run", "start:prod"]