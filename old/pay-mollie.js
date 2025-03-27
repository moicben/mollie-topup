import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';


async function importCookies(page) {
  try {

    console.log('Cookies imported successfully.');
  } catch (error) {
    console.error('Error importing cookies:', error.message);
    throw new Error('Failed to import cookies');
  }
}

async function automateMolliePayment(paymentLink, cardDetails) {
  const browser = await puppeteer.launch({
    headless: false, // Mode non-headless pour débogage
    defaultViewport: null,
    args: ['--start-maximized'],
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH, // Utiliser le chemin d'accès personnalisé
  });

  const page = await browser.newPage();

  try {
    // Naviguer vers le lien de paiement
    console.log(`Navigating to payment link: ${paymentLink}...`);
    console.log('Navigating to payment link...');
    await page.goto(paymentLink, { waitUntil: 'networkidle2' });

    // Remplir les détails de la carte
    console.log('Filling card details...');
    const { cardNumber, cardOwner, cardExpiration, cardCVC } = cardDetails;

    // Cliquer vers le haut de la page
    await page.mouse.click(500, 300);

    // Attendre
    await page.waitForTimeout(1500);

    // Appuyer 2 fois sur tab
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Écrire le numéro de carte
    await page.keyboard.type(cardNumber);

    // Écrire le titulaire de la carte
    await page.waitForTimeout(1000);
    await page.keyboard.press('Tab');
    await page.waitForTimeout(1000);
    await page.keyboard.type(cardOwner);

    // Écrire la date d'expiration
    await page.waitForTimeout(1000);
    await page.keyboard.press('Tab');
    await page.waitForTimeout(1000);
    await page.keyboard.type(cardExpiration);

    // Écrire le code de sécurité
    await page.waitForTimeout(1000);
    await page.keyboard.press('Tab');
    await page.waitForTimeout(1000);
    await page.keyboard.type(cardCVC);

    // Effectuer le paiement
    await page.waitForTimeout(2000);
    await page.keyboard.press('Enter');

    // Attendre que 3D-secure se charge et soit complété
    await page.waitForTimeout(95000);

    console.log('Top-up completed successfully.');
  } catch (error) {
    console.error('Error during Mollie payment:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { paymentLink, cardDetails } = req.body;

  console.log('Received paymentLink:', paymentLink);
  console.log('Received cardDetails:', cardDetails);

  if (!paymentLink || !cardDetails) {
    return res.status(400).json({ error: 'Missing required parameters: paymentLink or cardDetails' });
  }

  try {
    await automateMolliePayment(paymentLink, cardDetails);
    res.status(200).json({ message: 'Payment completed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}