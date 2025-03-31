import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

import { importCookies } from './importCookies.js';

const MOLLIE_LOGIN_URL = 'https://my.mollie.com/dashboard/login?lang=en';
const SITE_KEY = '6LfX9K0jAAAAAIscWCtaqoe7OqSb98EYskj-eOXa';
const CAPSOLVER_KEY= process.env.CAPSOLVER_KEY; 

async function loginToMollie() {
  const browser = await puppeteer.launch({
    headless: `new`, // Mode non-headless pour voir le processus
    defaultViewport: null,
    args: [
      '--start-maximized',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled', // Désactiver les détections d'automatisation
      '--disable-infobars', // Supprimer la barre d'information

    ],
    executablePath: '/usr/bin/google-chrome',
  });

  // Ajouter des modifications pour masquer l'automatisation
 const page = await browser.newPage();



  

  try {

    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] });
      window.chrome = { runtime: {} };
    });


    // Importer les cookies
    importCookies(page, 'cookies/mollie.json');

    // Fake un vrai navigateur
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setJavaScriptEnabled(true);
    await page.setGeolocation({ latitude: 48.8566, longitude: 2.3522 }); // Paris, France


    // Naviguer vers la page de connexion Mollie
    console.log(`Navigating to ${MOLLIE_LOGIN_URL}...`);
    await page.goto(MOLLIE_LOGIN_URL, { waitUntil: 'networkidle2' });

    // Attendre
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.screenshot({ path: 'mollie-start.png' });

    // Taper l'email
    console.log('Typing email...');
    await page.keyboard.type('benedikt.strokin@gmail.com', { delay: 100 });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Appuyer sur Tab pour passer au champ mot de passe
    await page.keyboard.press('Tab');
    await new Promise(resolve => setTimeout(resolve, 1000));
    

    // Taper le mot de passe
    console.log('Typing password...');
    await page.keyboard.type('D&veloppe2018!', { delay: 100 });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Demander de sauvegarder la session
    await page.keyboard.press('Tab');
    await new Promise(resolve => setTimeout(resolve, 1500));
    await page.keyboard.press('Space'); 
    await new Promise(resolve => setTimeout(resolve, 1500));


    // Appuyer sur Entrée pour soumettre le formulaire
    console.log('Submitting login form...');
    await page.keyboard.press('Enter');

    // Attendre
    await new Promise(resolve => setTimeout(resolve, 6000));
    await page.screenshot({ path: 'mollie-pending.png' });

    // Résoudre le captcha
    console.log('Solving captcha...');

    // const PAGE_URL = page.url(); // URL de la page actuelle
    // async function createTask(payload) {
    //   try {
    //     const res = await axios.post('https://api.capsolver.com/createTask', {
    //       clientKey: CAPSOLVER_KEY,
    //       task: payload
    //     });
    //     return res.data;
    //   } catch (error) {
    //     console.error('Error creating task:', error);
    //   }
    // }
    
    // async function getTaskResult(taskId) {
    //   try {
    //     let success = false;
    //     while (!success) {
    //       await new Promise(resolve => setTimeout(resolve, 1000)); // Attendre 1 seconde
    //       console.log("Getting task result for task ID: " + taskId);
    //       const res = await axios.post('https://api.capsolver.com/getTaskResult', {
    //         clientKey: CAPSOLVER_KEY,
    //         taskId: taskId
    //       });
    //       if (res.data.status === "ready") {
    //         success = true;
    //         console.log('Captcha solved:', res.data);
    //         return res.data;
    //       }
    //     }
    //   } catch (error) {
    //     console.error('Error getting task result:', error);
    //     return null;
    //   }
    // }
    
    // async function solveReCaptcha(pageURL, sitekey) {
    //   const taskPayload = {
    //     type: "ReCaptchaV2TaskProxyless",
    //     websiteURL: pageURL,
    //     websiteKey: sitekey,
    //   };
    //   const taskData = await createTask(taskPayload);
    //   return await getTaskResult(taskData.taskId);
    // }
    
    // try {
    //   const response = await solveReCaptcha(PAGE_URL, SITE_KEY);
    //   const captchaToken = response.solution.gRecaptchaResponse;
    //   console.log(`Received captcha token: ${captchaToken}`);
    
    //   // Injecter le token dans le champ captcha
    //   await page.evaluate((token) => {
    //     const captchaField = document.querySelector('textarea[name="g-recaptcha-response"]');
    //     if (captchaField) {
    //       captchaField.value = token;
    //     } else {
    //       throw new Error('Captcha field not found on the page.');
    //     }
    //   }, captchaToken);
    //   console.log('Captcha token injected.');
    
    //   // Soumettre le formulaire après l'injection du token
    //   await page.evaluate(() => {
    //     const form = document.querySelector('form'); // Assurez-vous que le sélecteur correspond au formulaire
    //     if (form) {
    //       form.submit();
    //     } else {
    //       throw new Error('Login form not found on the page.');
    //     }
    //   });
    //   console.log('Login form submitted.');
    // } catch (error) {
    //   console.error('Error solving captcha or submitting form:', error);
    // }
    
    // Attendre que la page se charge après la soumission
    console.log(`Current URL: ${page.url()}`);
    
    // Vérifiez si la connexion a réussi ou si vous êtes toujours sur la page de challenge
    if (page.url().includes('challengePage=true')) {
      console.error('Captcha challenge not passed.');

      // Attendre quelques secondes pour que la page se charge
      //await new Promise(resolve => setTimeout(resolve, 4000));
      // aller vers la page : https://my.mollie.com/dashboard/login?lang=en&challengePage=false
      //await page.goto(`${MOLLIE_LOGIN_URL}&challengePage=false`, { waitUntil: 'networkidle2' });

      //await page.screenshot({ path: 'mollie-redirect.png' });

    } else {
      console.log('Login successful!');
    }

    console.log('Captcha time finished.');

    // Attendre 4 secondes pour que la page se charge
    await new Promise(resolve => setTimeout(resolve, 4000));

    // Prendre une capture d'écran après la connexion
    await page.screenshot({ path: 'mollie-dashboard.png' });

    // Console log l'URL
    console.log(`Current URL: ${page.url()}`);

    // Extraire les cookies de la page et les enregistrer dans un fichier
    const newCookies = await page.cookies();
    await fs.writeFile('cookies/mollie.json', JSON.stringify(newCookies, null, 2));
    
  } catch (error) {
    console.error('Error during Mollie login:', error.message);
  } finally {
    await browser.close();
  }
}

export default loginToMollie;

//loginToMollie()