FROM node:20

# Set working directory
WORKDIR /app

# Copy packge.json
COPY package*.json ./

# Copy project
COPY . .

# Copy env
COPY .env.development .env

# Install app dependencies
RUN npm ci

# Run build
RUN npm run build

# Start prod build
CMD ["npm", "run", "start:prod"]