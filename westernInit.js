import puppeteer from 'puppeteer';
import 'dotenv/config';

import { checkCookies } from './utils/western/checkCookies.js';
import { getRandomIdentity }  from './utils/western/getRandomIdentity.js';
import { getEmailOtp } from './utils/western/getEmailOtp.js';
import { pressKey } from './utils/western/pressKey.js';

import { westernSession } from './westernSession.js';

const START_URL = 'https://www.westernunion.com/fr/fr/web/user/register';


async function westernInit(orderNumber, amount) {

  // Récupérer une identité aléatoire
  const { firstName, lastName} = await getRandomIdentity();

  // Obtenir l'email de l'identité 
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@tenvil.com`;

  //console.log('Identity:', { firstName, lastName });
  //console.log('Email:', email);

  const browser = await puppeteer.launch({
    headless: false, // Mode non-headless pour voir le processus
    defaultViewport: null,
    args: [
      '--start-maximized',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled', 
      '--disable-infobars',
      '--disable-features=IsolateOrigins,site-per-process', 
      '--disable-notifications', 
      '--disable-geolocation',
    ],
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,  
  });
  
  const page = await browser.newPage();

  try {

    // PAGE "Login"

    //console.log(`Navigating to ${START_URL}...`);
    await page.goto(START_URL, { waitUntil: 'networkidle2', timeout: 120000 });

    // Vérifier la popup cookies
    await checkCookies(page)
    await page.screenshot({ path: `logs/wr-${orderNumber}-0.png` });

    // Remplissage informations d'inscription
    await pressKey(page, 'Tab', 2);
    await page.keyboard.type(firstName, { delay: 200 });
    await new Promise(resolve => setTimeout(resolve, 500));

    await pressKey(page, 'Tab', 2);
    await page.keyboard.type(lastName, { delay: 200 });
    await new Promise(resolve => setTimeout(resolve, 500));

    await pressKey(page, 'Tab', 1);
    await page.keyboard.type(email, { delay: 200 });
    await new Promise(resolve => setTimeout(resolve, 500));

    await pressKey(page, 'Tab', 1);
    await page.keyboard.type('Qwerty12345!', { delay: 200 });
    await new Promise(resolve => setTimeout(resolve, 500));

    // Envoyer le formulaire d'inscription
    await pressKey(page, 'Tab', 5);
    await pressKey(page, 'Space', 1);

    await page.screenshot({ path: `logs/wr-${orderNumber}-1.png` });
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.keyboard.press('Enter');

    await new Promise(resolve => setTimeout(resolve, 9000));
    

    //

    // PAGE : "Vérification OTP"

    // 

    // Choisir vérification par email
    await pressKey(page, 'Tab', 4);
    await page.keyboard.press('Enter');

    await new Promise(resolve => setTimeout(resolve, 5000));

    // Demander le code OTP
    await page.click('button#button-request-code');
    await new Promise(resolve => setTimeout(resolve, 8000));

    // Recevoir le code OTP par email
    let otp;
    for (let attempt = 1; attempt <= 3; attempt++) {
      otp = await getEmailOtp(email);
      if (otp) {
        break; // Si le code OTP est récupéré, sortir de la boucle
      }
      console.log(`Pas de code OTP : Tentative ${attempt}...`);
      await new Promise(resolve => setTimeout(resolve, 8000)); // Attendre 8 secondes avant une nouvelle tentative
    }

    if (!otp) {
      throw new Error('Pas de code OTP après 3 tentatives.');
    }

    // Soumettre le code OTP
    await page.keyboard.type(otp, { delay: 500 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.keyboard.press('Enter');

    // Attendre juqsu'au changement d'URL
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 4000));

    //

    // PAGE : "Initiate Transfer"

    //

    // Choisir le pays du destinataire
    await pressKey(page, 'Tab', 1);
    await page.keyboard.type('France', { delay: 200 });
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Remplir le montant de la transaction
    await page.keyboard.type(amount.toString(), { delay: 200 });
    await new Promise(resolve => setTimeout(resolve, 5000));

     // Réception sur compte bancaire
    await page.click('div#fundsOut_BA');
    await new Promise(resolve => setTimeout(resolve, 4000));

    // Paiement par carte bancaire
    await page.click('div#fundsIn_CreditCard');
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.screenshot({ path: `logs/wr-${orderNumber}-2.png` });

    // Scroller vers le bas de 100 pixels
    await page.evaluate(() => window.scrollBy(0, 100));
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Continuer
    await page.click('button#button-smo-continue');
    await new Promise(resolve => setTimeout(resolve, 4000));

    //

    // Valider la popup fraude
    const fraudWarning = await page.$('button#button-fraud-warning-accept');
    if (fraudWarning) {
      console.log('Fraud warning found!');
      await fraudWarning.click({ clickCount: 2 }); 
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      console.log('Fraud warning not found..');
    }
    await page.screenshot({ path: `logs/wr-${orderNumber}-3.png` });

    //

    // PAGE : "Beneficiary Details"

    // Scroller tout en haut 
    await page.evaluate(() => window.scrollBy(0, -600));
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Remplir les informations
    await page.click('input#txtFName');
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.keyboard.type('Benedikt', { delay: 200 });
    await new Promise(resolve => setTimeout(resolve, 1000));

    await pressKey(page, 'Tab', 2);
    await page.keyboard.type('Strokin', { delay: 200 });
    await new Promise(resolve => setTimeout(resolve, 1000));

    await pressKey(page, 'Tab', 1);
    await page.keyboard.type('bstrokin78@gmail.com', { delay: 200 });
    await new Promise(resolve => setTimeout(resolve, 1000));

    await pressKey(page, 'Tab', 3);
    await page.keyboard.type('FR802043302626N268795984483', { delay: 200 });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Motif du transfert
    await pressKey(page, 'Tab', 2);
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.keyboard.type('A', { delay: 200 });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Origine des fonds
    await pressKey(page, 'Tab', 1);
    await page.keyboard.type('E', { delay: 200 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.screenshot({ path: `logs/wr-${orderNumber}-4.png` });

    // Envoyer le formulaire
    await pressKey(page, 'Tab', 1);
    await page.keyboard.press('Enter');

    // Attendre jusqu'au changement d'URL
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 3000));

    //

    console.log('----- Init Completed ----- ');

    // Fermer le navigateur automatiquement après 5 minutes si aucun proceed n'est lancé
    const closeTimeout = setTimeout(() => {
      console.log('[X] Browser inactif 5 min -> browser.close()');
      browser.close();
    }, 5 * 60 * 1000);
    browser.closeTimeout = closeTimeout;

    return { browser, page };

  } catch (error) {
    console.error('Error during registration:', error);
    browser.close(); // Fermer le navigateur en cas d'erreur
    throw error;
    
  }

}

// const orderNumber = 'test'
// const amount = 100;

// Lancer la fonction westernInit
//await westernInit(orderNumber, amount);
//console.log(await getEmailOtp("acfd.mascrwtin@tenvil.com"))




export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Vérifier les paramètres requis de la requête
  const { orderNumber, amount } = req.body;
  if (!orderNumber || !amount ) {
    return res.status(400).json({ error: 'Missing required parameters: amount or orderNumber' });
  }
  
  // Afficher dans les logs les informations reçues
  console.log('----- Western Init -----');
  console.log('Order Number:', orderNumber);
  console.log('Amount:', amount);
  console.log('-----');
  
  try {
    const { browser, page } = await westernInit(orderNumber, amount);
    
    // Mettez à jour l'état partagé pour que /western-proceed puisse l'utiliser
    westernSession.browser = browser;
    westernSession.page = page;
    
    res.status(200).json({ message: 'Western initialized successfully', status: 'initialized' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
