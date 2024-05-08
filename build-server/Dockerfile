# New Docker
FROM node:slim

# Set the working directory
WORKDIR /home/app

RUN apt-get update \
    && apt-get install -y git \
    && rm -rf /var/lib/apt/lists/*

# Copy necessary files
COPY main.sh main.sh
COPY script.js script.js
COPY key.json key.json
COPY package*.json .

# Install dependencies and set permissions
RUN npm install \
    && chmod +x main.sh \
    && chmod +x script.js 

# Entrypoint
ENTRYPOINT ["/home/app/main.sh"]