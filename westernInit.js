import puppeteer from 'puppeteer';
import 'dotenv/config';

import { checkCookies } from './utils/western/checkCookies.js';
import { getRandomIdentity }  from './utils/western/getRandomIdentity.js';
import { getEmailOtp } from './utils/western/getEmailOtp.js';
import { pressKey } from './utils/western/pressKey.js';

import { westernSession } from './westernSession.js';

const START_URL = 'https://www.westernunion.com/fr/fr/web/user/register';


async function westernInit(orderNumber, paymentNumber, amount, cardDetails) {

  // Récupérer une identité aléatoire
  const { firstName, lastName} = await getRandomIdentity();

  // Obtenir l'email de l'identité 
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@tenvil.com`;


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

    console.log(`Navigating to ${START_URL}...`);
    await page.goto(START_URL, { waitUntil: 'networkidle2', timeout: 120000 });

    // Vérifier la popup cookies
    await checkCookies(page)
    await page.screenshot({ path: `logs/wr-${paymentNumber}-0.png` });

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

    await page.screenshot({ path: `logs/wr-${paymentNumber}-1.png` });
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
    const otp = await getEmailOtp(email);

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
    await page.screenshot({ path: `logs/w-${paymentNumber}-2.png` });

    // Scroller vers le base de 100 pixels
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
    await page.screenshot({ path: `logs/w-${paymentNumber}-3.png` });

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
    await page.screenshot({ path: `logs/w-${paymentNumber}-4.png` });

    // Envoyer le formulaire
    await pressKey(page, 'Tab', 1);
    await page.keyboard.press('Enter');

    // Attendre jusqu'au changement d'URL
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 2000));

    //

    return { browser, page };

  } catch (error) {
    console.error('Error during registration:', error);
    throw error;
  }

}

// const paymentNumber = 'test';
// const orderNumber = 'test'
// const amount = 100;
// const cardDetails = {
//     "cardNumber": "5355 8426 3233 7924",
//     "cardOwner": "John Doe",
//     "cardExpiration": "02/30",
//     "cardCVC": "656"
//   }

// Lancer la fonction westernInit
//await westernInit(orderNumber, paymentNumber, amount, cardDetails);
//console.log(await getEmailOtp("acfd.mascrwtin@tenvil.com"))




export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Vérifier les paramètres requis de la requête
  const { orderNumber, paymentNumber, amount, cardDetails } = req.body;
  if (!orderNumber || !paymentNumber || !amount || !cardDetails) {
    return res.status(400).json({ error: 'Missing required parameters: amount and cardDetails' });
  }
  
  // Afficher dans les logs les informations reçues
  console.log('----- Western Init -----');
  console.log('Order Number:', orderNumber);
  console.log('Payment Number:', paymentNumber);
  console.log('Amount:', amount);
  console.log('Card Details:', cardDetails);
  console.log('-----');
  
  try {
    const { browser, page } = await westernInit(orderNumber, paymentNumber, amount, cardDetails);
    
    // Mettez à jour l'état partagé pour que /western-proceed puisse l'utiliser
    westernSession.browser = browser;
    westernSession.page = page;
    
    res.status(200).json({ message: 'Western initialized successfully', status: 'initialized' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
