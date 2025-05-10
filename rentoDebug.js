import { launchBrowser } from './utils/puppeteer/launchBrowser.js';

const MANGOPAY_URL = 'https://pay.mangopay.com/?id=wt_b80b1bf6-5e04-4341-a400-c8c57a6b7d2a&client-token=hpp_0196b8f21c9471a595863879d66e960c';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { browser, page } = await launchBrowser();
    
    // D'abord, naviguer vers une page de test pour injecter Axios
    await page.goto('https://example.com', { waitUntil: 'networkidle2', timeout: 60000 });
    
    // Injection d'Axios dans la page via addScriptTag
    await page.addScriptTag({ url: 'https://unpkg.com/axios@0.21.0/dist/axios.min.js' });
    
    // Utilisation d'Axios dans le contexte de la page
    const axiosData = await page.evaluate(async () => {
      const response = await axios.get('https://httpbin.org/get');
      return response.data; // Seules les données importantes sont retournées
    });
    console.log('Axios data:', axiosData);
    
    // Maintenant, naviguer vers l'URL Mangopay
    console.log('Navigating to Mangopay URL...');
    await page.goto(MANGOPAY_URL, { waitUntil: 'networkidle2', timeout: 120000 });
    console.log('Mangopay Page loaded:', page.url());
    
    // Pause pour observer le rendu (10 secondes)
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Capture d'écran pour vérification visuelle
    await page.screenshot({ path: 'mangopay_debug.png' });
    
    // Fermeture du navigateur
    await browser.close();

    res.status(200).json({ message: 'Mangopay debug completed', url: page.url(), axiosData });
  } catch (error) {
    console.error('Error testing Mangopay URL:', error);
    res.status(500).json({ error: error.message });
  }
}