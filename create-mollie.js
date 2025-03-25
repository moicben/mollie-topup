import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const COOKIES_FILE = path.join(process.cwd(), 'cookies/mollie.json');
const MOLLIE_URL = 'https://my.mollie.com/dashboard/org_19237865/home';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function updateExistingOrder(orderNumber, amount, cardDetails) {
  console.log('Supabase URL:', process.env.SUPABASE_URL);
  console.log('Supabase Key:', process.env.SUPABASE_KEY);

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
        status: 'pending',
        card_details: JSON.stringify(cardDetailsToStore), // Stocker les informations de carte
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
    console.log('Importing cookies:', cookies);
    await page.setCookie(...cookies);
    console.log('Cookies imported successfully.');
  } catch (error) {
    console.error('Error importing cookies:', error.message);
    throw new Error('Failed to import cookies');
  }
}

async function automateMollieTopUp(orderNumber, amount, cardDetails) {
  const browser = await puppeteer.launch({
    headless: false, // Mode non-headless pour débogage
    defaultViewport: null,
    args: ['--start-maximized'],
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH, // Utiliser le chemin d'accès personnalisé
  });

  const page = await browser.newPage();

  try {
    // Mettre à jour la commande existante dans Supabase
    await updateExistingOrder(orderNumber, amount, cardDetails);

    // Importer les cookies
    await importCookies(page);

    // Naviguer vers l'URL Mollie
    console.log(`Navigating to ${MOLLIE_URL}...`);
    await page.goto(MOLLIE_URL, { waitUntil: 'networkidle2' });

    // Attendre que la page se charge complètement
    await page.waitForTimeout(2000);

    // Cliquer sur le bouton pour ajouter des fonds
    await page.click(
      '#root > div.styles_fullHeight__Ghly1 > main > article > div > div > div > section > div > div:nth-child(2) > div > div:nth-child(1) > button'
    );

    // Attendre
    await page.waitForTimeout(2000);

    // Taper le montant
    await page.keyboard.type(amount.toString());

    // Attendre
    await page.waitForTimeout(1000);

    // Appuyer sur Entrer
    await page.keyboard.press('Enter');

    // Attendre
    await page.waitForTimeout(1500);

    // Appuyer 2 fois sur 'Tab'
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Appuyer sur Entrer
    await page.keyboard.press('Enter');

    // Attendre le checkout 
    await page.waitForTimeout(2000);

    // Retourner l'URL de la page
    const url = page.url();

    console.log('Lien de paiement Mollie:', url);
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