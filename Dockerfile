FROM oven/bun:alpine

ARG GIT_HASH
ENV GIT_HASH=${GIT_HASH}

WORKDIR /usr/src/app

COPY package*.json ./
COPY bun.lock ./
RUN bun ci

COPY . .

CMD ["bun", "start"]
