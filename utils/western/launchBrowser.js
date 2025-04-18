import puppeteer from 'puppeteer';
import 'dotenv/config';
import fs from 'fs';

// Proxy Configuration 
const proxyAddress = 'brd.superproxy.io';
const proxyPort = 33335;
const proxyUsername = 'brd-customer-hl_07d8ef96-zone-residential_proxy1-country-fr';
const proxyPassword = 'Cadeau2914!';
const proxyCertificate =  fs.readFileSync('./utils/proxyCertificate.crt', 'utf8');

export async function launchBrowser() {
  const browser = await puppeteer.launch({
    headless: false, // Mode non-headless pour voir le processus
    defaultViewport: null,
    args: [
      '--start-maximized',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled', 
      '--disable-infobars',
      '--disable-features=IsolateOrigins,site-per-process', 
      '--disable-notifications', 
      '--disable-geolocation',
      `--proxy-server=${proxyAddress}:${proxyPort}`,
    ],
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
  });

  const page = await browser.newPage();

  // Authentification par proxy
  await page.authenticate({
    username: proxyUsername,
    password: proxyPassword,
  });

  // Définir des en-têtes HTTP supplémentaires
  // await page.setExtraHTTPHeaders({
  //   'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
  //   'Accept-Encoding': 'gzip, deflate, br',
  //   'Accept-Language': 'fr-FR,fr;q=0.9',
  //   'Connection': 'keep-alive',
  //   'Upgrade-Insecure-Requests': '1',
  //   'Sec-Fetch-Dest': 'document',
  //   'Sec-Fetch-Mode': 'navigate',
  //   'Sec-Fetch-Site': 'none',
  //   'Sec-Fetch-User': '?1',
  //   'Cache-Control': 'max-age=0',
  // });

  // Choisir aléatoirement un User-Agent
  // const userAgents = [
  //   'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
  //   'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Safari/605.1.15',
  //   'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
  //   'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
  //   'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
  // ];
  // const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
  // await page.setUserAgent(randomUserAgent);

  //Injecter des scripts pour tromper certaines détections (ex: webdriver, plugins, langues, etc.)
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    window.chrome = { runtime: {} };
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) =>
      parameters.name === 'notifications'
        ? Promise.resolve({ state: Notification.permission })
        : originalQuery(parameters);
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
    Object.defineProperty(navigator, 'languages', { get: () => ['fr-FR', 'fr'] });
    const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(parameter) {
      if(parameter === 37445) return 'Intel Inc.';
      if(parameter === 37446) return 'Intel Iris OpenGL Engine';
      return getParameter(parameter);
    };
    Object.defineProperty(navigator, 'mediaDevices', {
      get: () => ({
        enumerateDevices: () =>
          Promise.resolve([
            { kind: 'videoinput' },
            { kind: 'audioinput' },
            { kind: 'audiooutput' }
          ])
      })
    });
  });

  return { browser, page };
}