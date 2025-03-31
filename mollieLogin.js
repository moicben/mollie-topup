import puppeteer from 'puppeteer-extra';
import fs from 'fs';
import path from 'path';
import { SolverPlugin } from 'puppeteer-extra-plugin-capsolver';

const MOLLIE_LOGIN_URL = 'https://my.mollie.com/dashboard/login?lang=en';

// Configure le plugin capsolver avec votre clé API
const solverPlugin = new SolverPlugin({
  apiKey: 'CAP-043FC4EFDF3624A5DA0B9010AD0B2DBB', // Assurez-vous que votre clé API est définie dans les variables d'environnement
  useExtension: false, // Utilise l'extension pour résoudre les captchas
});
puppeteer.use(solverPlugin);

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


    // Extraire le code html de div.g-captcha
    const captchaElement = await page.$('.g-captcha');
    if (captchaElement) {
      const captchaHtml = await page.evaluate(element => element.innerHTML, captchaElement);
      console.log('Captcha HTML:', captchaHtml);
    } else {
      console.log('Captcha not found on the page.');
    }

    // Résoudre le captcha
    // console.log('Solving captcha...');

    // console.log('Captcha solved!');

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