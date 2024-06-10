FROM oven/bun:1-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN bun install

COPY . .

CMD ["bun", "run", "start"]