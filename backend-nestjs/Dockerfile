FROM node:22-alpine AS build

WORKDIR /app

COPY backend-nestjs/package*.json ./
RUN npm ci

COPY backend-nestjs/ ./
RUN npm run build

FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY backend-nestjs/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

EXPOSE 3001

CMD ["node", "dist/main.js"]
