FROM node:20-bookworm AS build

WORKDIR /workspace

RUN corepack enable

ARG VITE_STUDY_RUNTIME_API_URL=http://127.0.0.1:8001
ENV VITE_STUDY_RUNTIME_API_URL=${VITE_STUDY_RUNTIME_API_URL}

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/domain-models/package.json packages/domain-models/package.json

RUN pnpm install --frozen-lockfile

COPY apps/web apps/web
COPY packages packages

RUN pnpm --filter web build

FROM nginx:1.27-alpine

COPY docker/nginx-stage.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/apps/web/dist /usr/share/nginx/html

EXPOSE 80
