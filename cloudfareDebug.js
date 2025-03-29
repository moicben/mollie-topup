import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import 'dotenv/config';

async function cloudfareDebug() {

  const browser = await puppeteer.launch({
    headless: false, // Mode non-headless pour débogage
    defaultViewport: null,
    args: ['--start-maximized',
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--viewport=1920,1080',
    '--disable-web-security', 
    ],
    ignoreHTTPSErrors: true,
  });

  const page = await browser.newPage();

  const url = 'https://cardinalcommerce.com';
  await page.goto(url, { waitUntil: 'networkidle2'});

  await page.screenshot({ path: `debug-start.png` });

  // Attendre pour voir
    await new Promise(resolve => setTimeout(resolve, 20000));

}


await cloudfareDebug();