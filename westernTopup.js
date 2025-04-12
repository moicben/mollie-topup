import puppeteer from 'puppeteer';
import 'dotenv/config';
import { importCookies } from './importCookies.js';
import fs from 'fs/promises';
import path from 'path';

import { createNewPayment } from './createNewPayment.js';
import { updateExistingOrder } from './updateOrder.js';


const START_URL = 'https://www.westernunion.com/fr/fr/web/user/login';

async function checkPopup(page){
  // Verifie sur la page si 'button#onetrust-reject-all-handler' est présent ?
  await page.mouse.click(700, 440);
  await new Promise(resolve => setTimeout(resolve, 2000));

  const popup = await page.$('button#onetrust-reject-all-handler');

  if (popup) {
    console.log('Cookies found!');
    await popup.click();
    await new Promise(resolve => setTimeout(resolve, 2000));
  } else {
    console.log('Cookies not found..');
  }
}

async function westernTopup(orderNumber, paymentNumber, amount, cardDetails) {
  const browser = await puppeteer.launch({
    headless: false, // Mode non-headless pour voir le processus
    defaultViewport: null,
    args: [
      '--start-maximized',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled', // Désactiver les détections d'automatisation
      '--disable-infobars', // Supprimer la barre d'information
    ],
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,  
  });
  
  const page = await browser.newPage();
  let status = 'pending';
  amount = amount - 2.99

  try {

    console.log('Importing cookies...');
    await importCookies(page, 'cookies/western.json');

    console.log(`Navigating to ${START_URL}...`);
    await page.goto(START_URL, { waitUntil: 'networkidle2', timeout: 120000 });

    // Vérifier si le popup de cookies est présente (avec random clic)
    await new Promise(resolve => setTimeout(resolve, 2000));
    await checkPopup(page)
    await page.screenshot({ path: `logs/${paymentNumber}-0.png` });
    

    // Remplissage des logins
    const emailInput = await page.$('input#txtEmailAddr');
    const emailValue = await page.evaluate(input => input.value, emailInput);

    if (emailValue !== "bendoymclol@gmail.com") {
      await page.type('input#txtEmailAddr', "bendoymclol@gmail.com", { delay: 100 });
      await new Promise(resolve => setTimeout(resolve, 1000));
      await page.keyboard.press('Tab');
      await new Promise(resolve => setTimeout(resolve, 1000));
      await page.keyboard.press('Space');
    } else {
      console.log('Email is already set to bendoymclol@gmail.com');
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.type('input#txtKey', "Cadeau2014!", { delay: 100 });
    await new Promise(resolve => setTimeout(resolve, 1000));

    await page.keyboard.press('Enter');

    // Attendre que la connexion s'effectue
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 6000));

    // 

    // Se rendre sur la page de paiement
    console.log(`Navigating to: /send-money/start...`);
    await page.goto('https://www.westernunion.com/fr/fr/web/send-money/start', { waitUntil: 'networkidle2', timeout: 120000 });

    // Vérifier si le popup de cookies est présent
    await new Promise(resolve => setTimeout(resolve, 2000));
    await checkPopup(page)
    await page.screenshot({ path: `logs/${paymentNumber}-1.png` });

    // Entrer le montant 
    await page.click('input#txtSendAmount', { clickCount: 3 }); // Sélectionner tout le texte
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.keyboard.press('Backspace'); // Effacer le contenu
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.type('input#txtSendAmount', amount.toString(), { delay: 100 }); // Taper le montant
    await new Promise(resolve => setTimeout(resolve, 1000));

    await page.keyboard.press('Tab');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Réception sur compte bancaire
    await page.click('div#fundsOut_BA');
    await new Promise(resolve => setTimeout(resolve, 4000));

    // Valider le montant
    for (let i = 0; i < 9; i++) { // Selection Input Send
      await page.keyboard.press('Tab');
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    await page.screenshot({ path: `logs/${paymentNumber}-2.png` });

    // Scroller vers le base de 300 pixels
    await page.evaluate(() => window.scrollBy(0, 300));
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.keyboard.press('Enter');
    //await page.click('button#button-smo-continue');
    await new Promise(resolve => setTimeout(resolve, 3500));

    //

    // Valider la popup fraude
    const fraudWarning = await page.$('button#button-fraud-warning-accept');
    if (fraudWarning) {
      console.log('Fraud warning found!');
      await fraudWarning.click({ clickCount: 2 }); // Sélectionner tout le texte
      await new Promise(resolve => setTimeout(resolve, 4000));
    } else {
      console.log('Fraud warning not found..');
    }
    await page.screenshot({ path: `logs/${paymentNumber}-3.png` });

    //

    // Motif du transfer
    console.log('Filling purpose and origin...');
    await page.click('select#purposeTxt');
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.keyboard.press('A');
    await new Promise(resolve => setTimeout(resolve, 1500));
    await page.keyboard.press('Enter');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Origine des fonds
    await page.click('select#sofTxt');
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.keyboard.press('E');
    await new Promise(resolve => setTimeout(resolve, 1500));
    await page.keyboard.press('Enter');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Confirmer
    await page.keyboard.press('Tab');
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.keyboard.press('Enter');

    // 
    await page.screenshot({ path: `logs/${paymentNumber}-4.png` });

    // Charger la page carte
    await new Promise(resolve => setTimeout(resolve, 6000));

    // Ajouter une carte de crédit
    await page.click('div#add-new-card');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Remplir les informations de la carte
    console.log('Filling card details...');
    await page.keyboard.press('Tab');
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.keyboard.type(cardDetails.cardNumber, { delay: 250 });
    await new Promise(resolve => setTimeout(resolve, 1000));

    await page.keyboard.press('Tab');
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.keyboard.type(cardDetails.cardExpiration, { delay: 250 });
    await new Promise(resolve => setTimeout(resolve, 1000));

    await page.keyboard.press('Tab');
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.keyboard.type(cardDetails.cardCVC, { delay: 250 });
    await new Promise(resolve => setTimeout(resolve, 1000));

    await page.keyboard.press('Enter');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Ne pas sauvegarder la carte
    await page.click('a#not-now');
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.screenshot({ path: `logs/${paymentNumber}-5.png` });

    // Chargement confirmation
    console.log('Card Verification...');
    await new Promise(resolve => setTimeout(resolve, 21000));
    console.log('Card Verified?');
    await page.screenshot({ path: `logs/${paymentNumber}-6.png` });

    // Confirmer le paiement
    await page.click('p.custom-checkbox-section.ng-scope > label');
    await new Promise(resolve => setTimeout(resolve, 3000));
    await page.click('button#Submit');

    console.log('Begin 3D-Secure...');
    await new Promise(resolve => setTimeout(resolve, 60000));
    await page.screenshot({ path: `logs/${paymentNumber}-7.png` });
    await new Promise(resolve => setTimeout(resolve, 30000));
    await page.screenshot({ path: `logs/${paymentNumber}-8.png` });
    

    status = 'processed';
    await page.screenshot({ path: `logs/${paymentNumber}-processed.png` });

  }
  catch (error) {
    status = 'error';
    console.error('Error during navigation:', error);
    await page.screenshot({ path: `logs/${paymentNumber}-error.png` });
  } finally {

    // Extraire les cookies de la page 
    const endCookies = await page.cookies();
    await fs.writeFile('cookies/western.json', JSON.stringify(endCookies, null, 2));

    // Sauvegarder commande + paiement
    await updateExistingOrder(orderNumber, cardDetails, status);
    await createNewPayment(orderNumber, paymentNumber, status, amount, cardDetails);

    await browser.close();
  }
}

