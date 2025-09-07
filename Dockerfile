FROM node:20-slim

# Create directories for VS Code Server with proper permissions
RUN mkdir -p /home/node/.vscode-server/extensions \
    /home/node/.vscode-server/data \
    /home/node/.vscode-server/bin \
    /home/node/.vscode-server-insiders/extensions \
    /home/node/app \
    && chown -R node:node /home/node

WORKDIR /app

# Ensure the app directory is owned by node
RUN chown -R node:node /app

# Install development tools and SSL certificates for extension downloads
RUN apt-get update && apt-get install -y \
    git \
    curl \
    ca-certificates \
    gnupg \
    openssl \
    sudo \
    --no-install-recommends \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && echo "node ALL=(root) NOPASSWD:ALL" > /etc/sudoers.d/node \
    && chmod 0440 /etc/sudoers.d/node

# Configure npm to bypass signature verification
RUN npm config set strict-ssl false

# Install dependencies only when needed
COPY --chown=node:node package.json package-lock.json* ./
RUN npm ci

# Copy source files with appropriate permissions
COPY --chown=node:node . .

# Create .vite directory with proper permissions
RUN mkdir -p node_modules/.vite && \
    chown -R node:node /app

# Expose port
EXPOSE 5173

# Switch to the non-root user
USER node

# Start development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
