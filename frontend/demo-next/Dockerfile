FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install -g npm@10.9.2 && npm ci

COPY . .

RUN npm run build

EXPOSE 3003

CMD ["npm", "run", "start", "--", "-H", "0.0.0.0", "-p", "3003"]
