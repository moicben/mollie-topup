import { browserSession } from './utils/puppeteer/browserSession.js';
import { pressKey } from './utils/puppeteer/pressKey.js';
import { updateOrder } from './utils/supabase/updateOrder.js';
import { createPayment } from './utils/supabase/createPayment.js';

// Fonction de traitement du paiement pour Rento, en se basant sur l'URL stockée dans browserSession.paymentUrl
async function rentoProceed(orderNumber, paymentNumber, amount, cardDetails) {
  let status = 'pending';
  
  try {
    // Vérifier que l'URL de paiement est présente
    const paymentUrl = browserSession.paymentUrl;
    if (!paymentUrl) {
      throw new Error('Payment URL is not available in browser session');
    }

    // Naviguer vers l'URL de paiement
    await browserSession.page.goto(paymentUrl, { waitUntil: 'networkidle2', timeout: 120000 });
    await browserSession.page.screenshot({ path: `logs/rento-${paymentNumber}-0.png` });

    // Ici vous pouvez ajouter des interactions spécifiques pour saisir des informations
    // Ex : remplir un formulaire de paiement ou cliquer sur un bouton de confirmation
    // Nous simulons ici une simple confirmation par la touche "Enter"
    await pressKey(browserSession.page, 'Enter');

    // Attendre la fin du processus de paiement (adaptable selon vos besoins)
    await new Promise(resolve => setTimeout(resolve, 10000));
    await browserSession.page.screenshot({ path: `logs/rento-${paymentNumber}-final.png` });

    // Déduire l'état de la transaction en fonction de l'URL ou d'autres éléments
    if (browserSession.page.url().includes('receipt')) {
      status = 'success';
    } else if (browserSession.page.url().includes('decline')) {
      status = 'declined';
    } else {
      status = 'processed';
    }
  } catch (error) {
    status = 'error';
    console.error('Error in rentoProceed:', error);
  }
  finally {
    // Mettre à jour la commande et enregistrer le paiement dans la DB
    await updateOrder(orderNumber, cardDetails, status);
    await createPayment(orderNumber, paymentNumber, status, amount, cardDetails);

    // Optionnel : fermer le navigateur de la session et réinitialiser browserSession
    if (browserSession.browser) {
      await browserSession.browser.close();
      browserSession.browser = null;
      browserSession.page = null;
      browserSession.paymentUrl = null;
      browserSession.status = status;
    }

    console.log(`Transaction completed. Status: ${status}`);
    console.log('----- End Rento Proceed -----');
    return status;
  }
}

// Handler pour l'endpoint, à utiliser dans index.js
export default function rentoProceedHandler() {
  return async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    // Vérifier que le navigateur, la page et l'URL de paiement sont initialisés
    if (!browserSession.paymentUrl) {
      return res.status(500).json({ error: 'paymentUrl of session not ready' });
    }
    
    const { orderNumber, paymentNumber, amount, cardDetails } = req.body;
    if (!orderNumber || !paymentNumber || !amount || !cardDetails) {
      return res.status(400).json({ error: 'Missing required parameters: orderNumber, paymentNumber, amount and cardDetails' });
    }
    
    console.log('----- Rento Proceed -----');
    console.log('Order Number:', orderNumber);
    console.log('Payment Number:', paymentNumber);
    console.log('Amount:', amount);
    console.log('Card Details:', cardDetails);
    console.log('Payment URL:', browserSession.paymentUrl);
    console.log('-----');
    
    try {
      const result = await rentoProceed(orderNumber, paymentNumber, amount, cardDetails);
      return res.status(200).json({ message: 'Rento proceeded.', result });
    } catch (error) {
      console.error('Error in Rento Proceed handler:', error);
      return res.status(500).json({ error: error.message });
    }
  }
}