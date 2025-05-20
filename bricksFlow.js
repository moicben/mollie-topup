import puppeteer from 'puppeteer';
import 'dotenv/config';

import { pressKey } from './utils/puppeteer/pressKey.js';
import { launchBrowser } from './utils/puppeteer/launchBrowser.js';
import { browserSession } from './utils/puppeteer/browserSession.js';
import { getRandomIdentity } from './utils/getRandomIdentity.js';

const START_URL = 'https://app.bricks.co/';
//const START_URL = 'https://whatsmyip.com/';
//const START_URL = 'https://www.christopeit-sport.fr/';

async function rentoInit(orderNumber, amount) {

  // Lancer le navigateur Puppeteer optimisé
  const { browser, page } = await launchBrowser();

  let status = 'initiated';
  let comment = '';	

  try {

    console.log(`Navigating to ${START_URL}...`);
    await page.goto(START_URL, { waitUntil: 'networkidle2', timeout: 120000 });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Vérifier si connecté sinon "Login"
    if (page.url() !== START_URL) {
      console.log('Not logged, have to login...');

      await page.type('input[type="email"]', 'benjamain.georges@gmail.com', { delay: 100 });
      await page.type('input[type="password"]', 'Cadeau2014!', { delay: 100 });
      await page.click('button[type="submit"]');

      await new Promise(resolve => setTimeout(resolve, 9000));
      console.log('Login finished');
    }

    //

    // PAGE "Dashboard"	

    // Open Credit Popup
    console.log('Navigating to Dashboard...');
    await page.click('.p-3.bg-orange-primary.rounded-full.flex.flex-row.items-center.cursor-pointer.px-4');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Add amount
    await page.type('.mantine-InputWrapper-root input', amount.toString(), { delay: 200 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    await page.click('.px-6.gap-2.bg-white button:nth-child(1)');
    
    // Choose By  Card
    await page.click('.p-4.css-1l5shxy');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Add Card
    await page.click('button.css-33ym0c');
    await new Promise(resolve => setTimeout(resolve, 11000));

    // Fill Card Form
    await pressKey(page, 'Tab', 2);
    await page.keyboard.type('4319 5900 5893 3050', { delay: 200 });
    await pressKey(page, 'Tab', 1);

    // Fill Month and Year
    await pressKey(page, 'ArrowDown', 0);
    await pressKey(page, 'Tab', 1);

    await pressKey(page, 'ArrowDown', 4);
    await pressKey(page, 'Tab', 1);

    // Fill CVC
    await page.keyboard.type('744', { delay: 200 });
    await new Promise(resolve => setTimeout(resolve, 2000));

    await pressKey(page, 'Enter', 1);
    

    // 3D-SECURE Verification
    console.log('Begin 3D-Secure Verif...');
    await new Promise(resolve => setTimeout(resolve, 60000));



    console.log('----- Bricks Flow Completed ----- ');
    
    browser.close();
    return { paymentUrl }

  } catch (error) {
    console.error('Error during registration:', error);

    comment = error.message || 'Unknown error';
    status = 'error'; 


    await browser.close(); // Fermer le navigateur en cas d'erreur
    throw error;
  }
  finally {

  }
}

const orderNumber = 'test'
const amount = 10;

// Lancer la fonction rentoInit
await rentoInit(orderNumber, amount);


//

// Handler pour l'endpoint, à utiliser dans index.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Vérifier les paramètres requis de la requête
  const { orderNumber, amount } = req.body;
  if (!orderNumber || !amount ) {
    return res.status(400).json({ error: 'Missing required parameters: amount or orderNumber' });
  }
  
  // Afficher dans les logs les informations reçues
  console.log('----- Rento Init -----');
  console.log('Order Number:', orderNumber);
  console.log('Amount:', amount);
  console.log('-----');
  
  try {
    const { paymentUrl } = await rentoInit(orderNumber, amount);
    
    // Mettez à jour l'état partagé pour que /Rento-proceed puisse l'utiliser
    browserSession.paymentUrl = paymentUrl;
    
    res.status(200).json({ message: 'Rento initialized successfully', status: 'initialized' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
