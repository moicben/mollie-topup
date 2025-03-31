import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import path from 'path';
import { fileURLToPath } from 'url';

// Recréer __dirname dans un module ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pathToExtension = path.join(__dirname, 'CapSolver.Browser.Extension');
puppeteer.use(StealthPlugin);

(async () => {
  const browser = await puppeteer.launch({
    headless: false, // Mode non-headless pour voir le processus
    defaultViewport: null,
    args: [
      '--start-maximized',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
    ],
  });

  const page = await browser.newPage();

  try {
    // Naviguer vers la page de démonstration reCAPTCHA
    console.log('Navigating to Google reCAPTCHA demo...');
    await page.goto('https://google.com/recaptcha/api2/demo', { waitUntil: 'networkidle2' });

    // Attendre que le captcha soit visible
    console.log('Waiting for reCAPTCHA to load...');
    await page.waitForSelector('.g-recaptcha', { visible: true });

    // Résoudre le captcha avec l'extension Capsolver
    console.log('Solving reCAPTCHA...');
    // L'extension Capsolver devrait résoudre automatiquement le captcha

    // Prendre une capture d'écran après avoir résolu le captcha
    await page.screenshot({ path: 'recaptcha-solved.png' });
    console.log('Screenshot saved as recaptcha-solved.png');
  } catch (error) {
    console.error('Error during reCAPTCHA solving:', error.message);
  } finally {
    await browser.close();
  }
})();