FROM ghcr.io/puppeteer/puppeteer:24.4.0

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN chmod +x ./render-build.sh

CMD ["sh", "-c", "./render-build.sh && npm install && node index.js"]