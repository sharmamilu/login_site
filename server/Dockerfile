# Stage 1: Base build stage
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Stage 2: Development (with native Node file watching)
FROM base AS development
EXPOSE 5000
CMD ["node", "--watch", "index.js"]

# Stage 3: Production (optimized runner)
FROM node:20-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY . .
EXPOSE 5000
CMD ["node", "index.js"]
