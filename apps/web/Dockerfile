# -----------------------------
# Build stage
# -----------------------------
FROM node:20-alpine AS build
WORKDIR /repo
RUN corepack enable

# Monorepo basics
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY packages ./packages

# Which app are we building? (default: apps/web)
ARG APP_DIR=apps/web
ENV APP_DIR=${APP_DIR}

# Copy just this app into the build context
COPY ${APP_DIR} ./${APP_DIR}

# Install deps after all workspaces & app are present
RUN pnpm install --frozen-lockfile

# Build Next.js (standalone)
WORKDIR /repo/${APP_DIR}
ENV NEXT_TELEMETRY_DISABLED=1

# --- Build-time placeholders (server-only) ---
# Safe placeholders so build doesn't fail if some code reads env at build.
ARG DATABASE_URL="postgresql://user:pass@localhost:5432/postgres"
ARG DATABASE_RLS_URL="postgresql://user:pass@localhost:5432/postgres"
ARG SUPABASE_SERVICE_ROLE_KEY="placeholder"
ENV DATABASE_URL=$DATABASE_URL
ENV DATABASE_RLS_URL=$DATABASE_RLS_URL
ENV SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
# ---------------------------------------------

RUN pnpm run build


# -----------------------------
# Runtime stage (standalone)
# -----------------------------
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Keep the same APP_DIR value at runtime
ARG APP_DIR=apps/web
ENV APP_DIR=${APP_DIR}

# Copy the minimal standalone output
# .next/standalone includes all required prod deps
COPY --from=build /repo/${APP_DIR}/.next/standalone ./
# Static assets + public
COPY --from=build /repo/${APP_DIR}/.next/static ./${APP_DIR}/.next/static
COPY --from=build /repo/${APP_DIR}/public ./${APP_DIR}/public

EXPOSE 3000
# In a monorepo, Next puts server.js under {APP_DIR}/server.js
CMD ["sh", "-c", "node $APP_DIR/server.js"]




## --- build ---
#FROM node:20-alpine AS build
#WORKDIR /repo
#RUN corepack enable
#
## Copy lockfiles + workspace manifest
#COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
#
## Copy workspace packages + app BEFORE install so pnpm links workspaces
#COPY packages ./packages
#COPY apps/web ./apps/web
#
## Install deps
#RUN pnpm install --frozen-lockfile
#
## Build Next.js app
#WORKDIR /repo/apps/web
#ENV NEXT_TELEMETRY_DISABLED=1
#
## ---- Build-time placeholders (server-only) ----
## These unblock Next/Turbopack if some code reads env during build.
## They are safe because runtime env will override them.
#ARG DATABASE_URL="postgresql://user:pass@localhost:5432/postgres"
#ARG DATABASE_RLS_URL="postgresql://user:pass@localhost:5432/postgres"
#ARG SUPABASE_SERVICE_ROLE_KEY="placeholder"
#
## Expose them to the build process (only in this stage)
#ENV DATABASE_URL=$DATABASE_URL
#ENV DATABASE_RLS_URL=$DATABASE_RLS_URL
#ENV SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
## -----------------------------------------------
#
#RUN pnpm run build
#
## --- run ---
#FROM node:20-alpine
#WORKDIR /app
#ENV NODE_ENV=production
#ENV HOST=0.0.0.0
#ENV PORT=3000
#
## Copy only what we need to run
#COPY --from=build /repo/apps/web/.next ./.next
#COPY --from=build /repo/apps/web/public ./public
#COPY --from=build /repo/apps/web/package.json ./package.json
#COPY --from=build /repo/node_modules ./node_modules
#
#EXPOSE 3000
#CMD ["node", "node_modules/.bin/next", "start", "-p", "3000"]
#
#
#
### --- build ---
##FROM node:20-alpine AS build
##WORKDIR /repo
##RUN corepack enable
##
### Copy lockfiles + workspace manifest
##COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
##
### Copy workspace packages + app
##COPY packages ./packages
##COPY apps/web ./apps/web
##
### Install dependencies (now that workspace code is in place)
##RUN pnpm install --frozen-lockfile
##
### Build Next.js app
##WORKDIR /repo/apps/web
##ENV NEXT_TELEMETRY_DISABLED=1
##RUN pnpm run build
##
### --- run ---
##FROM node:20-alpine
##WORKDIR /app
##ENV NODE_ENV=production
##ENV PORT=3000
##ENV HOST=0.0.0.0
##
### Copy only production build output and needed files
##COPY --from=build /repo/apps/web/.next ./.next
##COPY --from=build /repo/apps/web/public ./public
##COPY --from=build /repo/apps/web/package.json ./package.json
##COPY --from=build /repo/node_modules ./node_modules
##
##EXPOSE 3000
##CMD ["node", "node_modules/.bin/next", "start", "-p", "3000"]
