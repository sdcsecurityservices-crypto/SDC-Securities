FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
FROM node:22-bookworm-slim
ENV NODE_ENV=production HOST=0.0.0.0
WORKDIR /app
COPY --from=build /app/dist/standalone ./
COPY --from=build /app/scripts/notification-worker.mjs /app/scripts/start-production.mjs ./scripts/
USER node
CMD ["node","scripts/start-production.mjs"]
