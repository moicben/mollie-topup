import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

import { importCookies } from './importCookies.js';

const MOLLIE_LOGIN_URL = 'https://my.mollie.com/dashboard/login?lang=en';

async function loginToMollie() {
  const browser = await puppeteer.launch({
    headless: `new`, // Mode non-headless pour voir le processus
    defaultViewport: null,
    args: ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: '/usr/bin/google-chrome',
  });

  const page = await browser.newPage();

  try {
    // Importer les cookies
      await importCookies(page, 'cookies/mollie.json');

    // Naviguer vers la page de connexion Mollie
    console.log(`Navigating to ${MOLLIE_LOGIN_URL}...`);
    await page.goto(MOLLIE_LOGIN_URL, { waitUntil: 'networkidle2' });

    // Attendre
    await new Promise(resolve => setTimeout(resolve, 2000));

    await page.screenshot({ path: 'mollie-start.png' });

    // Taper l'email
    console.log('Typing email...');
    await page.keyboard.type('benedikt.strokin@gmail.com', { delay: 100 });

    // Attendre
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Appuyer sur Tab pour passer au champ mot de passe
    await page.keyboard.press('Tab');

    // Attendre
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Taper le mot de passe
    console.log('Typing password...');
    await page.keyboard.type('D&veloppe2018!', { delay: 100 });

    // Attendre
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Appuyer sur Tab pour passer au bouton "Se souvenir de moi"
    await page.keyboard.press('Tab');

    // Attendre
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Appuyer sur Espace pour cocher la case "Se souvenir de moi"
    console.log('Checking "Remember me"...');
    await page.keyboard.press('Space');

    // Attendre
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Appuyer sur Entrée pour soumettre le formulaire
    console.log('Submitting login form...');
    await page.keyboard.press('Enter');

    // Attendre
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.screenshot({path: 'mollie-entered.png'});

    // Attendre 
    await new Promise(resolve => setTimeout(resolve, 6000));
    await page.screenshot({ path: 'mollie-pending.png' });

    // Attendre que je confirme la connexion
    await new Promise(resolve => setTimeout(resolve, 30000));


    // Attendre que la page de tableau de bord se charge
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log('Login elapsed!');

    // Attendre
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Prendre une capture d'écran après la connexion
    await page.screenshot({ path: 'mollie-dashboard.png' });

    // Exporter les cookies
    const cookies = await page.cookies();
    const cookiesPath = path.join(__dirname, 'cookies', 'mollie.json');
    fs.writeFileSync(cookiesPath, JSON.stringify(cookies, null, 2));
    

  } catch (error) {
    console.error('Error during Mollie login:', error.message);
  } finally {
    await browser.close();
  }
}

export default loginToMollie;