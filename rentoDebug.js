import { launchBrowser } from './utils/puppeteer/launchBrowser.js';

const MANGOPAY_URL = 'https://pay.mangopay.com/?id=wt_b80b1bf6-5e04-4341-a400-c8c57a6b7d2a&client-token=hpp_0196b8f21c9471a595863879d66e960c';

(async () => {
  const { browser, page } = await launchBrowser();
  try {
    console.log('Navigating to Mangopay URL...');
    await page.goto(MANGOPAY_URL, { waitUntil: 'networkidle2', timeout: 120000 });
    console.log('Page loaded:', page.url());

    await new Promise(resolve => setTimeout(resolve, 10000));
    // Optionnel : prendre une capture d'écran pour vérifier visuellement le résultat
    await page.screenshot({ path: 'mangopay_debug.png' });
  } catch (error) {
    console.error('Error loading the Mangopay URL:', error);
  } finally {
    await browser.close();
  }
})();