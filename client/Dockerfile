# --- Stage 1: build ---
# Compiles the Vite app into static files. This stage's node_modules and
# build tools never make it into the final image — only the output does.
FROM node:20-slim AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Build-time env vars — Vite bakes these into the compiled JS at build time,
# so they must be passed as build args, not runtime environment variables
# (unlike the backend, which reads .env at startup).
ARG VITE_BASE_URL
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_BASE_URL=$VITE_BASE_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

RUN npm run build

# --- Stage 2: serve ---
# A tiny Nginx image that only contains the compiled static files from
# Stage 1 — no Node, no node_modules, no source code.
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]