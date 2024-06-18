FROM node:20-alpine

WORKDIR /usr/src/app

RUN apk --update add ffmpeg

COPY package*.json ./
RUN npm ci

COPY . .

CMD ["npm", "run", "start"]
