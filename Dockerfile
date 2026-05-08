# syntax=docker/dockerfile:1.7

# ---- deps: install node modules (cached layer) ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# ---- dev: vite dev server with HMR ----
FROM deps AS dev
WORKDIR /app
COPY . .
EXPOSE 5173
CMD ["npx", "vite", "--host", "0.0.0.0", "--port", "5173"]

# ---- test: one-shot vitest run ----
FROM deps AS test
WORKDIR /app
COPY . .
RUN npm test

# ---- build: produce static dist/ ----
FROM deps AS build
WORKDIR /app
COPY . .
RUN npm run build

# ---- runtime: nginx serving the built SPA ----
FROM nginx:alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
CMD ["nginx", "-g", "daemon off;"]
