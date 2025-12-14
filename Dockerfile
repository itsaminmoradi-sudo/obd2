FROM node:18-slim

WORKDIR /app

COPY package.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/

RUN npm install

COPY . .

RUN npm run build

ENV NODE_ENV=production
EXPOSE 3001

CMD ["npm", "start"]
