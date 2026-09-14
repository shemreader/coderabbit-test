FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev \
    && apk upgrade --no-cache \
    && rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
              /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack

COPY src ./src

USER node

EXPOSE 3000

CMD ["node", "src/server.js"]
