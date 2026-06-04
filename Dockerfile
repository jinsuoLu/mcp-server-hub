FROM node:22-alpine AS builder
WORKDIR /app
COPY pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/tsconfig.json ./packages/shared/

COPY packages/server-weather/package.json packages/server-weather/tsconfig.json ./packages/server-weather/
COPY packages/server-translator/package.json packages/server-translator/tsconfig.json ./packages/server-translator/
COPY packages/server-filesystem/package.json packages/server-filesystem/tsconfig.json ./packages/server-filesystem/
COPY packages/server-database/package.json packages/server-database/tsconfig.json ./packages/server-database/
COPY packages/server-web-search/package.json packages/server-web-search/tsconfig.json ./packages/server-web-search/
COPY packages/server-datetime/package.json packages/server-datetime/tsconfig.json ./packages/server-datetime/
COPY packages/server-calculator/package.json packages/server-calculator/tsconfig.json ./packages/server-calculator/
COPY packages/server-qrcode/package.json packages/server-qrcode/tsconfig.json ./packages/server-qrcode/
COPY packages/server-rss/package.json packages/server-rss/tsconfig.json ./packages/server-rss/
COPY packages/server-memory/package.json packages/server-memory/tsconfig.json ./packages/server-memory/
COPY packages/server-fetch/package.json packages/server-fetch/tsconfig.json ./packages/server-fetch/
COPY packages/server-code-runner/package.json packages/server-code-runner/tsconfig.json ./packages/server-code-runner/
COPY packages/server-knowledge/package.json packages/server-knowledge/tsconfig.json ./packages/server-knowledge/

ENV PNPM_CONFIG_IGNORE_SCRIPTS=false
RUN npm install -g pnpm && \
    pnpm install --no-frozen-lockfile

COPY packages/shared/src ./packages/shared/src
COPY packages/server-weather/src ./packages/server-weather/src
COPY packages/server-translator/src ./packages/server-translator/src
COPY packages/server-filesystem/src ./packages/server-filesystem/src
COPY packages/server-database/src ./packages/server-database/src
COPY packages/server-web-search/src ./packages/server-web-search/src
COPY packages/server-datetime/src ./packages/server-datetime/src
COPY packages/server-calculator/src ./packages/server-calculator/src
COPY packages/server-qrcode/src ./packages/server-qrcode/src
COPY packages/server-rss/src ./packages/server-rss/src
COPY packages/server-memory/src ./packages/server-memory/src
COPY packages/server-fetch/src ./packages/server-fetch/src
COPY packages/server-code-runner/src ./packages/server-code-runner/src
COPY packages/server-knowledge/src ./packages/server-knowledge/src

RUN pnpm build

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/server-weather/dist ./packages/server-weather/dist
COPY --from=builder /app/packages/server-translator/dist ./packages/server-translator/dist
COPY --from=builder /app/packages/server-filesystem/dist ./packages/server-filesystem/dist
COPY --from=builder /app/packages/server-database/dist ./packages/server-database/dist
COPY --from=builder /app/packages/server-web-search/dist ./packages/server-web-search/dist
COPY --from=builder /app/packages/server-datetime/dist ./packages/server-datetime/dist
COPY --from=builder /app/packages/server-calculator/dist ./packages/server-calculator/dist
COPY --from=builder /app/packages/server-qrcode/dist ./packages/server-qrcode/dist
COPY --from=builder /app/packages/server-rss/dist ./packages/server-rss/dist
COPY --from=builder /app/packages/server-memory/dist ./packages/server-memory/dist
COPY --from=builder /app/packages/server-fetch/dist ./packages/server-fetch/dist
COPY --from=builder /app/packages/server-code-runner/dist ./packages/server-code-runner/dist
COPY --from=builder /app/packages/server-knowledge/dist ./packages/server-knowledge/dist
COPY --from=builder /app/node_modules ./node_modules

CMD ["node", "packages/server-weather/dist/index.js"]