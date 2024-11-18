# Stage 1: Build the application
FROM node:20-alpine AS build

WORKDIR /app

COPY . .

RUN apk --no-cache add git \
    && git submodule init \
    && git submodule update

RUN npm ci

RUN npx prisma generate --schema=./pulsefeed-common/prisma/schema.prisma

RUN npm run build

# Stage 2: Create the final image with only the dist folder
FROM node:20-alpine AS production

WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/pulsefeed-common/prisma/schema.prisma ./dist/prisma/schema.prisma

COPY package.json package-lock.json ./

RUN npm ci --only=production

RUN npx prisma generate --schema=./dist/prisma/schema.prisma

CMD ["npm", "run", "start:prod"]