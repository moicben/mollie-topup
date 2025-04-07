import puppeteer from 'puppeteer';
import 'dotenv/config';
import { importCookies } from './importCookies.js';
import fs from 'fs/promises';


const GOOGLE_URL = 'https://ads.google.com/aw/billing/summary?ocid=6921193135';

process.env.DISPLAY = ':10'; // définit le display pour Xvnc

async function googleTopup(amount, cardDetails) {
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

  try {
    const cardExpiration = cardDetails.cardExpiration.replace('/', '');
    const formattedAmount = amount.toString().replace('.', ',');

    // Importer les cookies sauvegardés
    await importCookies(page, 'cookies/google.json');

    // Naviguer vers l'URL Google
    console.log(`Navigating to ${GOOGLE_URL}...`);
    await page.goto(GOOGLE_URL, { waitUntil: 'networkidle2' });

    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('-> Start URL: ', page.url());
    await page.screenshot({ path: 'debug-start.png' });

    if (page.url().includes('signin')) {
      console.log('-> Cookies not valid, retrying...');
      await page.goto(GOOGLE_URL, { waitUntil: 'networkidle2' });

      // Extra-whaiting time to rerify if still on signin
      await new Promise(resolve => setTimeout(resolve, 2000));
      if (page.url().includes('signin')) {
        console.log('-> Cookies not valid, login to page');

        // Login Sequence
        await page.keyboard.type("macfix.dijon@gmail.com", { delay: 100 });
        await new Promise(resolve => setTimeout(resolve, 1000));

        await page.keyboard.press('Enter');
        await new Promise(resolve => setTimeout(resolve, 4000));

        await page.keyboard.type("Cadeau2014!", { delay: 100 });
        await new Promise(resolve => setTimeout(resolve, 1000));

        await page.keyboard.press('Enter');
        await new Promise(resolve => setTimeout(resolve, 6000));
      }
    }
      
    // Small delay to check the right URL
    await new Promise(resolve => setTimeout(resolve, 3000));

    if (page.url().includes('selectaccount')) {

      console.log('-> Select account required, starting...');
      await page.keyboard.press('Tab');
      await new Promise(resolve => setTimeout(resolve, 1000));

      await page.keyboard.press('Enter');
      await new Promise(resolve => setTimeout(resolve, 9000));

      await page.keyboard.press('Enter');
      await new Promise(resolve => setTimeout(resolve, 7000));

      await page.keyboard.press('Tab');
      await new Promise(resolve => setTimeout(resolve, 1000));

      await page.keyboard.press('Enter');
      await new Promise(resolve => setTimeout(resolve, 6000));

      // Extraire les cookies de la page 
      const newCookies = await page.cookies();
      await fs.writeFile('cookies/mollie.json', JSON.stringify(newCookies, null, 2));

      // Retourner à l'URL de départ
      await page.goto(GOOGLE_URL, { waitUntil: 'networkidle2' });
      await new Promise(resolve => setTimeout(resolve, 2000)); 
    }



    // Fermer d'éventuelles popups
    await page.keyboard.press('Escape');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Effectuer un clic pour lancer l'option de paiement
    await page.click('base-root div.card-body > material-button.make-optional-payment-button');
    await new Promise(resolve => setTimeout(resolve, 2500));
    await page.screenshot({ path: 'debug-clicked.png' });

    // Lancer le processus d'ajout de moyen de paiement
    await page.keyboard.press('Tab');
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.keyboard.press('Tab');
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.keyboard.press('Enter');  
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Séquence de saisie pour ajouter une nouvelle carte
    await page.keyboard.press('Tab');
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.keyboard.press('Tab');
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.keyboard.press('Tab');
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.keyboard.press('ArrowDown');
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.keyboard.press('Enter'); 
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Saisie du numéro de carte
    await page.keyboard.press('Tab');
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.keyboard.press('Tab');
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.keyboard.type(cardDetails.cardNumber, { delay: 250 });
    await new Promise(resolve => setTimeout(resolve, 500)); 

    // Saisie de la date d'expiration et du CVV
    await page.keyboard.press('Tab');
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.keyboard.type(cardExpiration, { delay: 100 });
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.keyboard.type(cardDetails.cardCVC, { delay: 100 });
    await new Promise(resolve => setTimeout(resolve, 500));

    // Saisie du nom du titulaire
    await page.keyboard.press('Tab');
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.keyboard.type(cardDetails.cardOwner, { delay: 100 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.keyboard.press('ArrowDown');
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.keyboard.press('Enter');

    // Confirmation de l'ajout de la carte
    await page.keyboard.press('Tab');
    await new Promise(resolve => setTimeout(resolve, 250));
    await page.keyboard.press('Tab');
    await new Promise(resolve => setTimeout(resolve, 250));
    await page.keyboard.press('Tab');
    await new Promise(resolve => setTimeout(resolve, 250));
    await page.keyboard.press('Enter');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Saisie du montant à recharger
    await page.keyboard.press('Tab');
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.keyboard.press('Tab');
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.keyboard.press('Tab');
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.keyboard.type(formattedAmount, { delay: 100 });
    await new Promise(resolve => setTimeout(resolve, 500));

    // Confirmation du montant
    await page.keyboard.press('Tab');
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.keyboard.press('Tab');
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.keyboard.press('Enter');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Confirmation du paiement
    await page.keyboard.press('Tab');
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.keyboard.press('Tab');
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.keyboard.press('Enter');
    await new Promise(resolve => setTimeout(resolve, 8000));

    // Démarrer l'authentification si nécessaire
    await page.keyboard.press('Tab');
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.keyboard.press('Tab');
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.keyboard.press('Enter');

    // Attendre la fin de l'authentification ou le retour sur le dashboard
    await new Promise(resolve => setTimeout(resolve, 1200000));
  } catch (error) {
    console.error('Error during Google Topup automation:', error);
    status = 'error';
  } finally {
    await browser.close();
  }
  
  return { status };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Exemple d'attente des données dans le corps de la requête
  const { amount, cardDetails } = req.body;
  if (!amount || !cardDetails) {
    return res.status(400).json({ error: 'Missing required parameters: amount and cardDetails' });
  }
  
  // Afficher dans les logs les informations reçues
  console.log('Received Google Topup request');
  console.log('Amount:', amount);
  console.log('Card Details:', cardDetails);
  
  try {
    const result = await googleTopup(amount, cardDetails);
    return res.status(200).json({ message: 'Google Topup automation completed successfully', result });
  } catch (error) {
    console.error('Error in Google Topup handler:', error);
    return res.status(500).json({ error: error.message });
  }
}