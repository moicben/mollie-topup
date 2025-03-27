import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--proxy-server=pr.oxylabs.io:7777',
      '--viewport=1440x900'
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

  // Random function to choose one user-agent in a large list for browsing
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  ];
  const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
  await page.setUserAgent(randomUserAgent);

  // Load cookies from file
  const cookiesPath = path.resolve('../cookies/check-browser.json');
  const cookiesString = await fs.readFile(cookiesPath, 'utf8');
  const cookies = JSON.parse(cookiesString);
  await page.setCookie(...cookies);

  // Additional settings to make the browser more realistic
  await page.evaluateOnNewDocument(() => {
    // Pass the Webdriver test
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
    });

    // Pass the Chrome test
    window.chrome = {
      runtime: {},
    };

    // Pass the Permissions test
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) =>
      parameters.name === 'notifications'
        ? Promise.resolve({ state: Notification.permission })
        : originalQuery(parameters);

    // Pass the Plugins Length test
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5],
    });

    // Pass the Languages test
    Object.defineProperty(navigator, 'languages', {
      get: () => ['fr-FR', 'fr'],
    });

    // Pass the WebGL Vendor and Renderer test
    const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function (parameter) {
      // UNMASKED_VENDOR_WEBGL
      if (parameter === 37445) {
        return 'Intel Inc.';
      }
      // UNMASKED_RENDERER_WEBGL
      if (parameter === 37446) {
        return 'Intel Iris OpenGL Engine';
      }
      return getParameter(parameter);
    };

    // Pass the WebRTC test
    Object.defineProperty(navigator, 'mediaDevices', {
      get: () => ({
        enumerateDevices: () => Promise.resolve([{ kind: 'videoinput' }, { kind: 'audioinput' }, { kind: 'audiooutput' }]),
      }),
    });
  });

  let success = false;

  while (!success) {
    try {
      await page.goto('https://gologin.com/check-browser/', { waitUntil: 'networkidle2' });
      await page.screenshot({ path: 'browser_test.png' });

      // délais de 30 secondes
      await new Promise(resolve => setTimeout(resolve, 30000));

      success = true;
    } catch (error) {
      console.error('An unexpected error occurred:', error);
      break;
    }
  }

  await browser.close();
})();