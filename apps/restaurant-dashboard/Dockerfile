FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json turbo.json ./
COPY packages/types ./packages/types
COPY apps/restaurant-dashboard ./apps/restaurant-dashboard

RUN npm install || true
RUN cd packages/types && npm run build || true
RUN cd apps/restaurant-dashboard && npm run build || true

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/apps/restaurant-dashboard ./

EXPOSE 3000

CMD ["npm", "start"]
