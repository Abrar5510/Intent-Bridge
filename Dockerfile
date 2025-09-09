# Dockerfile 

FROM node:20-alpine 

 

# Set working directory 

WORKDIR /app 

 

# Copy package files 

COPY package*.json ./ 

 

# Install dependencies 

RUN npm ci --only=production 

 

# Copy application files 

COPY . . 

 

# Create necessary directories 

RUN mkdir -p /app/data 

 

# Set environment variables 

ENV NODE_ENV=production 

ENV PORT=3000 

 

# MCP server uses stdio, not HTTP 

# So we don't expose a port for MCP 

 

# The MCP server command 

CMD ["node", "src/mcp-server.js"] 