# Stage 1: Build the application
FROM node:20-alpine AS build

WORKDIR /app

COPY . .

RUN apk --no-cache add git \
    && git submodule init \
    && git submodule update

RUN npm ci

RUN npm run prisma:generate

RUN npm run build

# Stage 2: Create the final image with only the dist folder
FROM node:20-alpine AS production

WORKDIR /app

COPY --from=build /app/dist ./dist

COPY package.json package-lock.json ./

RUN npm install --only=production

ENTRYPOINT ["npm", "run", "start:prod"]