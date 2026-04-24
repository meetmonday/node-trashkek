FROM oven/bun:alpine

ARG GIT_HASH
ENV GIT_HASH=${GIT_HASH}

WORKDIR /usr/src/app

RUN apk --update add ffmpeg

COPY package*.json ./
COPY bun.lock ./
RUN bun ci

COPY . .

CMD ["bun", "start"]
