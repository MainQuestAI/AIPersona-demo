FROM node:20-bookworm

WORKDIR /workspace

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/domain-models/package.json packages/domain-models/package.json

RUN pnpm install --frozen-lockfile

COPY apps/web apps/web
COPY packages packages
