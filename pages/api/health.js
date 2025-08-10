/**
 * API de santé du Cloud Gateway
 * Endpoint: GET /api/health
 */

const config = require('../../config/environment');
const logger = require('../../lib/logger');
const cache = require('../../lib/cache');
const { 
  corsMiddleware, 
  sessionMiddleware, 
  requestLoggerMiddleware,
  errorMiddleware 
} = require('../../lib/middleware');

async function handler(req, res) {
  const sessionId = req.headers['x-session-id'] || 'unknown';
  
  try {
    // Vérifications de santé
    const healthChecks = await performHealthChecks();
    
    const healthData = {
      status: healthChecks.overall ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: config.NODE_ENV,
      uptime: process.uptime(),
      checks: healthChecks,
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memory: process.memoryUsage(),
        pid: process.pid
      }
    };

    // Déterminer le code de statut HTTP
    const statusCode = healthChecks.overall ? 200 : 503;

    logger.info(`Health check completed - Status: ${healthData.status}`, {
      sessionId,
      status: healthData.status,
      uptime: healthData.uptime,
      memoryUsage: healthData.system.memory.heapUsed
    });

    res.status(statusCode).json(healthData);

  } catch (error) {
    logger.error('Erreur lors du health check', {
      sessionId,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      message: error.message
    });
  }
}

/**
 * Effectue les vérifications de santé
 */
async function performHealthChecks() {
  const checks = {};

  // Vérification de la configuration
  checks.config = {
    status: 'healthy',
    details: {
      hasApiKey: !!config.API_SECRET_KEY,
      hasJwtSecret: !!config.JWT_SECRET,
      hasBrowserlessKey: !!config.BROWSERLESS_API_KEY,
      corsEnabled: config.ENABLE_CORS,
      rateLimitEnabled: config.API_RATE_LIMIT
    }
  };

  // Vérification du cache
  try {
    const cacheStats = cache.getStats();
    checks.cache = {
      status: cacheStats.errors < 10 ? 'healthy' : 'unhealthy',
      details: {
        keys: cacheStats.keys,
        hitRate: cacheStats.hitRate,
        errors: cacheStats.errors
      }
    };
  } catch (error) {
    checks.cache = {
      status: 'unhealthy',
      error: error.message
    };
  }

  // Vérification de la mémoire
  const memoryUsage = process.memoryUsage();
  const memoryLimitMB = 512; // Limite Vercel
  const memoryUsageMB = memoryUsage.heapUsed / 1024 / 1024;
  
  checks.memory = {
    status: memoryUsageMB < memoryLimitMB * 0.8 ? 'healthy' : 'warning',
    details: {
      heapUsed: Math.round(memoryUsageMB),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024),
      limit: memoryLimitMB
    }
  };

  // Vérification de l'API Browserless (optionnel)
  if (config.BROWSERLESS_API_KEY) {
    try {
      const browserlessCheck = await checkBrowserlessAPI();
      checks.browserless = browserlessCheck;
    } catch (error) {
      checks.browserless = {
        status: 'unhealthy',
        error: error.message
      };
    }
  } else {
    checks.browserless = {
      status: 'skipped',
      reason: 'No API key configured'
    };
  }

  // Vérification des logs
  try {
    const logStats = logger.getStats();
    checks.logging = {
      status: 'healthy',
      details: logStats
    };
  } catch (error) {
    checks.logging = {
      status: 'unhealthy',
      error: error.message
    };
  }

  // Statut global
  const allChecks = Object.values(checks);
  const unhealthyChecks = allChecks.filter(check => check.status === 'unhealthy');
  
  checks.overall = unhealthyChecks.length === 0;

  return checks;
}

/**
 * Vérification de l'API Browserless
 */
async function checkBrowserlessAPI() {
  try {
    // Test simple pour vérifier si l'API répond
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(config.BROWSERLESS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.BROWSERLESS_API_KEY}`
      },
      body: JSON.stringify({
        code: 'console.log("health check")',
        context: {}
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    return {
      status: response.ok ? 'healthy' : 'unhealthy',
      details: {
        httpStatus: response.status,
        responseTime: 'within 5s'
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      details: {
        timeout: error.name === 'AbortError'
      }
    };
  }
}

/**
 * Middleware pour cette API
 */
function applyMiddleware(req, res, next) {
  corsMiddleware(req, res, () => {
    sessionMiddleware(req, res, () => {
      requestLoggerMiddleware(req, res, next);
    });
  });
}

export default function(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({
      error: 'Method Not Allowed',
      message: 'Only GET requests are allowed'
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