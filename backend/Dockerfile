# backend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your backend code
COPY . .

# IMPORTANT: Replace 5000 with the port your express app listens on
EXPOSE 5000

# Start the app (change index.js to your entry file, e.g., app.js or server.js)
CMD ["node", "server.js"]