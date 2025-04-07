import puppeteer from 'puppeteer';


import 'dotenv/config';

import { importCookies } from './importCookies.js';

const GOOGLE_URL = 'https://ads.google.com/aw/billing/summary?ocid=7003787746&ascid=7003787746&billingId=7642911070&authuser=9&uscid=7003787746&__c=3730326354&euid=1363895905&__u=8808648345&cmpnInfo=%7B%228%22%3A%2215306d55-cd20-46b8-8e10-51c745e20d57%22%7D';

// const BROWSERLESS_TOKEN = process.env.BROWSERLESS_TOKEN;
process.env.DISPLAY = ':10'; // définit le display pour Xvnc

async function automateGoogleTopup( amount, cardDetails) {
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
    
    // Importer les cookies
    await importCookies(page, 'cookies/google.json');

    // Naviguer vers l'URL Google
    console.log(`Navigating to ${GOOGLE_URL}...`);
    await page.goto(GOOGLE_URL, { waitUntil: 'networkidle2'});
    await page.screenshot({ path: `debug-start.png` });

      // // GMAIL DEBUG :

      // // Attendre que la page se charge complètement
      // await new Promise(resolve => setTimeout(resolve, 2000));

      // await page.keyboard.type("theophile.coussiere.pro@gmail.com", { delay: 100 });
      // await new Promise(resolve => setTimeout(resolve, 1000));

      // await page.keyboard.press('Enter');
      // await new Promise(resolve => setTimeout(resolve, 2000));

      // await page.screenshot({ path: `debug-gmail.png` });



    // Press Escape to close any popups
    await page.keyboard.press('Escape');

    // Attendre
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Effectuer un paiement optionnel
    await page.click('base-root div.card-body > material-button.make-optional-payment-button');

    // Attendre
    await new Promise(resolve => setTimeout(resolve, 2500));
    await page.screenshot({ path: `debug-clicked.png` });

    // Ajouter un moyen de paiement 
    await page.keyboard.press('Tab');
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.keyboard.press('Tab');
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.keyboard.press('Enter');  
    

    // Attendre
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Press 3x tab et 1x flèche, et 1x entrer pour ajouter la nouvelle carte
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

    // Taper le numéro de carte
    await page.keyboard.press('Tab');
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.keyboard.press('Tab');
    await new Promise(resolve => setTimeout(resolve, 500));

    await page.keyboard.type(cardDetails.cardNumber, { delay: 250 });
    await new Promise(resolve => setTimeout(resolve, 500)); 

    // Taper la date d'expiration
    await page.keyboard.press('Tab');
    await new Promise(resolve => setTimeout(resolve, 500));

    await page.keyboard.type(cardExpiration, { delay: 100 });
    await new Promise(resolve => setTimeout(resolve, 500));

    // Taper le CVV
    await page.keyboard.type(cardDetails.cardCVC, { delay: 100 });
    await new Promise(resolve => setTimeout(resolve, 500));

    // Taper / choisir le nom du titulaire de la carte
    await page.keyboard.press('Tab');
    await new Promise(resolve => setTimeout(resolve, 500));

    await page.keyboard.type("theo", { delay: 100 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await page.keyboard.press('ArrowDown');
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.keyboard.press('Enter');

    // Confirmer l'ajout de la carte
    await page.keyboard.press('Tab');
    await new Promise(resolve => setTimeout(resolve, 250));
    await page.keyboard.press('Tab');
    await new Promise(resolve => setTimeout(resolve, 250));
    await page.keyboard.press('Tab');
    await new Promise(resolve => setTimeout(resolve, 250));
    await page.keyboard.press('Tab');
    await new Promise(resolve => setTimeout(resolve, 250));
    await page.keyboard.press('Tab');
    await new Promise(resolve => setTimeout(resolve, 250));
    await page.keyboard.press('Tab');
    await new Promise(resolve => setTimeout(resolve, 250));
    await page.keyboard.press('Enter');
    await new Promise(resolve => setTimeout(resolve, 5000));


    // Entrer le montant à recharger
    await page.keyboard.press('Tab');
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.keyboard.press('Tab');
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.keyboard.press('Tab');
    await new Promise(resolve => setTimeout(resolve, 500));

    await page.keyboard.type(formattedAmount, { delay: 100 });
    await new Promise(resolve => setTimeout(resolve, 500));

    // Confirmer le montant
    await page.keyboard.press('Tab');
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.keyboard.press('Tab');
    await new Promise(resolve => setTimeout(resolve, 500));

    await page.keyboard.press('Enter');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Confirmer le paiement
    await page.keyboard.press('Tab');
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.keyboard.press('Tab');
    await new Promise(resolve => setTimeout(resolve, 500));

    await page.keyboard.press('Enter');
    await new Promise(resolve => setTimeout(resolve, 8000));

    // Confirmer le début de l'authentification
    await page.keyboard.press('Tab');
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.keyboard.press('Tab');
    await new Promise(resolve => setTimeout(resolve, 500));

    await page.keyboard.press('Enter');
    


    await new Promise(resolve => setTimeout(resolve, 1200000));
  }
  
  catch (error) {
    console.error('Error during automation:', error);
  } finally {
    await browser.close();
  }
}

const cardDetails = {
  cardNumber: '5355 8520 9247 9488',
  cardOwner: 'John Doe',
  cardExpiration: '02/30',
  cardCVC: '379',
};
const amount = 100; // Amount to top up

export default automateGoogleTopup(amount, cardDetails); 


    
