# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN apk add --no-cache python3 make g++
RUN npm ci
COPY . .
RUN rm -f tsconfig.tsbuildinfo && npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache dumb-init
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]

EXPOSE 3000
