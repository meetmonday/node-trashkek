FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .

CMD ["npm", "run", "start"]
