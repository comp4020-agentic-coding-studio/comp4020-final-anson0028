# syntax = docker/dockerfile:1

# One Node process serves the pages, the WebSocket and README.md at /readme/.
# It must listen on 0.0.0.0:$PORT (fly.toml sets PORT) and keep anything that
# persists under /data, the volume (spec/README.md says what's checked).

FROM docker.io/library/node:24-slim
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.9.0 --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod
COPY server ./server
COPY public ./public
COPY README.md ./
ENV NODE_ENV=production DATA_DIR=/data
CMD ["node", "--max-old-space-size=160", "server/index.ts"]
