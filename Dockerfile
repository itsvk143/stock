# Build Stage for NestJS
FROM node:20-slim AS node-build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

# Build Stage for Python
FROM python:3.11-slim AS python-build
WORKDIR /app/data-service
COPY data-service/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY data-service/ ./

# Final Production Image
FROM node:20-slim
WORKDIR /app

# Install Python and PM2
RUN apt-get update && apt-get install -y python3 python3-pip && \
    npm install -g pm2 && \
    apt-get clean

# Copy Node build
COPY --from=node-build /app/backend/dist ./backend/dist
COPY --from=node-build /app/backend/node_modules ./backend/node_modules
COPY --from=node-build /app/backend/package.json ./backend/package.json

# Copy Python service
COPY --from=python-build /app/data-service ./data-service
RUN pip3 install --no-cache-dir -r data-service/requirements.txt

# Environment variables
ENV PORT=8080
ENV DATA_LAYER_URL=http://localhost:8001

# Start both services using PM2
COPY ecosystem.config.js ./
CMD ["pm2-runtime", "ecosystem.config.js"]
