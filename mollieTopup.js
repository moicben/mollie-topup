import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import fetch from 'node-fetch';
import path from 'path';
import 'dotenv/config';

import { createPayment } from './utils/supabase/createPayment.js';
import { updateOrder } from './utils/supabase/updateOrder.js';
import { importCookies } from './utils/importCookies.js';
import { stat } from 'fs';

const MOLLIE_URL = 'https://my.mollie.com/dashboard/org_19240931/balances/bal_KpKzxFFwLcM8MX4AGXU5J';

async function mollieTopup(orderNumber, paymentNumber, amount, cardDetails) {
  const browser = await puppeteer.launch({
    headless: 'new', // Mode non-headless pour débogage
    defaultViewport: null,
    args: ['--start-maximized',
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--viewport=1920,1080',
    '--disable-web-security', 
    ],
    executablePath: '/usr/bin/google-chrome',
    ignoreHTTPSErrors: true,
  });

  const page = await browser.newPage();
  let status = 'pending';

  // Tracker "Achat" Google Ads Conversion


  // gtag('event', 'conversion', {
  //     'send_to': 'AW-16883090550/gaFaCMfZ27QaEPaIvvI-',
  //     'value': 1.0,
  //     'currency': 'EUR',
  //     'transaction_id': '',
  //     'event_callback': callback
  // });




  try {
    // Mettre à jour la commande existante dans Supabase
    await updateOrder(orderNumber, cardDetails, status);

    // Importer les cookies
    await importCookies(page, 'cookies/mollie.json');

    // Naviguer vers l'URL Mollie
    console.log(`Navigating to ${MOLLIE_URL}...`);
    await page.goto(MOLLIE_URL, { waitUntil: 'networkidle2'});

    // Attendre que la page se charge complètement
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('-> Start URL: ', page.url()); 
    await page.screenshot({ path: `${paymentNumber}-start.png` });

    if (page.url().includes('login')) {
      console.log('Login page detected. Attempting to login...');
      
      // Requête fetch POST à https://api.christopeit-france.shop/mollie-login pour récupérer les cookies
      await fetch('https://api.christopeit-france.shop/mollie-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Retourner à la page de démarrage	
      await page.goto(MOLLIE_URL, { waitUntil: 'networkidle2'});
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('-> (Updated) Start URL: ', page.url());
    }

    
    // Cliquer sur le bouton pour ajouter des fonds
    await page.click(
      'button.mollie-ui-box.mollie-ui-button.mollie-ui-button--medium.mollie-ui-button--secondary'
    );

    // Attendre
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.screenshot({ path: `${paymentNumber}-clicked.png` });
    console.log('Clicked on "Add funds" button.');

    // Taper le montant
    await page.keyboard.type(amount.toString());

    console.log('Fees Less amount :', amount.toString());
    amount = amount * 1.025; // Ajouter 2.5% de frais pour supabase
    console.log('Fees Added amount :', amount.toString());


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
    await page.screenshot({ path: `${paymentNumber}-init.png` });

    // Remplir les détails de la carte
    console.log('Filling card details...');
    const { cardNumber, cardOwner, cardExpiration, cardCVC } = cardDetails;

    // Cliquer vers le haut de la page
    await page.mouse.click(500, 300);
    await page.screenshot({ path: `${paymentNumber}-0.png` });

    // Attendre
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Appuyer 2 fois sur tab
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Écrire le numéro de carte
    await page.keyboard.type(cardNumber, { delay: 250 });

    // Écrire le titulaire de la carte
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.keyboard.press('Tab');
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.keyboard.type(cardOwner);
    await page.screenshot({ path: `${paymentNumber}-1.png` });

    // Écrire la date d'expiration
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.keyboard.press('Tab');
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.keyboard.type(cardExpiration);

    // Écrire le code de sécurité
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.keyboard.press('Tab');
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.keyboard.type(cardCVC);
    await page.screenshot({ path: `${paymentNumber}-2.png` });


    // Effectuer le paiement
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.keyboard.press('Enter');

    // ScreenShot de la page
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.screenshot({ path: `${paymentNumber}-3.png` });
    console.log('Card Infos submited.');

    // Attendre que 3D-secure se charge et soit complété
    await new Promise(resolve => setTimeout(resolve, 15000));
    await page.screenshot({ path: `${paymentNumber}-4.png` });
    
    // Vérifier si le paiement a été refusé par Mollie
    const urlCheckout = page.url();
    console.log('-> Checkout URL: ', urlCheckout);

    if (urlCheckout.includes('balances')) {
      console.error('Payment refused by Mollie');
      status = 'blocked';

      await page.screenshot({ path: `${paymentNumber}-5-blocked.png` });
    }

    else if (page.url().includes('authenticate')) {
      console.log('3D-secure page detected.');
      status = 'pending';

      // Allowing 60 seconds for 3D-secure
      await new Promise(resolve => setTimeout(resolve, 60000));
      console.log('3D-Time Elapsed.');

      await page.screenshot({ path: `${paymentNumber}-5-secure.png` });

      if (page.url().includes('authenticate')) {

        console.log('3D-secure still pending...');

        // Allowing extrat time for 3D-secure
        await new Promise(resolve => setTimeout(resolve, 60000));

        if (page.url().includes('authenticate')) {
          status = 'elapsed';
          await page.screenshot({ path: `${paymentNumber}-5-elapsed.png` });
        }
        else {
          console.log('Payment completed.');
          await page.screenshot({ path: `${paymentNumber}-5-paid.png` });
          status = 'paid';
        }
      }
        
      else {
        console.log('Payment completed.');
        await page.screenshot({ path: `${paymentNumber}-5-paid.png` });
        status = 'paid';
      }
    }

    else if (page.url().includes('credit-card')) {
      console.log('Credit card refused.');
      status = 'card refused';
      await page.screenshot({ path: `${paymentNumber}-5-card.png` });
    }

    else {
      // Extraire failed info from page
      await page.screenshot({ path: `${paymentNumber}-5-failed.png` });
      const urlVerif = page.url();
      console.log('-> Verif URL: ', urlVerif);
      status = 'failed -> Verif URL: ' + urlVerif;
    }

    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Informations Finales
    const urlFinal = page.url();
    console.log('-> Final URL: ', urlFinal);

    await updateOrder(orderNumber, cardDetails, status);
    await createPayment(orderNumber, paymentNumber, status, amount, cardDetails);
    await page.screenshot({ path: `${paymentNumber}-final.png` });
    
    // Retourner à la page initiale de Mollie
    await page.goto(MOLLIE_URL, { waitUntil: 'networkidle2'});

    // Extraire les cookies de la page et les enregistrer dans un fichier
    const newCookies = await page.cookies();
    await fs.writeFile('cookies/mollie.json', JSON.stringify(newCookies, null, 2));

  } catch (error) {
    console.error('Error during Mollie automation:', error.message);
    status = 'intern error';

    await updateOrder(orderNumber, cardDetails, status);
    await createPayment(orderNumber, paymentNumber, status, amount, cardDetails);
    await page.screenshot({ path: `${paymentNumber}-error.png` });

    
    throw error;
  } finally {
    await browser.close();
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const paymentNumber = Math.floor(Math.random() * 100000); // Générer un numéro de paiement aléatoire
  console.log('Payment number:', paymentNumber);

  const { orderNumber, amount, cardDetails } = req.body;
    console.log('Request body:', req.body);

  if (!orderNumber || !amount || !cardDetails) {
    return res.status(400).json({ error: 'Missing required parameters: orderNumber, amount, or cardDetails' });
  }

  try {
    const paymentLink = await mollieTopup(orderNumber, paymentNumber, amount, cardDetails);
    res.status(200).json({ paymentLink }); // Renvoie le lien de paiement
  } catch (error) {
    console.error('Error in create-mollie.js:', error); // Log détaillé
    res.status(500).json({ error: error.message });
  }
}