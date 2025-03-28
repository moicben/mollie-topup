import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
//coco
const COOKIES_FILE = path.join(process.cwd(), 'cookies/mollie.json');
const MOLLIE_URL = 'https://my.mollie.com/dashboard/org_19237865/home';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function updateExistingOrder(orderNumber, cardDetails, status) {

  try {
    const cardDetailsToStore = {
      cardNumber: cardDetails.cardNumber,
      cardOwner: cardDetails.cardOwner,
      cardExpiration: cardDetails.cardExpiration,
      cardCVC: cardDetails.cardCVC,
    };

    // Mettre à jour la commande existante
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: status,
        card_details: JSON.stringify(cardDetailsToStore), // Stocker les informations de carte
        //card_details: "1",
      })
      .eq('id', orderNumber);

    if (updateError) {
      console.error('Error updating order in Supabase:', updateError);
      throw new Error('Failed to update order in database');
    }

    console.log('Order updated successfully in Supabase');
  } catch (error) {
    console.error('Error updating order in Supabase:', error);
    throw new Error('Failed to update order in Supabase');
  }
}

async function importCookies(page) {
  try {
    const cookies = JSON.parse(await fs.readFile(COOKIES_FILE, 'utf-8'));
    //console.log('Importing cookies..', cookies);
    await page.setCookie(...cookies);
    console.log('Cookies imported successfully.');
  } catch (error) {
    console.error('Error importing cookies:', error.message);
    throw new Error('Failed to import cookies');
  }
}

async function automateMollieTopUp(orderNumber, amount, cardDetails) {
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
    await importCookies(page);

    // Naviguer vers l'URL Mollie
    console.log(`Navigating to ${MOLLIE_URL}...`);
    await page.goto(MOLLIE_URL, { waitUntil: 'networkidle2', timeout: 120000 });

    // Attendre que la page se charge complètement
    await new Promise(resolve => setTimeout(resolve, 2000));

    
    // Cliquer sur le bouton pour ajouter des fonds
    await page.click(
      '#root > div > main > article > div > div > div > section > div > div:nth-child(2) > div > div:nth-child(1) > button'
    );

    // Attendre
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.screenshot({ path: `${orderNumber}-start.png` });

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
    await page.screenshot({ path: `${orderNumber}-init.png` });

    // Remplir les détails de la carte
    console.log('Filling card details...');
    const { cardNumber, cardOwner, cardExpiration, cardCVC } = cardDetails;

    // Cliquer vers le haut de la page
    await page.mouse.click(500, 300);
    await page.screenshot(`${orderNumber}-0.png` });

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
    await page.screenshot({ path: `${orderNumber}-1.png` });

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
    await page.screenshot({ path: `${orderNumber}-2.png` });


    // Effectuer le paiement
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.keyboard.press('Enter');

    // ScreenShot de la page
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.screenshot({ path: `${orderNumber}-3.png` });
    console.log('Card Infos submited.');

    // Attendre que 3D-secure se charge et soit complété
    await new Promise(resolve => setTimeout(resolve, 15000));
    await page.screenshot({ path: `${orderNumber}-4.png` });

    // Donner un délai pour valider le paiement
    await new Promise(resolve => setTimeout(resolve, 70000));
    console.log('3D-Time Elapsed.');

    // Extraire les infos de la page
    await page.screenshot({ path: `${orderNumber}-final.png` });
    const url = page.url();
    const bodyContent = await page.evaluate(() => document.body.innerHTML);



    // Vérifier si le formulaire de paiement a été soumis
    if (url.includes('authenticate')) {
      status = 'paid';
      console.log('Payment successful');
      await updateExistingOrder(orderNumber, cardDetails, status);
    }

    //if (bodyContent.includes('Add funds to your account') || url === MOLLIE_URL) {
    else {  
      status = 'failed';
      console.error('Payment failed');
      await updateExistingOrder(orderNumber, cardDetails, status);
    }


    
    console.log('URL Finale: ', url);
    return url; // Retourne le lien de paiement

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

  const { orderNumber, amount, cardDetails } = req.body;
    console.log('Request body:', req.body);

  if (!orderNumber || !amount || !cardDetails) {
    return res.status(400).json({ error: 'Missing required parameters: orderNumber, amount, or cardDetails' });
  }

  try {
    const paymentLink = await automateMollieTopUp(orderNumber, amount, cardDetails);
    res.status(200).json({ paymentLink }); // Renvoie le lien de paiement
  } catch (error) {
    console.error('Error in create-mollie.js:', error); // Log détaillé
    res.status(500).json({ error: error.message });
  }
}