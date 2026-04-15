# Stage 1: Build the Vite frontend
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine

WORKDIR /app

# Copy backend dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built frontend and server
COPY --from=builder /app/dist ./dist
COPY server.js ./

EXPOSE 8080

CMD ["node", "server.js"]
