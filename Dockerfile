FROM node:20-slim

WORKDIR /app

# Copy dependency configs
COPY package*.json ./

# Install packages
# Note: we ignore scripts to prevent msnodesqlv8 from trying to build Windows binary components on Linux.
# Our backend/db.js runtime resolves driver fallbacks automatically.
RUN npm install --omit=dev --ignore-scripts || npm install --omit=dev

# Copy application source code
COPY backend ./backend
COPY KV_test.sql ./

EXPOSE 5000

ENV PORT=5000
ENV NODE_ENV=production

CMD ["node", "backend/server.js"]
