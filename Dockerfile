FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable \
  && corepack prepare pnpm@10.33.4 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY tsconfig.json vitest.config.ts DISCLAIMER.md ./
COPY src ./src
COPY labs ./labs

RUN chown -R node:node /app

ENV HOST=0.0.0.0
ENV PORT=3000
EXPOSE 3000

USER node
CMD ["node", "--import", "tsx", "src/index.ts"]
