# Cloud Gateway 🌐

Service de paiement externe sécurisé et scalable déployé sur Vercel. Ce gateway gère les transactions de paiement pour votre application en utilisant l'API Browserless.

## 🚀 Fonctionnalités

- **API de paiement sécurisée** avec authentification par clé API ou JWT
- **Cache intelligent** pour optimiser les performances
- **Retry automatique** avec backoff exponentiel
- **Rate limiting** pour prévenir les abus
- **Logging complet** avec niveaux configurables
- **Monitoring de santé** avec métriques détaillées
- **Validation robuste** des données de paiement
- **Support CORS** pour les applications web

## 🏗️ Architecture

```
cloud-gateway/
├── config/
│   └── environment.js      # Configuration centralisée
├── lib/
│   ├── logger.js          # Système de logging
│   ├── cache.js           # Cache intelligent
│   └── middleware.js      # Middlewares de sécurité
├── pages/api/
│   ├── health.js          # API de santé
│   └── payments/
│       └── browserless-checkout.js  # API de paiement
├── package.json
├── next.config.js
├── vercel.json
└── README.md
```

## 🔧 Installation

1. **Cloner le projet**
```bash
git clone <repository-url>
cd cloud-gateway
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer les variables d'environnement**
Créer un fichier `.env.local` avec :
```env
NODE_ENV=development
API_SECRET_KEY=votre-cle-api-secrete
BROWSERLESS_API_KEY=votre-cle-browserless
JWT_SECRET=votre-secret-jwt
CORS_ORIGIN=http://localhost:3000
```

4. **Démarrer en développement**
```bash
npm run dev
```

## 🚀 Déploiement sur Vercel

1. **Installation de Vercel CLI**
```bash
npm i -g vercel
```

2. **Déploiement**
```bash
vercel --prod
```

3. **Configuration des variables d'environnement**
Dans le dashboard Vercel, ajouter :
- `API_SECRET_KEY`
- `BROWSERLESS_API_KEY`
- `JWT_SECRET`
- `CORS_ORIGIN`

## 📡 API Endpoints

### Health Check
```http
GET /api/health
```

Retourne le statut de santé du service avec métriques détaillées.

**Réponse exemple :**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0",
  "environment": "production",
  "uptime": 3600,
  "checks": {
    "config": { "status": "healthy" },
    "cache": { "status": "healthy", "details": {...} },
    "memory": { "status": "healthy", "details": {...} },
    "browserless": { "status": "healthy" }
  }
}
```

### Paiement
```http
POST /api/payments/browserless-checkout
Content-Type: application/json
X-API-Key: your-api-key
```

**Paramètres :**
```json
{
  "cardNumber": "5355842551783074",
  "cardExpiry": "05/30",
  "cardCVC": "219",
  "cardOwner": "bene sss",
  "amount": "10"
}
```

**Réponse :**
```json
{
  "success": true,
  "sessionId": "session_1704123456789_abc123",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "status": "completed",
  "transactionId": "txn_1704123456789",
  "paymentData": {
    "amount": "10",
    "lastFourDigits": "3074",
    "cardType": "mastercard",
    "cardOwner": "bene sss"
  }
}
```

## 🔒 Sécurité

### Authentification
Deux méthodes d'authentification sont supportées :

1. **Clé API** (recommandée)
```http
X-API-Key: your-secret-api-key
```

2. **JWT Token**
```http
Authorization: Bearer your-jwt-token
```

### Rate Limiting
- **100 requêtes** par **15 minutes** par IP
- Headers de limite inclus dans la réponse
- Bypass disponible en mode développement

### Validation
- Validation complète des données de carte
- Sanitisation des inputs
- Détection du type de carte

## 📊 Monitoring

### Logs
Les logs sont structurés avec différents niveaux :
- `error` : Erreurs critiques
- `warn` : Avertissements
- `info` : Informations générales
- `debug` : Détails de débogage

### Métriques
- Temps de réponse
- Taux de succès/échec
- Utilisation du cache
- Consommation mémoire

## 🔧 Configuration

### Variables d'environnement

