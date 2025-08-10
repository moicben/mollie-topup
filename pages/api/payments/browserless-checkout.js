/**
 * API de paiement Browserless du Cloud Gateway
 * Endpoint: POST /api/payments/browserless-checkout
 */

const config = require('../../../config/environment');
const logger = require('../../../lib/logger');
const cache = require('../../../lib/cache');
const { 
  corsMiddleware, 
  rateLimitMiddleware,
  authMiddleware,
  sessionMiddleware, 
  requestLoggerMiddleware,
  validatePaymentData,
  errorMiddleware 
} = require('../../../lib/middleware');

async function handler(req, res) {
  const sessionId = req.headers['x-session-id'] || 'unknown';
  const startTime = Date.now();
  
  try {
    logger.startPayment(sessionId, req.paymentData);

    // Vérifier le cache d'abord
    const cachedResult = await cache.get(req.paymentData);
    if (cachedResult) {
      logger.cacheHit(sessionId, cachedResult);
      return res.status(200).json(cachedResult);
    }

    logger.cacheMiss(sessionId);

    // Traiter le paiement avec retry
    const result = await processPaymentWithRetry(req.paymentData, sessionId);
    
    // Mettre en cache si succès
    if (result.success) {
      await cache.set(req.paymentData, result, config.CACHE_TTL);
    }

    const duration = Date.now() - startTime;
    logger.paymentSuccess(sessionId, { ...result, duration });

    res.status(200).json(result);

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.paymentError(sessionId, { ...error, duration });

    res.status(500).json({
      success: false,
      error: error.message,
      sessionId: sessionId,
      duration: duration,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Traite le paiement avec retry intelligent
 */
async function processPaymentWithRetry(paymentData, sessionId) {
  let lastError;
  let attempt = 0;
  const maxRetries = config.MAX_RETRIES;
  
  while (attempt < maxRetries) {
    try {
      logger.info(`Tentative ${attempt + 1}/${maxRetries}`, { sessionId });
      
      const result = await callBrowserlessAPI(paymentData, sessionId);
      
      logger.info(`Tentative ${attempt + 1} réussie`, { 
        sessionId, 
        status: result.status 
      });
      
      return result;
      
    } catch (error) {
      lastError = error;
      attempt++;
      
      logger.warn(`Tentative ${attempt} échouée`, { 
        sessionId, 
        error: error.message,
        attempt: attempt,
        maxRetries: maxRetries
      });
      
      // Pause avant retry (backoff exponentiel)
      if (attempt < maxRetries) {
        const delay = calculateRetryDelay(attempt);
        logger.info(`Pause avant retry: ${delay}ms`, { sessionId });
        await sleep(delay);
      }
    }
  }
  
  throw lastError;
}

/**
 * Appel vers l'API Browserless
 */
async function callBrowserlessAPI(paymentData, sessionId) {
  const controller = new AbortController();
  const timeout = config.API_TIMEOUT;
  
  const timeoutId = setTimeout(() => {
    logger.warn('Timeout de l\'API Browserless', { sessionId, timeout });
    controller.abort();
  }, timeout);

  try {
    logger.info('Appel vers l\'API Browserless', { 
      sessionId, 
      url: config.BROWSERLESS_API_URL,
      timeout: timeout
    });

    const response = await fetch(config.BROWSERLESS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.BROWSERLESS_API_KEY}`
      },
      body: JSON.stringify({
        code: generateBrowserlessCode(paymentData),
        context: {
          paymentData: {
            cardNumber: paymentData.cardNumber,
            cardExpiry: paymentData.cardExpiry,
            cardCVC: paymentData.cardCVC,
            cardOwner: paymentData.cardOwner,
            amount: paymentData.amount
          }
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    logger.apiResponse(sessionId, {
      status: response.status,
      statusText: response.statusText,
      hasData: response.ok
    });

    // Lire la réponse une seule fois
    const responseText = await response.text();
    
    if (!response.ok) {
      // Tenter de parser la réponse d'erreur
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { 
          message: `HTTP ${response.status}: ${response.statusText}`,
          error: responseText.substring(0, 200) 
        };
      }

      // Vérifier s'il y a des données utilisables malgré l'erreur
      if (errorData.data && errorData.data.finalStatus) {
        logger.warn('Erreur HTTP mais données utilisables trouvées', {
          sessionId,
          status: response.status,
          finalStatus: errorData.data.finalStatus.value
        });
        
        return formatPaymentResult(errorData, paymentData, sessionId);
      }

      throw new Error(`API Browserless Error: ${errorData.message || response.statusText}`);
    }

    const responseData = JSON.parse(responseText);
    return formatPaymentResult(responseData, paymentData, sessionId);

  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error(`Timeout après ${timeout}ms`);
    }
    
    throw error;
  }
}

/**
 * Génère le code JavaScript pour Browserless
 */
function generateBrowserlessCode(paymentData) {
  return `
    // Code de paiement pour Browserless
    const paymentData = context.paymentData;
    
    try {
      // Simuler le processus de paiement
      console.log('Début du processus de paiement');
      console.log('Données reçues:', {
        cardType: paymentData.cardNumber.startsWith('4') ? 'visa' : 'mastercard',
        amount: paymentData.amount,
        owner: paymentData.cardOwner
      });
      
      // Simuler une pause de traitement
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Générer un résultat de paiement
      const result = {
        finalStatus: {
          value: 'completed'
        },
        transactionId: 'txn_' + Date.now(),
        amount: paymentData.amount,
        currency: 'EUR',
        processedAt: new Date().toISOString(),
        screenshots: []
      };
      
      console.log('Paiement traité avec succès:', result);
      
      return {
        success: true,
        data: result
      };
      
    } catch (error) {
      console.error('Erreur lors du paiement:', error);
      
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  `;
}

/**
 * Formate le résultat du paiement
 */
function formatPaymentResult(apiResponse, paymentData, sessionId) {
  const result = {
    success: true,
    sessionId: sessionId,
    timestamp: new Date().toISOString(),
    paymentData: {
      amount: paymentData.amount,
      lastFourDigits: paymentData.cardNumber.slice(-4),
      cardType: detectCardType(paymentData.cardNumber),
      cardOwner: paymentData.cardOwner
    }
  };

  // Extraire les données de l'API
  if (apiResponse.data) {
    result.apiResponse = apiResponse.data;
    
    // Extraire le status final
    if (apiResponse.data.finalStatus) {
      result.status = apiResponse.data.finalStatus.value;
    }
    
    // Extraire l'ID de transaction
    if (apiResponse.data.transactionId) {
      result.transactionId = apiResponse.data.transactionId;
    }
    
    // Extraire les screenshots
    if (apiResponse.data.screenshots) {
      result.screenshots = apiResponse.data.screenshots;
    }
  }

  return result;
}

/**
 * Détecte le type de carte
 */
function detectCardType(cardNumber) {
  if (!cardNumber) return 'unknown';
  const cleanNumber = cardNumber.replace(/\s/g, '');
  
  if (cleanNumber.startsWith('4')) return 'visa';
  if (cleanNumber.startsWith('5')) return 'mastercard';
  if (cleanNumber.startsWith('3')) return 'amex';
  
  return 'unknown';
}

/**
 * Calcule le délai de retry avec backoff exponentiel
 */
function calculateRetryDelay(attempt) {
  const baseDelay = config.RETRY_DELAY;
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  const jitter = Math.random() * 1000; // Ajouter du jitter
  
  return Math.min(exponentialDelay + jitter, 10000); // Max 10 secondes
}

/**
 * Utilitaire de pause
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Application des middlewares
 */
function applyMiddleware(req, res, next) {
  corsMiddleware(req, res, () => {
    sessionMiddleware(req, res, () => {
      requestLoggerMiddleware(req, res, () => {
        rateLimitMiddleware(req, res, () => {
          authMiddleware(req, res, () => {
            validatePaymentData(req, res, next);
          });
        });
      });
    });
  });
}

export default function(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({
      error: 'Method Not Allowed',
      message: 'Only POST requests are allowed'
    });
    return;
  }

  applyMiddleware(req, res, async () => {
    try {
      await handler(req, res);
    } catch (error) {
      errorMiddleware(error, req, res, () => {});
    }
  });
} 