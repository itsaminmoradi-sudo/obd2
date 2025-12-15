# Use the official Node.js 18 image
FROM node:18-slim

# Create and change to the app directory
WORKDIR /usr/src/app

# Copy application dependency manifests
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install app dependencies
RUN npm install
RUN npm install --prefix client
RUN npm install --prefix server

# Copy local business logic
COPY . .

# Build the client
RUN npm run build:client

# Expose the port the app runs on
EXPOSE 3001

# Run the app
CMD [ "npm", "start" ]
