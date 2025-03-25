FROM ghcr.io/puppeteer/puppeteer:13.7.0

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome

WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm ci 
COPY . .