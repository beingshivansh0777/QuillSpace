# Node 20 LTS, slim variant — smaller than the default full image, still has
# everything needed for native module builds (bcryptjs, etc.)
FROM node:20-slim

WORKDIR /app

# Copy only package files first — Docker caches layers, so if only your
# source code changes (not dependencies), this layer is reused instead of
# re-running npm install on every build. Speeds up rebuilds significantly.
COPY package*.json ./
RUN npm ci --omit=dev

# Now copy the actual source code
COPY . .

EXPOSE 3000

CMD ["node", "server.js"]