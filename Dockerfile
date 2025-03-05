from nikolaik/python-nodejs:latest

RUN apt-get update && apt-get install -y ffmpeg aria2

WORKDIR /app

COPY package.json .

RUN npm install -g nodemon

RUN npm install

COPY . .

CMD ["npm", "run", "dev"]