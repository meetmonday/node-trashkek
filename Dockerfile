FROM oven/bun:alpine

WORKDIR /usr/src/app

RUN apk --update add ffmpeg

COPY package*.json ./
COPY bun.lock ./
RUN bun ci

COPY . .

CMD ["bun", "start"]
