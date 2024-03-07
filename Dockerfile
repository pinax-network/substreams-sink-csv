FROM node:alpine
WORKDIR /home
COPY package*.json ./
RUN npm ci
COPY . .
ENTRYPOINT ["npm", "start"]