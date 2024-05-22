FROM node:20

# Set working directory
WORKDIR /app

# Copy packge.json
COPY package*.json ./

# Copy project
COPY . .

# Copy env
RUN if [ "$NODE_ENV" = "production" ]; then \
    cp ./pulsefeed-common/.env.production .env; \
    else \
    cp ./pulsefeed-common/.env.development .env; \
    fi


# Install app dependencies
RUN npm ci

# Run build
RUN npm run build

# Start prod build
ENTRYPOINT ["npm", "run", "start:prod"]