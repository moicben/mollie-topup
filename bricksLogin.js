import path from 'path';

import { pressKey } from './utils/puppeteer/pressKey.js';
import { launchBrowser } from './utils/puppeteer/launchBrowser.js';


const START_URL = 'https://app.bricks.co/';
const PASSWORD = 'Cadeau2014!';

// Récupérer l'email depuis les arguments de ligne de commande
const email = process.argv[2];

if (!email) {
  console.error('Veuillez fournir un email en argument: node bricksLogin.js email@example.com');
  process.exit(1);
}

async function bricksLogin() {

  // Lancer le navigateur Puppeteer optimisé
  const { browser, page } = await launchBrowser();

  try {

    console.log(`Navigating to ${START_URL}...`);
    console.log(`Email de connexion: ${email}`);

    await page.goto(START_URL, { waitUntil: 'networkidle2', timeout: 120000 });

    // Attendre que la page se charge complètement
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Vérifier si la page contient "login" au début
    const pageContent = await page.content();
    const isLoginPage = pageContent.toLowerCase().includes('login');

    if (!isLoginPage) {
      console.log('Page de login non détectée, navigation vers la page de connexion...');
      
      // Cliquer sur div#mantine-ankevjx4n-target
      try {
        await page.waitForSelector('div#mantine-ankevjx4n-target', { timeout: 10000 });
        await page.click('div#mantine-ankevjx4n-target');
        console.log('Cliqué sur div#mantine-ankevjx4n-target');
        
        // Attendre 1 seconde
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Cliquer sur ".rounded.cursor-pointer.css-1s09uj2"
        await page.waitForSelector('.rounded.cursor-pointer.css-1s09uj2', { timeout: 10000 });
        await page.click('.rounded.cursor-pointer.css-1s09uj2');
        console.log('Cliqué sur .rounded.cursor-pointer.css-1s09uj2');
        
        // Attendre 4 secondes
        await new Promise(resolve => setTimeout(resolve, 4000));
        
      } catch (navError) {
        console.error('Erreur lors de la navigation vers la page de login:', navError);
        throw navError;
      }
    } else {
      console.log('Page de login détectée');
    }

    // Maintenant, entrer les informations de connexion
    console.log('Saisie des informations de connexion...');
    
    // Attendre et remplir le champ email
    await page.waitForSelector('input[type="email"], input[name="email"], input[placeholder*="email" i]', { timeout: 15000 });
    const emailField = await page.$('input[type="email"], input[name="email"], input[placeholder*="email" i]');
    if (emailField) {
      await page.click('input[type="email"], input[name="email"], input[placeholder*="email" i]');
      await page.keyboard.type(email, { delay: 100 });
      console.log('Email saisi');
    }

    // Attendre et remplir le champ mot de passe
    await page.waitForSelector('input[type="password"], input[name="password"]', { timeout: 10000 });
    const passwordField = await page.$('input[type="password"], input[name="password"]');
    if (passwordField) {
      await page.click('input[type="password"], input[name="password"]');
      await page.keyboard.type(PASSWORD, { delay: 100 });
      console.log('Mot de passe saisi');
    }

    // Attendre 2 secondes
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Cliquer sur le bouton de connexion
    await page.click('button[type="submit"]');

    // Attendre la connexion et vérifier le succès
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    const currentUrl = page.url();
    console.log(`URL actuelle après connexion: ${currentUrl}`);

  } catch (error) {
    console.error('Error during login:', error);
  }
  finally {

    // Close the browser
    await browser.close(); 

  }
}


// // Lancer la fonction bricksFlow
await bricksLogin();



