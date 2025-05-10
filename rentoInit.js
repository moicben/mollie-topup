import puppeteer from 'puppeteer';
import 'dotenv/config';

import { checkCookies } from './utils/western/checkCookies.js';
import { pressKey } from './utils/puppeteer/pressKey.js';
import { launchBrowser } from './utils/puppeteer/launchBrowser.js';

const START_URL = 'https://inrento.com/portfolio/';
//const START_URL = 'https://whatsmyip.com/';
//const START_URL = 'https://www.christopeit-sport.fr/';

async function rentoInit(orderNumber, amount) {

  // Lancer le navigateur Puppeteer optimisé
  const { browser, page } = await launchBrowser();

  let status = 'started';
  let comment = '';	

  try {

    // PAGE "Portfolio"

    //console.log(`Navigating to ${START_URL}...`);
    await page.goto(START_URL, { waitUntil: 'networkidle2', timeout: 120000 });

    // Ouverture de la page de paiement
    await new Promise(resolve => setTimeout(resolve, 3000));
    await page.evaluate(() => {
      document.querySelectorAll("button.btn.btn-primary.btn-lg.deposit-button.js-open-modal")[1].click();
    });

    await new Promise(resolve => setTimeout(resolve, 10000));
    await page.click('button.btn.btn-primary.btn-lg.deposit-button.js-open-modal');
    //

    console.log('----- Init Completed ----- ');

    status = 'initiated';

    // Fermer le navigateur automatiquement après 5 minutes si aucun proceed n'est lancé
    const closeTimeout = setTimeout(() => {
      console.log('[X] Browser inactif 5 min -> browser.close()');
      browser.close();
      status = 'inactive';

      // Others things to do..

    }, 5 * 60 * 1000);
    browser.closeTimeout = closeTimeout;

    return { browser, page };

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
const amount = 100;

// Lancer la fonction rentoInit
await rentoInit(orderNumber, amount);




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
  console.log('----- Rento Proceed -----');
  console.log('Order Number:', orderNumber);
  console.log('Amount:', amount);
  console.log('-----');
  
  try {
    const { browser, page } = await rentoInit(orderNumber, amount);
    
    // Mettez à jour l'état partagé pour que /western-proceed puisse l'utiliser
    westernSession.browser = browser;
    westernSession.page = page;
    
    res.status(200).json({ message: 'Western initialized successfully', status: 'initialized' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
