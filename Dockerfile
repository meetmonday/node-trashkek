FROM oven/bun:alpine

WORKDIR /usr/src/app

RUN apk --update add ffmpeg

COPY package*.json ./
RUN bun ci

COPY . .

CMD ["bun", "start"]
