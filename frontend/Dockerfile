FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the code
COPY . .

# Build the Next.js app
RUN npm run build

# Next.js runs on port 3000 by default
EXPOSE 3000

# Start the Next.js production server
CMD ["npm", "start"]