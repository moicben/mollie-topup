import puppeteer from 'puppeteer';
import 'dotenv/config';
import fs from 'fs';

// Proxy Configuration 
const proxyAddress = 'proxy.oculus-proxy.com';
const proxyPort = '31111';
const proxyUsername = 'oc-6dadca2fa8878f26054ed56b2d1dbbbba2f6272c36647ec0c67b2fb8991323be-country-us-session-173b57';
const proxyPassword = '5t716xg0zzjr';
const proxyCertificate = fs.readFileSync('./utils/proxyCertificate.crt', 'utf8');

// Configure l'environnement Node pour utiliser le certificat comme CA supplémentaire
//process.env.NODE_EXTRA_CA_CERTS = './utils/proxyCertificate.crt';

export async function launchBrowser() {
  const browser = await puppeteer.launch({
    headless: false, // Mode non-headless pour voir le processus
    ignoreHTTPSErrors: true, // Pour ignorer les erreurs HTTPS via le proxy
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

  // Injecter des scripts pour tromper certaines détections
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
      if (parameter === 37445) return 'Intel Inc.';
      if (parameter === 37446) return 'Intel Iris OpenGL Engine';
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