// const paymentNumber = 'test';
// const orderNumber = 'test'
// const amount = 100;
// const cardDetails = {
//     "cardNumber": "5355 8426 3233 7924",
//     "cardOwner": "John Doe",
//     "cardExpiration": "02/30",
//     "cardCVC": "656"
//   }

// // Lancer la fonction westernTopup
// await westernTopup(orderNumber, paymentNumber, amount, cardDetails);



export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Exemple d'attente des données dans le corps de la requête
  const { orderNumber, paymentNumber, amount, cardDetails } = req.body;
  if (!orderNumber || !paymentNumber || !amount || !cardDetails ) {
    return res.status(400).json({ error: 'Missing required parameters: amount and cardDetails' });
  }
  
  // Afficher dans les logs les informations reçues
  console.log('----- New Western Topup -----');
  console.log('Order Number:', orderNumber);
  console.log('Payment Number:', paymentNumber);
  console.log('Amount:', amount);
  console.log('Card Details:', cardDetails);
  console.log('-----');
  
  try {
    const result = await westernTopup(orderNumber, paymentNumber, amount, cardDetails);
    return res.status(200).json({ message: 'Western Topup automation completed successfully', result });
  } catch (error) {
    console.error('Error in Western Topup handler:', error);
    return res.status(500).json({ error: error.message });
  }
}
    
