from node:22-alpine

WORKDIR /app

COPY package.json .

RUN npm install -g nodemon

RUN npm install

COPY . .

CMD ["npm", "run", "dev"]