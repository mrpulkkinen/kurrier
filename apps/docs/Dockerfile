# ---- deps (pre-fetch) ----
FROM node:20-alpine AS deps
WORKDIR /app

# Optional but recommended for some Next.js native deps
RUN apk add --no-cache libc6-compat

# Use pnpm via Corepack and pin the version
RUN corepack enable && corepack prepare pnpm@10.18.3 --activate

# Copy lockfile(s) first to maximize cache hits
COPY package.json ./
# If you use workspaces, also:
# COPY pnpm-workspace.yaml ./
# COPY apps/yourapp/package.json apps/yourapp/

# Pre-fetch dependencies into pnpm store (no source yet)
RUN pnpm fetch

# ---- build ----
FROM node:20-alpine AS build
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.18.3 --activate

# Bring in the cached pnpm store from the deps stage
COPY --from=deps /root/.local/share/pnpm/store /root/.local/share/pnpm/store

# Now add the full source
COPY . .

# Install from the offline store and build
RUN pnpm install --frozen-lockfile --offline
RUN pnpm run build

# ---- runtime ----
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Next.js standalone output assumes next.config.js sets `output: 'standalone'`
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

# If the standalone server is at server.js (Next default)
CMD ["node", "server.js"]



#FROM node:20-alpine AS build
#WORKDIR /app
#
#COPY . .
#
## Install deps and build
#RUN npm install && npm run build
#
## --- runtime ---
#FROM node:20-alpine AS runtime
#WORKDIR /app
#ENV NODE_ENV=production
#
#COPY --from=build /app/public ./public
#COPY --from=build /app/.next/standalone ./
#COPY --from=build /app/.next/static ./.next/static
#
#CMD ["node", "server.js"]
