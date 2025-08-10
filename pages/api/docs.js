/**
 * API de documentation du Cloud Gateway
 * Endpoint: GET /api/docs
 */

const { 
  corsMiddleware, 
  sessionMiddleware, 
  requestLoggerMiddleware 
} = require('../../lib/middleware');

const apiDocumentation = {
  openapi: '3.0.0',
  info: {
    title: 'Cloud Gateway API',
    version: '1.0.0',
    description: 'Service de paiement externe sécurisé et scalable',
    contact: {
      name: 'Support',
      email: 'support@example.com'
    }
  },
  servers: [
    {
      url: 'https://your-gateway.vercel.app',
      description: 'Production server'
    },
    {
      url: 'http://localhost:3001',
      description: 'Development server'
    }
  ],
  paths: {
    '/api/health': {
      get: {
        summary: 'Health Check',
        description: 'Vérifie la santé du service',
        tags: ['Monitoring'],
        responses: {
          '200': {
            description: 'Service en bonne santé',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'healthy' },
                    timestamp: { type: 'string', format: 'date-time' },
                    version: { type: 'string', example: '1.0.0' },
                    environment: { type: 'string', example: 'production' },
                    uptime: { type: 'number', example: 3600 }
                  }
                }
              }
            }
          },
          '503': {
            description: 'Service indisponible'
          }
        }
      }
    },
    '/api/payments/browserless-checkout': {
      post: {
        summary: 'Traiter un paiement',
        description: 'Traite un paiement via Browserless',
        tags: ['Payments'],
        security: [
          { ApiKeyAuth: [] },
          { BearerAuth: [] }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['cardNumber', 'cardExpiry', 'cardCVC', 'cardOwner', 'amount'],
                properties: {
                  cardNumber: {
                    type: 'string',
                    description: 'Numéro de carte (13-19 chiffres)',
                    example: '5355842551783074'
                  },
                  cardExpiry: {
                    type: 'string',
                    pattern: '^\\d{2}/\\d{2}$',
                    description: 'Date d\'expiration (MM/YY)',
                    example: '05/30'
                  },
                  cardCVC: {
                    type: 'string',
                    pattern: '^\\d{3,4}$',
                    description: 'Code de sécurité (3-4 chiffres)',
                    example: '219'
                  },
                  cardOwner: {
                    type: 'string',
                    minLength: 2,
                    description: 'Nom du propriétaire de la carte',
                    example: 'bene sss'
                  },
                  amount: {
                    type: 'string',
                    description: 'Montant à débiter',
                    example: '10'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Paiement traité avec succès',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    sessionId: { type: 'string', example: 'session_1704123456789_abc123' },
                    timestamp: { type: 'string', format: 'date-time' },
                    status: { type: 'string', example: 'completed' },
                    transactionId: { type: 'string', example: 'txn_1704123456789' },
                    paymentData: {
                      type: 'object',
                      properties: {
                        amount: { type: 'string', example: '10' },
                        lastFourDigits: { type: 'string', example: '3074' },
                        cardType: { type: 'string', example: 'mastercard' },
                        cardOwner: { type: 'string', example: 'bene sss' }
                      }
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Données invalides',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string', example: 'Validation failed' },
                    message: { type: 'string', example: 'Données de paiement invalides' },
                    errors: {
                      type: 'array',
                      items: { type: 'string' },
                      example: ['Numéro de carte invalide', 'CVC manquant']
                    }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Non autorisé',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string', example: 'Unauthorized' },
                    message: { type: 'string', example: 'Clé API ou token JWT requis' }
                  }
                }
              }
            }
          },
          '429': {
            description: 'Limite de taux dépassée',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string', example: 'Rate limit exceeded' },
                    message: { type: 'string', example: 'Trop de requêtes. Limite: 100 par 900 secondes' },
                    retryAfter: { type: 'number', example: 900 }
                  }
                }
              }
            }
          },
          '500': {
            description: 'Erreur serveur',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    error: { type: 'string', example: 'Internal server error' },
                    sessionId: { type: 'string', example: 'session_1704123456789_abc123' },
                    timestamp: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key'
      },
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  }
};

function generateHtmlDoc(apiDoc) {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Cloud Gateway API Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css" />
  <style>
    html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin:0; background: #fafafa; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: window.location.origin + '/api/docs?format=json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout"
      });
    };
  </script>
</body>
</html>
  `;
}

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({
      error: 'Method Not Allowed',
      message: 'Only GET requests are allowed'
    });
    return;
  }

  // Appliquer les middlewares
  corsMiddleware(req, res, () => {
    sessionMiddleware(req, res, () => {
      requestLoggerMiddleware(req, res, () => {
        
        const format = req.query.format;
        
        if (format === 'json') {
          res.setHeader('Content-Type', 'application/json');
          res.status(200).json(apiDocumentation);
        } else {
          res.setHeader('Content-Type', 'text/html');
          res.status(200).send(generateHtmlDoc(apiDocumentation));
        }
      });
    });
  });
} 