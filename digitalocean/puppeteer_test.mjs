import puppeteer from 'puppeteer';

(async () => {
  // Lance le navigateur
  const browser = await puppeteer.launch({
    headless: 'new', // Mettre false pour voir le rendu si tu as un accès GUI
    executablePath: '/snap/bin/chromium', // Spécifier le chemin du navigateur installé avec snap
    args: ['--no-sandbox', '--disable-setuid-sandbox'] // Nécessaire pour exécuter Puppeteer sur un serveur
  });;
  // Ouvre un nouvel onglet
  const page = await browser.newPage();
  // Va sur la page GoogleC
  await page.goto('https://www.google.com');
  // Prend une capture d'écran de la page
  await page.screenshot({ path: 'google_screenshot.png' });
  // Ferme le navigateur
  await browser.close();
})();