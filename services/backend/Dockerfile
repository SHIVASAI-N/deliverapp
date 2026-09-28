FROM node:20-alpine AS builder

WORKDIR /app

# Copy root monorepo files
COPY package.json turbo.json ./
COPY packages/types ./packages/types
COPY services/backend ./services/backend

# Install & Build
RUN npm install --ignore-scripts || true
RUN cd packages/types && npm run build || true
RUN cd services/backend && npm run build || node build.js

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

COPY --from=builder /app/services/backend/dist ./dist
COPY --from=builder /app/services/backend/package.json ./package.json

EXPOSE 5000

CMD ["node", "dist/main.js"]
