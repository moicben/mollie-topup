import express from 'express';
import cors from 'cors';
import fs from 'fs';
import https from 'https';

import mollieTopup from './mollieTopup.js';
import mollieLogin from './mollieLogin.js';
import scheduleMollieLogin from './scheduleLogin.js';

import googleTopup from './googleTopup.js';
import googleLogin from './googleLogin.js';

import westernInit from './westernInit.js';
import westernProceedHandler from './westernProceed.js';
import westernTopup from './westernTopup.js';

const app = express();
const PORT = process.env.PORT || 443;

// Charger les certificats SSL
const sslOptions = {
  key: fs.readFileSync('/etc/letsencrypt/live/api.christopeit-sport.fr/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/api.christopeit-sport.fr/fullchain.pem')
};

// Autoriser toutes les origines
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Middleware pour parser le JSON
app.use(express.json());

// Route /
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Bienvenue sur la page d\'accueil ' });
});

// Autres routes...
app.post('/mollie-topup', mollieTopup);
app.post('/mollie-login', mollieLogin);
app.post('/google-login', googleLogin);
app.post('/google-topup', googleTopup);
app.post('/western-topup', westernTopup);

// Initialiser Western Union et enregistrer la route pour Western Proceed
(async () => {
  const { browser: westernBrowser, page: westernPage } = await westernInit;
  
  // Route pour transaction Western Union
  app.post('/western-proceed', westernProceedHandler(westernBrowser, westernPage));

  // Démarrer le serveur HTTPS
  https.createServer(sslOptions, app).listen(PORT, () => {
    console.log(`HTTPS Server is running on https://api.christopeit-sport.fr`);
  });
})();