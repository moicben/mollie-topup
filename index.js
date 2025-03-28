import express from 'express';
import cors from 'cors';
import fs from 'fs';
import https from 'https';

import createMollieHandler from './pay.js';

const app = express();
const PORT = 443; // Port par défaut pour HTTPS

// Charger les certificats SSL
const sslOptions = {
  key: fs.readFileSync('/etc/letsencrypt/live/api.christopeit-france.shop/privkey.pem'), // Chemin vers la clé privée
  cert: fs.readFileSync('/etc/letsencrypt/live/api.christopeit-france.shop/fullchain.pem'), // Chemin vers le certificat
};

// Autoriser toutes les origines
app.use(cors({
  origin: '*', // Autorise toutes les origines
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Autorise les méthodes HTTP spécifiques
  allowedHeaders: ['Content-Type', 'Authorization'], // Autorise les en-têtes spécifiques
}));

// Middleware pour parser le JSON
app.use(express.json());

// Route /
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Bienvenue sur la page d\'accueil ' });
});

// Route pour créer un lien de paiement Mollie
app.post('/pay', createMollieHandler);

// Démarrer le serveur HTTPS
https.createServer(sslOptions, app).listen(PORT, () => {
  console.log(`HTTPS Server is running on https://api.christopeit-france.shop`);
});