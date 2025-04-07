import puppeteer from 'puppeteer';


import 'dotenv/config';

import { importCookies } from './importCookies.js';

const GOOGLE_URL = 'https://ads.google.com/aw/billing/summary?ocid=7003787746&ascid=7003787746&billingId=7642911070&authuser=9&uscid=7003787746&__c=3730326354&euid=1363895905&__u=8808648345&cmpnInfo=%7B%228%22%3A%2215306d55-cd20-46b8-8e10-51c745e20d57%22%7D';

// const BROWSERLESS_TOKEN = process.env.BROWSERLESS_TOKEN;
process.env.DISPLAY = ':10'; // définit le display pour Xvnc

async function googleDebug( amount, cardDetails) {
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

  try {
    console.log(`Navigating to ${GOOGLE_URL}...`);
    await page.goto(GOOGLE_URL, { waitUntil: 'networkidle2'});

    // Attendre longtemps
    await new Promise(resolve => setTimeout(resolve, 500000));
  }
  
    catch (error) {
      console.error('Error during navigation:', error);
    } finally {
      await browser.close();
    }
}

export default googleDebug;
