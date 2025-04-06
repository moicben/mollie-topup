import express from 'express';
import cors from 'cors';
import fs from 'fs';
import https from 'https';

import payMollie from './pay.js';
import mollieLogin from './mollieLogin.js';
import scheduleMollieLogin from './scheduleLogin.js';

const app = express();
const PORT = 443; // Port par défaut pour HTTPS

// Charger les certificats SSL
const sslOptions = {
  key: fs.readFileSync('/etc/letsencrypt/live/api.christopeit-france.shop/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/api.christopeit-france.shop/fullchain.pem'),
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

// Route pour créer un lien de paiement Mollie
app.post('/pay', payMollie);

// Route pour se connecter à Mollie
app.post('/login', mollieLogin);

// Lancer la requête programmée de login toutes les 23 heures
scheduleMollieLogin();

// Démarrer le serveur HTTPS
https.createServer(sslOptions, app).listen(PORT, () => {
  console.log(`HTTPS Server is running on https://api.christopeit-france.shop`);
});