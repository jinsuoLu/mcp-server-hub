FROM node:22-alpine AS builder
WORKDIR /app
COPY pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/tsconfig.json ./packages/shared/
COPY packages/server-weather/package.json packages/server-weather/tsconfig.json ./packages/server-weather/
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY packages/shared/src ./packages/shared/src
COPY packages/server-weather/src ./packages/server-weather/src
RUN pnpm build
FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/packages/server-weather/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/index.js"]