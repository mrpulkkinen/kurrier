# --- build ---
FROM node:20-alpine AS build
WORKDIR /repo
RUN corepack enable

# 1) Copy lockfiles + workspace manifest
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./

# 2) Copy the workspaces BEFORE install so pnpm can link them
COPY packages ./packages
COPY apps/worker ./apps/worker

# 3) Now install (pnpm sees the workspaces & links node_modules properly)
RUN pnpm install --frozen-lockfile

# 4) Build the worker
WORKDIR /repo/apps/worker
ENV NITRO_PRESET=node-server
RUN pnpm run build

# --- run ---
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3001

COPY --from=build /repo/apps/worker/.output ./.output
EXPOSE 3001
CMD ["node",".output/server/index.mjs"]


## --- build ---
#FROM node:20-alpine AS build
#WORKDIR /repo
#RUN corepack enable
#
#COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
#RUN pnpm install --frozen-lockfile
#
#COPY packages ./packages
#COPY apps/worker ./apps/worker
#
#WORKDIR /repo/apps/worker
#ENV NITRO_PRESET=node-server
#RUN pnpm build
#
## --- run ---
#FROM node:20-alpine
#WORKDIR /app
#ENV NODE_ENV=production
#COPY --from=build /repo/apps/worker/.output ./.output
#EXPOSE 3001
#CMD ["node",".output/server/index.mjs"]
