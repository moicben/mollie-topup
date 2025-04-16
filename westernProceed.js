
import fs from 'fs';
import puppeteer from 'puppeteer';
import path from 'path';

import { pressKey } from './utils/western/pressKey.js';
import { fillCardDetails } from './utils/western/fillCardDetails.js';
import { checkCookies } from './utils/western/checkCookies.js';
import { getRandomIdentity } from './utils/western/getRandomIdentity.js';

import { createPayment } from './utils/supabase/createPayment.js';
import { updateOrder } from './utils/supabase/updateOrder.js';

import { westernSession } from './westernSession.js';


async function westernProceed(browser, page, orderNumber, paymentNumber, amount, cardDetails) {

  let status = 'pending';
  const { address, city, postal, phone } = await getRandomIdentity();

  try {
    // Remplir infos carte : TEMPLATE
    await fillCardDetails(page, cardDetails);
    await page.screenshot({ path: `logs/wg-${paymentNumber}-5.png` });

    //

    // PAGE : "Complete Profile"

    //

    // Remplir les informations
    await pressKey(page, 'Tab', 4);
    await page.keyboard.type(phone, { delay: 200 });

    const randomDay = Math.floor(Math.random() * 30) + 1;
    const randomMonth = Math.floor(Math.random() * 3) + 1;
    const randomYear = Math.floor(Math.random() * 50) + 1950;

    await pressKey(page, 'Tab', 1);
    await page.keyboard.type(randomDay);
    await new Promise(resolve => setTimeout(resolve, 1000));

    await pressKey(page, 'Tab', 1);
    await pressKey(page, 'J', randomMonth);
    await new Promise(resolve => setTimeout(resolve, 1000));

    await pressKey(page, 'Tab', 1);
    await page.keyboard.type(randomYear);
    await new Promise(resolve => setTimeout(resolve, 1000));

    await pressKey(page, 'Tab', 1);
    await page.keyboard.type(address, { delay: 200 });
    await new Promise(resolve => setTimeout(resolve, 1000));

    await pressKey(page, 'Tab', 1);
    await page.keyboard.type(city, { delay: 200 });
    await new Promise(resolve => setTimeout(resolve, 1000));

    await pressKey(page, 'Tab', 1);
    await page.keyboard.type(postal, { delay: 200 });
    await new Promise(resolve => setTimeout(resolve, 1000));

    await pressKey(page, 'Tab', 1);
    await page.type('France', { delay: 200 });
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.keyboard.press('Enter');
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.screenshot({ path: `logs/wg-${paymentNumber}-6.png` });

    await pressKey(page, 'Tab', 1);
    await page.keyboard.press('Space');
    await new Promise(resolve => setTimeout(resolve, 1000));

    await pressKey(page, 'Tab', 5);
    await page.keyboard.press('Enter');

    // Chargement confirmation
    console.log('Card Verification...');
    await new Promise(resolve => setTimeout(resolve, 18000));

    //

    // PAGE : "Transfer Review"

    // 

    // Si l'url de la page contient '/web/payment' alors carte refusée
    if (page.url().includes('/web/payment')) {
      console.log('Card refused!');

      status = 'refused';
      await page.screenshot({ path: `logs/w-${paymentNumber}-refused.png` });
    }
    else {
      console.log('Card accepted!');
      await page.screenshot({ path: `logs/w-${paymentNumber}-7.png` });

      // Confirmer le paiement
      await page.click('p.custom-checkbox-section.ng-scope > label');
      await new Promise(resolve => setTimeout(resolve, 3000));
      await page.click('button#Submit');

      // Début 3D-Secures
      console.log('Begin 3D-Secure...');
      await new Promise(resolve => setTimeout(resolve, 60000));
      await page.screenshot({ path: `logs/w-${paymentNumber}-7.png` });
      await new Promise(resolve => setTimeout(resolve, 30000));
    
      // 

      // Fin du Flow
      status = 'processed';
      await page.screenshot({ path: `logs/w-${paymentNumber}-processed.png` });
    }
  }
  catch (error) {
    console.error('Error in westernInit:', error);
  }
  finally {
    // Sauvegarder commande + paiement
    await updateOrder(orderNumber, cardDetails, status);
    await createPayment(orderNumber, paymentNumber, status, amount, cardDetails);
    
    await browser.close();

    // Retourner le statut de la transaction
    console.log(`Transaction completed. Status: ${status}`);
    console.log('----- End Western Topup -----');
    return status;
  }
}


export default function westernProceedHandler(westernBrowser, westernPage) {

  return async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Vérifier si les navigateurs sont initialisés
    if (!westernBrowser || !westernPage) {
      return res.status(500).json({ error: 'checkout not ready' });
    }
    
    // Vérifier les paramètres requis de la requête
    const { orderNumber, paymentNumber, amount, cardDetails } = req.body;
    if (!orderNumber || !paymentNumber || !amount || !cardDetails) {
      return res.status(400).json({ error: 'Missing required parameters: amount and cardDetails' });
    }
    
    console.log('----- Western Proceed -----');
    console.log('Order Number:', orderNumber);
    console.log('Payment Number:', paymentNumber);
    console.log('Amount:', amount);
    console.log('Card Details:', cardDetails);
    console.log('-----');
    
    try {
      // vous pouvez utiliser westernBrowser et westernPage ici si nécessaire.
      const result = await westernProceed(westernBrowser, westernPage, orderNumber, paymentNumber, amount, cardDetails);
      return res.status(200).json({ message: 'Western proceeded.', result });
    } catch (error) {
      console.error('Error in Western handler:', error);
      return res.status(500).json({ error: error.message });
    }
  }
}