FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install -g npm@10.9.2 && npm ci

COPY . .

EXPOSE 3001

CMD ["npm", "run", "start:dev"]
