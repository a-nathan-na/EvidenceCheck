# Use Node.js for both building and serving
FROM node:20-slim

WORKDIR /

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci || npm install

# Copy application code
COPY . .

# Build the app (creates /dist folder)
RUN npm run build

# Install 'serve', a static file server for Node.js
RUN npm install -g serve

# Expose port 3000
EXPOSE 3000

# Start the server pointing to the build output directory
# -s flag ensures single-page-app routing works (rewrites 404s to index.html)
CMD ["serve", "-s", "dist", "-l", "3000"]