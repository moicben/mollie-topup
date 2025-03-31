import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

const MOLLIE_LOGIN_URL = 'https://my.mollie.com/dashboard/login?lang=en';
const SITE_KEY = '6LfX9K0jAAAAAIscWCtaqoe7OqSb98EYskj-eOXa';
const CAPSOLVER_KEY= 'CAP-043FC4EFDF3624A5DA0B9010AD0B2DBB'


async function loginToMollie() {
  const browser = await puppeteer.launch({
    headless: `new`, // Mode non-headless pour voir le processus
    defaultViewport: null,
    args: ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: '/usr/bin/google-chrome',
  });

  const page = await browser.newPage();

  try {

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

    const PAGE_URL = page.url(); // URL de la page actuelle
    
    async function createTask(payload) {
      try {
        const res = await axios.post('https://api.capsolver.com/createTask', {
          clientKey: CAPSOLVER_KEY,
          task: payload
        });
        return res.data;
      } catch (error) {
        console.error('Error creating task:', error);
      }
    }
    
    async function getTaskResult(taskId) {
      try {
        let success = false;
        while (!success) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Attendre 1 seconde
          console.log("Getting task result for task ID: " + taskId);
          const res = await axios.post('https://api.capsolver.com/getTaskResult', {
            clientKey: CAPSOLVER_KEY,
            taskId: taskId
          });
          if (res.data.status === "ready") {
            success = true;
            console.log('Captcha solved:', res.data);
            return res.data;
          }
        }
      } catch (error) {
        console.error('Error getting task result:', error);
        return null;
      }
    }
    
    async function solveReCaptcha(pageURL, sitekey) {
      const taskPayload = {
        type: "ReCaptchaV2TaskProxyless",
        websiteURL: pageURL,
        websiteKey: sitekey,
      };
      const taskData = await createTask(taskPayload);
      return await getTaskResult(taskData.taskId);
    }
    
    try {
      const response = await solveReCaptcha(PAGE_URL, SITE_KEY);
      const captchaToken = response.solution.gRecaptchaResponse;
      console.log(`Received captcha token: ${captchaToken}`);
    
      // Injecter le token dans le champ captcha et soumettre
      await page.evaluate((token) => {
        document.querySelector('textarea[name="g-recaptcha-response"]').value = token;
      }, captchaToken);
      console.log('Captcha token injected.');
    } catch (error) {
      console.error('Error solving captcha:', error);
    }

    console.log('Captcha solved!');

    // Attendre que la page de tableau de bord se charge
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log('Login successful!');

    // Prendre une capture d'écran après la connexion
    await page.screenshot({ path: 'mollie-dashboard.png' });

    // Exporter les cookies
    const cookies = await page.cookies();
    const cookiesPath = path.join(__dirname, 'cookies', 'mollie.json');
    fs.writeFileSync(cookiesPath, JSON.stringify(cookies, null, 2));
  } catch (error) {
    console.error('Error during Mollie login:', error.message);
  } finally {
    await browser.close();
  }
}

export default loginToMollie;

//loginToMollie()