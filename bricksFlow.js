import { pressKey } from './utils/puppeteer/pressKey.js';
import { launchBrowser } from './utils/puppeteer/launchBrowser.js';

import { createPayment } from './utils/supabase/createPayment.js';
import { updateOrder } from './utils/supabase/updateOrder.js';

const START_URL = 'https://app.bricks.co/';
//const START_URL = 'https://whatsmyip.com/';
//const START_URL = 'https://www.christopeit-sport.fr/';

async function bricksFlow(orderNumber, amount, cardDetails, paymentNumber) {

  // Lancer le navigateur Puppeteer optimisé
  const { browser, page } = await launchBrowser();

  let status = 'initiated';
  let comment = '';	

  try {

    console.log(`Navigating to ${START_URL}...`);
    await page.goto(START_URL, { waitUntil: 'networkidle2', timeout: 120000 });
    await new Promise(resolve => setTimeout(resolve, 4000));

    // Vérifier si connecté sinon "Login"
    if (page.url() !== START_URL) {
      console.log('Not logged, have to login...');

      await page.type('input[type="email"]', 'benjamain.georges@gmail.com', { delay: 100 });
      await page.type('input[type="password"]', 'Cadeau2014!', { delay: 100 });
      await page.click('button[type="submit"]');

      await new Promise(resolve => setTimeout(resolve, 6000));
      console.log('Login finished');
    }

    //

    // PAGE "Dashboard"	

    // Open Credit Popup
    console.log('Start...');
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
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Fill Card Form
    await pressKey(page, 'Tab', 2);
    await page.keyboard.type(cardDetails.cardNumber, { delay: 200 });
    await pressKey(page, 'Tab', 1);

    // Fill Month and Year
    const [month, year] = cardDetails.cardExpiration.split('/').map(Number);
    await pressKey(page, 'ArrowDown', month - 1);
    await pressKey(page, 'Tab', 1);
    await pressKey(page, 'ArrowDown', year - 25);
    await pressKey(page, 'Tab', 1);

    // Fill CVC
    await page.keyboard.type(cardDetails.cardCVC, { delay: 200 });
    await new Promise(resolve => setTimeout(resolve, 2000));

    await pressKey(page, 'Enter', 1);
    

    // 3D-SECURE Verification
    console.log('Begin 3D-Secure Verif...');
    await new Promise(resolve => setTimeout(resolve, 120000));

    status = 'processed';

    console.log('----- Bricks Flow Processed ----- ');
    
    browser.close();
    return { paymentUrl }

  } catch (error) {
    console.error('Error during registration:', error);

    comment = error.message || 'Unknown error';
    status = 'error'; 
    console.log('----- Bricks Flow Error ----- ');

  }
  finally {

    // Close the browser
    await browser.close(); 

    // Store in Supabase Order and Payment
    await updateOrder(orderNumber, cardDetails, status);
    await createPayment(orderNumber, paymentNumber, status, amount, cardDetails);


  }
}

// const orderNumber = 'test'
// const amount = 10;

// // Lancer la fonction bricksFlow
// await bricksFlow(orderNumber, amount);


//

// Handler pour l'endpoint, à utiliser dans index.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Vérifier les paramètres requis de la requête
  const { orderNumber, amount, cardDetails, paymentNumber } = req.body;
  if (!orderNumber || !amount ) {
    return res.status(400).json({ error: 'Missing required parameters: amount or orderNumber' });
  }
  
  // Afficher dans les logs les informations reçues
  console.log('----- New Bricks Flow -----');
  console.log('Order Number:', orderNumber);
  console.log('Payment Number:', paymentNumber);
  console.log('Amount:', amount);
  console.log('Card Details:', cardDetails);
  console.log('-----');
  
  try {
    const { paymentUrl } = await bricksFlow(orderNumber, amount, cardDetails, paymentNumber);
    
    // Mettez à jour l'état partagé pour que /Bricks-proceed puisse l'utiliser
    browserSession.paymentUrl = paymentUrl;
    
    res.status(200).json({ message: 'Bricks Flow successfully', status: 'Flowialized' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
