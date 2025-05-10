import puppeteer from 'puppeteer';
import 'dotenv/config';

import { pressKey } from './utils/puppeteer/pressKey.js';
import { launchBrowser } from './utils/puppeteer/launchBrowser.js';
import { browserSession } from './utils/puppeteer/browserSession.js';

const START_URL = 'https://inrento.com/portfolio/';

async function rentoInit(orderNumber, amount) {

  // Lancer le navigateur Puppeteer optimisé
  const { browser, page } = await launchBrowser();

  let status = 'started';
  let comment = '';	

  try {

    // PAGE "Portfolio"
    await page.goto(START_URL, { waitUntil: 'networkidle2', timeout: 120000 });

    // Injection d'Axios dans la page
    await page.addScriptTag({ url: 'https://unpkg.com/axios@0.21.0/dist/axios.min.js' });
    
    // Test de la présence d'Axios en effectuant une requête GET
    const axiosTestData = await page.evaluate(async () => {
      const response = await axios.get('https://httpbin.org/get');
      return response.data;
    });
    console.log('Axios test data:', axiosTestData);
    
    // Ouverture popup paiement
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.evaluate(() => {
      document.querySelectorAll("button.btn.btn-primary.btn-lg.deposit-button.js-open-modal")[1].click();
    });

    // Saisir le montant
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.click('input#deposit_mango_pay_wallet_amount');

    amount = amount * 0.98;
    await page.keyboard.type(amount.toString());

    await new Promise(resolve => setTimeout(resolve, 3000));
    await pressKey(page, 'Enter');

    console.log('----- Init Completed ----- ');

    if (page.url().includes('pay.mangopay')) {
      status = 'initiated';
    }

    // Fermer le navigateur automatiquement après 5 minutes si aucun proceed n'est lancé
    const closeTimeout = setTimeout(() => {
      console.log('[X] Browser inactif 5 min -> browser.close()');
      browser.close();
      status = 'inactive';
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
}

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
    const { browser, page } = await rentoInit(orderNumber, amount);
    
    // Mettez à jour l'état partagé pour que /Rento-proceed puisse l'utiliser
    browserSession.browser = browser;
    browserSession.page = page;
    
    res.status(200).json({ message: 'Rento initialized successfully', status: 'initialized' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}