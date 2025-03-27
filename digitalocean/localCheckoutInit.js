const puppeteer = require('puppeteer');

const { delay, getGiftCardCombination } = require('./utils');

async function startSession(userLat, userLong, payAmount, giftCardValues) {
  console.log(`Init checkout for ${payAmount} EUR...`);

  const browser = await puppeteer.launch({
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--proxy-server=pr.oxylabs.io:7777',
      '--window-size=1440,900'
    ],
    defaultViewport: {
      width: 1440,
      height: 900
    }
  });

  const page = await browser.newPage();
  
  await page.authenticate({
    username: 'customer-moicben_M3oDB-cc-fr',
    password: 'Cadeau2014+123'
  });

  await page.setExtraHTTPHeaders({
    'X-Oxylabs-Geolocation': '49.9235:-97.0811;10',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'fr-FR,fr;q=0.9',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'max-age=0',
    'Referer': 'https://www.google.com/search?q=eneba+gift+card+5%E2%82%AC'
  });

  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
  ];
  const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
  await page.setUserAgent(randomUserAgent);

  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
    });

    window.chrome = {
      runtime: {},
    };

    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) =>
      parameters.name === 'notifications'
        ? Promise.resolve({ state: Notification.permission })
        : originalQuery(parameters);

    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5],
    });

    Object.defineProperty(navigator, 'languages', {
      get: () => ['fr-FR', 'fr'],
    });

    const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function (parameter) {
      if (parameter === 37445) {
        return 'Intel Inc.';
      }
      if (parameter === 37446) {
        return 'Intel Iris OpenGL Engine';
      }
      return getParameter(parameter);
    };

    Object.defineProperty(navigator, 'mediaDevices', {
      get: () => ({
        enumerateDevices: () => Promise.resolve([{ kind: 'videoinput' }, { kind: 'audioinput' }, { kind: 'audiooutput' }]),
      }),
    });
  });

  const giftCardCombination = getGiftCardCombination(payAmount, giftCardValues);
  for (const value of giftCardCombination) {
    await page.goto(`https://www.eneba.com/eneba-eneba-gift-card-${value}-eur-global`, { waitUntil: 'networkidle2' });
    console.log(`Page loaded for ${value} EUR gift card`);
    await page.screenshot({ path: 'eneba_gift_card.png' });

    await randomDelay(1000, 3000);

    const buyNowSelector = '#app > main > div > div > div.O8Oi6F > div > div.nt5C9V > div > div.YHd7Sm.AX1zeG > div > div > div.CzH2Oq > div.jM_rb8 > div.mJtqU0 > button';
    await page.waitForSelector(buyNowSelector);
    await page.click(buyNowSelector);
    console.log('Buy now clicked');

    await randomDelay(2000, 4000);
  }

  await randomDelay(2000, 3000);
  await page.screenshot({ path: 'eneba_cart.png' });

  const checkoutSelector = '#app > main > form > div.y7qjBq > div:nth-child(2) > button';
  await page.waitForSelector(checkoutSelector);
  await page.click(checkoutSelector);
  console.log('Checkout clicked');

  await randomDelay(4000, 5000);
  await page.screenshot({ path: 'eneba_checkout.png' });

  // Extra TIME
  await randomDelay(4000000);

  return { browser, page };
}

const randomDelay = (min, max) => new Promise(r => setTimeout(r, Math.floor(Math.random() * (max - min + 1)) + min));


startSession(49.9235, -97.0811, 100, [5, 10, 20, 50, 100, 200, 500, 1000]);
