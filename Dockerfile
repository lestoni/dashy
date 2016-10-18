# Recipe for cooking dashy docker image

FROM node:4.3.0

MAINTAINER Tony Mutai <tonimut7@gmail.com>

ADD . /home/dashy

WORKDIR /home/dashy

RUN npm install

EXPOSE 7500

ENTRYPOINT ["node", "app.js"]
