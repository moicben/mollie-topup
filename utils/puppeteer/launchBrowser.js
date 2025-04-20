import puppeteer from 'puppeteer';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';


const sessionsData = JSON.parse(fs.readFileSync('./utils/puppeteer/sessions.json', 'utf8'));
const randomSession = sessionsData[Math.floor(Math.random() * sessionsData.length)].session;

// Proxy Configuration 
const proxyAddress = 'proxy.oculus-proxy.com';
const proxyPort = '31114';
const proxyPassword = 'dfpe5rpkmi51';
// Construire le proxyUsername en injectant la session aléatoire
const proxyUsername = 'oc-c4f429f9aa48f650d6a6e218641ae60b3858e57bd6530f3aa7b7abed0a130d96-country-FR-session-9e0f0'


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
      '--disable-web-security', 
      '--disable-features=IsolateOrigins,site-per-process', 
      //`--proxy-server=${proxyAddress}:${proxyPort}`,
      '--ignore-certificate-errors',
      '--disable-software-rasterizer',
    ],
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
  });

  // Utiliser l'onglet par défaut créé lors du launch
  const pages = await browser.pages();
  const page = pages.length ? pages[0] : await browser.newPage();

  // Authentification par proxy (si besoin)
  await page.authenticate({
    username: proxyUsername,
    password: proxyPassword,
  });

  // Injecter des scripts pour tromper certaines détections
  // await page.evaluateOnNewDocument(() => {
  //   Object.defineProperty(navigator, 'webdriver', { get: () => false });
  //   window.chrome = { runtime: {} };
  //   const originalQuery = window.navigator.permissions.query;
  //   window.navigator.permissions.query = (parameters) =>
  //     parameters.name === 'notifications'
  //       ? Promise.resolve({ state: Notification.permission })
  //       : originalQuery(parameters);
  //   Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
  //   Object.defineProperty(navigator, 'languages', { get: () => ['fr-FR', 'fr'] });
  //   const getParameter = WebGLRenderingContext.prototype.getParameter;
  //   WebGLRenderingContext.prototype.getParameter = function(parameter) {
  //     if (parameter === 37445) return 'Intel Inc.';
  //     if (parameter === 37446) return 'Intel Iris OpenGL Engine';
  //     return getParameter(parameter);
  //   };
  //   Object.defineProperty(navigator, 'mediaDevices', {
  //     get: () => ({
  //       enumerateDevices: () =>
  //         Promise.resolve([
  //           { kind: 'videoinput' },
  //           { kind: 'audioinput' },
  //           { kind: 'audiooutput' }
  //         ])
  //     })
  //   });
  // });

  return { browser, page };
}
