# 学習用イメージ。
# build で better-sqlite3 をコンパイルし、実行ステージには python3 / make / g++ を入れない。
# ソースと開発依存は残すので、コンテナ内で pnpm test と pnpm typecheck が実行できる。

FROM node:22-bookworm-slim AS build

# prepare より前に置く。既定だと root のホームに入り、USER node から見えず再ダウンロードになる。
ENV COREPACK_HOME=/opt/corepack

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable \
  && corepack prepare pnpm@10.33.4 --activate \
  && chmod -R a+rX /opt/corepack

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY tsconfig.json vitest.config.ts DISCLAIMER.md compose.yaml ./
COPY src ./src
COPY labs ./labs

FROM node:22-bookworm-slim AS runtime

ENV COREPACK_HOME=/opt/corepack
ENV HOST=0.0.0.0
ENV PORT=3000

COPY --from=build --chown=node:node /opt/corepack /opt/corepack
RUN corepack enable \
  && chmod -R a+rX /opt/corepack

WORKDIR /app
COPY --from=build --chown=node:node /app /app

EXPOSE 3000
USER node
CMD ["node", "--import", "tsx", "src/index.ts"]
