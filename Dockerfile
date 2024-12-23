# Stage 1: Build the application
FROM node:22.12.0-alpine AS build

WORKDIR /app

RUN apk --no-cache add git openssl

COPY . .

RUN git submodule init && git submodule update

RUN npm ci

RUN npm run prisma:generate

RUN npm run build

# Stage 2: Create the final image with only the dist folder
FROM node:22.12.0-alpine AS production

WORKDIR /app

RUN apk --no-cache add git openssl

COPY --from=build /app/dist ./dist

COPY --from=build /app/pulsefeed-common/prisma/schema.prisma ./dist/pulsefeed-common/prisma/schema.prisma

COPY package.json package-lock.json ./

RUN npm ci --only=production

RUN npx prisma generate --schema=./dist/pulsefeed-common/prisma/schema.prisma

CMD ["npm", "run", "start:prod"]
