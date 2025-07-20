FROM node:18-alpine
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 8000
CMD ["sh", "-c", "npx prisma db push && node dist/src/server.js"]