| Variable | Description | Défaut |
|----------|-------------|--------|
| `NODE_ENV` | Environnement d'exécution | `development` |
| `PORT` | Port d'écoute | `3001` |
| `API_SECRET_KEY` | Clé API pour l'authentification | *(requis)* |
| `BROWSERLESS_API_KEY` | Clé API Browserless | *(requis)* |
| `JWT_SECRET` | Secret pour JWT | *(requis)* |
| `CORS_ORIGIN` | Origine CORS autorisée | `http://localhost:3000` |
| `CACHE_TTL` | Durée de vie du cache (ms) | `300000` |
| `API_TIMEOUT` | Timeout API (ms) | `60000` |
| `MAX_RETRIES` | Nombre de tentatives | `3` |
| `RATE_LIMIT_REQUESTS` | Limite de requêtes | `100` |
| `RATE_LIMIT_WINDOW` | Fenêtre de limite (ms) | `900000` |

### Cache
Le cache utilise une approche intelligente :
- **Clé basée sur un hash** des données de paiement
- **TTL configurable** (5 minutes par défaut)
- **Nettoyage automatique** des entrées expirées

## 🧪 Tests

```bash
# Tests unitaires
npm test

# Tests en mode watch
npm run test:watch

# Coverage
npm run test:coverage
```

## 🔄 Retry Logic

Le système de retry intelligent :
- **Backoff exponentiel** : 2s, 4s, 8s...
- **Jitter** ajouté pour éviter les pics
- **Limite de 10 secondes** maximum entre tentatives
- **3 tentatives** par défaut

## 📈 Performance

### Optimisations
- Cache intelligent pour éviter les appels répétés
- Compression des réponses
- Timeouts configurables
- Pooling de connexions

### Limites Vercel
- **Mémoire** : 512MB maximum
- **Timeout** : 30 secondes maximum
- **Région** : France (fra1) configurée

## 🛠️ Développement

### Structure des middlewares
```javascript
corsMiddleware → 
sessionMiddleware → 
requestLoggerMiddleware → 
rateLimitMiddleware → 
authMiddleware → 
validatePaymentData → 
handler
```

### Ajout d'un nouveau endpoint
1. Créer le fichier dans `pages/api/`
2. Importer les middlewares nécessaires
3. Implémenter la logique métier
4. Ajouter les logs appropriés

## 🚨 Gestion des erreurs

### Types d'erreurs
- **400** : Données invalides
- **401** : Non autorisé
- **429** : Rate limit dépassé
- **500** : Erreur serveur
- **503** : Service indisponible

### Logs d'erreur
Chaque erreur est loggée avec :
- Session ID
- Stack trace
- Métadonnées contextuelles
- Timestamp

## 📞 Support

### Debugging
Activer le mode debug :
```env
LOG_LEVEL=debug
```

### Health Check
Vérifier la santé du service :
```bash
curl https://votre-gateway.vercel.app/api/health
```

### Logs en production
Les logs sont au format JSON structuré pour faciliter l'analyse.

## 🔮 Roadmap

- [ ] Métriques Prometheus
- [ ] Support d'autres processeurs de paiement
- [ ] Webhook pour notifications
- [ ] Tests d'intégration
- [ ] Documentation OpenAPI

## 📄 Licence

MIT - Voir le fichier `LICENSE` pour plus de détails.

---

## 🤝 Intégration avec votre application

### Exemple d'utilisation
```javascript
// Dans votre application React
const paymentResult = await fetch('https://votre-gateway.vercel.app/api/payments/browserless-checkout', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'votre-cle-api',
    'X-Session-ID': generateSessionId()
  },
  body: JSON.stringify({
    cardNumber: '5355842551783074',
    cardExpiry: '05/30',
    cardCVC: '219',
    cardOwner: 'bene sss',
    amount: '10'
  })
});

const result = await paymentResult.json();
console.log('Paiement traité:', result);
```

### Gestion des erreurs côté client
```javascript
try {
  const result = await processPayment(paymentData);
  if (result.success) {
    console.log('Paiement réussi:', result.transactionId);
  }
} catch (error) {
  console.error('Erreur de paiement:', error.message);
  // Gérer l'erreur appropriée
}
```

🎉 **Votre Cloud Gateway est maintenant prêt pour la production !** 