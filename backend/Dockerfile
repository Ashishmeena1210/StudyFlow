FROM node:20-alpine AS builder

WORKDIR /app

# Dummy DATABASE_URL so npx prisma generate succeeds during Docker image build stage
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public"

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

EXPOSE 5000

# Execute database migrations at runtime when Render supplies production DATABASE_URL
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
