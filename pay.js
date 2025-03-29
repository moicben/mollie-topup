import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import 'dotenv/config';

import { createNewPayment } from './createNewPayment.js';
import { updateExistingOrder } from './updateOrder.js';
import { importCookies } from './importCookies.js';
import { stat } from 'fs';

const MOLLIE_URL = 'https://my.mollie.com/dashboard/org_19237865/home';

async function automateMollieTopUp(orderNumber, paymentNumber, amount, cardDetails) {
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

  try {
    // Mettre à jour la commande existante dans Supabase
    await updateExistingOrder(orderNumber, cardDetails, status);

    // Importer les cookies
    await importCookies(page, 'cookies/mollie.json');

    // Naviguer vers l'URL Mollie
    console.log(`Navigating to ${MOLLIE_URL}...`);
    await page.goto(MOLLIE_URL, { waitUntil: 'networkidle2', timeout: 120000 });

    // Attendre que la page se charge complètement
    await new Promise(resolve => setTimeout(resolve, 2000));

    await page.screenshot({ path: `${paymentNumber}-start.png` });

    
    // Cliquer sur le bouton pour ajouter des fonds
    await page.click(
      '#root > div > main > article > div > div > div > section > div > div:nth-child(2) > div > div:nth-child(1) > button'
    );

    // Attendre
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.screenshot({ path: `${paymentNumber}-clicked.png` });

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
      console.error('Card blocked or refused by Mollie');
      status = 'blocked';

    }

    // Sinon : Continuer à attendre la validation du paiement 
    else {
      await new Promise(resolve => setTimeout(resolve, 60000));
      console.log('3D-Time Elapsed.');

      // Extraire les infos de la page
      await page.screenshot({ path: `${paymentNumber}-5.png` });
      const urlVerif = page.url();
      console.log('-> Verif URL: ', urlVerif);

      // Vérifier si le formulaire de paiement a été soumis
      if (urlVerif.includes('authenticate')) {
        
        // Donner un délai supplémentaire pour le 3D-secure
        console.log('Extra time for 3D-secure...');
        await new Promise(resolve => setTimeout(resolve, 60000));
        await page.screenshot({ path: `${paymentNumber}-6.png` }); 

        status = 'elapsed';
      }
      else{
        console.log('Payment failed');
        status = 'failed';
      }
      
    }

    
    // Informations Finales
    const urlFinal = page.url();
    console.log('-> Final URL: ', urlFinal);

    await updateExistingOrder(orderNumber, cardDetails, status);
    await createNewPayment(orderNumber, paymentNumber, status, cardDetails);
    await page.screenshot({ path: `${paymentNumber}-final.png` });
    
    // Retourner à la page initiale de Mollie
    await page.goto(MOLLIE_URL, { waitUntil: 'networkidle2'});

    // Extraire les cookies de la page et les enregistrer dans un fichier
    const newCookies = await page.cookies();
    await fs.writeFile('cookies/mollie.json', JSON.stringify(newCookies, null, 2));

  } catch (error) {
    console.error('Error during Mollie automation:', error.message);
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
    const paymentLink = await automateMollieTopUp(orderNumber, paymentNumber, amount, cardDetails);
    res.status(200).json({ paymentLink }); // Renvoie le lien de paiement
  } catch (error) {
    console.error('Error in create-mollie.js:', error); // Log détaillé
    res.status(500).json({ error: error.message });
  }
}