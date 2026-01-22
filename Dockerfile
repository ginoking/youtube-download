FROM nikolaik/python-nodejs:python3.12-nodejs23-slim

RUN apt-get update && apt-get install -y ffmpeg aria2

WORKDIR /app

COPY package.json .

RUN npm install -g nodemon

RUN npm install

COPY . ./

EXPOSE $PORT

# CMD ["npm", "start"]
CMD ["nodemon", "app.js"]