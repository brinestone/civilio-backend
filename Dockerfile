FROM node:20-alpine AS base

WORKDIR /app

COPY .output/public ./public

COPY ./.output/nitro.json ./

COPY ./.output/server ./server

COPY ./server/migrations ./server/migrations

EXPOSE 3000/tcp
EXPOSE 5534/udp

CMD ["node", "server/index.mjs"]