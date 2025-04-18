import puppeteer from 'puppeteer';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';


const sessionsData = JSON.parse(fs.readFileSync('./utils/puppeteer/sessions.json'), 'utf8')
const randomSession = sessionsData[Math.floor(Math.random() * sessionsData.length)].session;

// Proxy Configuration 
const proxyAddress = 'proxy.oculus-proxy.com';
const proxyPort = '31112';
const proxyPassword = 'sxjozu794g50';
// Construire le proxyUsername en injectant la session aléatoire
const proxyUsername = 'oc-0b3b58f5de2c1506ce227d596c3517f6586af56e3fc513b2c187e07ba94b765e-country-FR-session-' + randomSession;
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
