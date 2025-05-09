import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';

import { launchBrowser } from './utils/puppeteer/launchBrowser.js';

const COOKIES_FILE = path.join(process.cwd(), 'cookies/mollie.json');
const MOLLIE_URL = 'https://mollie.com/';

async function importCookies(page) {
  try {
    const cookies = JSON.parse(await fs.readFile(COOKIES_FILE, 'utf-8'));
    //console.log('Importing cookies..', cookies);
    await page.setCookie(...cookies);
    console.log('Cookies imported successfully.');
  } catch (error) {
    console.error('Error importing cookies:', error.message);
    throw new Error('Failed to import cookies');
  }
}

async function payDebug(amount, cardDetails) {

  // Lancer le navigateur Puppeteer optimisé
  const { browser, page } = await launchBrowser();

  try {

   // Importer les cookies
    await importCookies(page);

    // Naviguer vers l'URL Mollie
    console.log(`Navigating to ${MOLLIE_URL}...`);
    await page.goto(MOLLIE_URL, { waitUntil: 'networkidle2', timeout: 120000 });

    // Attendre que la page se charge complètement
    await new Promise(resolve => setTimeout(resolve, 2000));


    await page.screenshot({ path: 'click.png' });

    // Cliquer sur le bouton pour ajouter des fonds
    await page.click(
      '#root > div > main > article > div > div > div > section > div > div:nth-child(2) > div > div:nth-child(1) > button'
    );

    // Attendre
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Taper le montant
    await page.keyboard.type(amount.toString());

    // Attendre
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Appuyer sur Entrer
    await page.keyboard.press('Enter');

    // Attendre
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Appuyer 2 fois sur 'Tab'
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Appuyer sur Entrer
    await page.keyboard.press('Enter');

    // Attendre le checkout 
    await new Promise(resolve => setTimeout(resolve, 2000));

    // ScreenShot de la page
    await new Promise(resolve => setTimeout(resolve, 7500));
    await page.screenshot({ path: 'initiated.png' });
  } catch (error) {
    console.error(error);
  } finally {
    await browser.close();
  }
}

const cardDetails = {
  cardNumber: '4242 4242 4242 4242',
  cardOwner: 'John Doe',
  cardExpiration: '12/23',
  cardCVC: '123',
};

payDebug(100, cardDetails);

