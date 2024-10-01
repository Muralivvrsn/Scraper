# Use official Node.js LTS version as a base image
FROM node:16-slim

# Install necessary dependencies for Puppeteer and Chrome
RUN apt-get update \
    && apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Install Chrome dependencies
RUN apt-get update && apt-get install -y \
    wget \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables for Puppeteer to use its bundled Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Install Chromium manually
RUN apt-get update \
    && apt-get install -y \
    chromium

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy rest of the application code
COPY . .

# Expose port if the application is a web service
EXPOSE 3000

# Run the application
CMD ["node", "index.js"]
