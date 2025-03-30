import puppeteer from 'puppeteer';

const MOLLIE_LOGIN_URL = 'https://my.mollie.com/dashboard/login?lang=en';

async function loginToMollie() {
  const browser = await puppeteer.launch({
    headless: `new`, // Mode non-headless pour voir le processus
    defaultViewport: null,
    args: ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  try {
    // Naviguer vers la page de connexion Mollie
    console.log(`Navigating to ${MOLLIE_LOGIN_URL}...`);
    await page.goto(MOLLIE_LOGIN_URL, { waitUntil: 'networkidle2' });

    // Attendre que le champ email soit visible
    await page.waitForSelector('input[type="email"]', { visible: true });

    // Taper l'email
    console.log('Typing email...');
    await page.type('input[type="email"]', 'benedikt.strokin@gmail.com', { delay: 100 });

    // Attendre 1 seconde
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Appuyer sur Tab pour passer au champ mot de passe
    await page.keyboard.press('Tab');

    // Attendre 1 seconde
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Taper le mot de passe
    console.log('Typing password...');
    await page.type('input[type="password"]', 'D&veloppe2018!', { delay: 100 });

    // Attendre 1 seconde
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Appuyer sur Tab pour passer au bouton "Se souvenir de moi"
    await page.keyboard.press('Tab');

    // Attendre 1 seconde
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Appuyer sur Espace pour cocher la case "Se souvenir de moi"
    console.log('Checking "Remember me"...');
    await page.keyboard.press('Space');

    // Attendre 1 seconde
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Appuyer sur Entrée pour soumettre le formulaire
    console.log('Submitting login form...');
    await page.keyboard.press('Enter');

    // Attendre que la page de tableau de bord se charge
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log('Login successful!');

    // Attendre 1 seconde
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Prendre une capture d'écran après la connexion
    await page.screenshot({ path: 'mollie-dashboard.png' });
    

  } catch (error) {
    console.error('Error during Mollie login:', error.message);
  } finally {
    await browser.close();
  }
}

loginToMollie();