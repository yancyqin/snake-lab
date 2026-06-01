FROM node:20-alpine
WORKDIR /app

# Install deps first (better layer caching)
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Copy source
COPY . .

EXPOSE 8080
ENV PORT=8080

CMD ["node", "server.js"]
