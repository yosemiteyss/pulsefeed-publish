# Stage 1: Build the application
FROM node:22.12.0-alpine AS build

WORKDIR /app

RUN apk --no-cache add git openssl

COPY . .

RUN git submodule init && git submodule update

RUN npm ci

RUN npm run build

# Stage 2: Create the final image with only the dist folder
FROM node:22.12.0-alpine AS production

WORKDIR /app

RUN apk --no-cache add git openssl

COPY --from=build /app/dist ./dist

COPY package.json package-lock.json ./

RUN npm ci --only=production

CMD ["npm", "run", "start:prod"]
