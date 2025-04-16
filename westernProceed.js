
import fs from 'fs';
import puppeteer from 'puppeteer';
import path from 'path';

import { pressKey } from './utils/western/pressKey.js';
import { fillCardDetails } from './utils/western/fillCardDetails.js';
import { checkCookies } from './utils/western/checkCookies.js';



async function westernProceed(browser, page, orderNumber, paymentNumber, amount, cardDetails) {

  try {
    // Remplir infos carte : TEMPLATE
    await fillCardDetails(page, cardTemplate);
    await page.screenshot({ path: `logs/wg-${paymentNumber}-4.png` });

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
    await page.screenshot({ path: `logs/wg-${paymentNumber}-5.png` });

    await pressKey(page, 'Tab', 1);
    await page.keyboard.press('Space');
    await new Promise(resolve => setTimeout(resolve, 1000));

    await pressKey(page, 'Tab', 5);
    await page.keyboard.press('Enter');


    // Attendre jusqu'au changement d'URL
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });

    //

    // PAGE : "Transfer Confirmation"

    // 

    // Finir le processus d'intiation de transfert
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.screenshot({ path: `logs/wg-${paymentNumber}-6.png` });
  }
  catch (error) {
    console.error('Error in westernInit:', error);
  }
  finally {
    return { browser, page };
  }
}


export default function westernProceedHandler(westernBrowser, westernPage) {
  return async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
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
      return res.status(200).json({ message: 'Western completed successfully.', result });
    } catch (error) {
      console.error('Error in Western handler:', error);
      return res.status(500).json({ error: error.message });
    }
  }
}