FROM node:22-alpine

WORKDIR /app

COPY js/package*.json ./
RUN npm install
COPY docker/js/start.sh /usr/local/bin/js-start
RUN chmod +x /usr/local/bin/js-start

EXPOSE 5173

CMD ["/usr/local/bin/js-start"]
