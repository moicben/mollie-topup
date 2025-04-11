import express from 'express';
import cors from 'cors';
import fs from 'fs';
import https from 'https';

import mollieTopup from './mollieTopup.js';
import mollieLogin from './mollieLogin.js';
import scheduleMollieLogin from './scheduleLogin.js';
import westernTopup from './westernTopup.js';

import googleTopup from './googleTopup.js';
import googleLogin from './googleLogin.js';

const app = express();
const port = process.env.PORT;

// Charger les certificats SSL
const sslOptions = {
  key: process.env.SSL_KEY,
  cert: process.env.SSL_CERT,
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

// Route Topup Mollie
app.post('/mollie-topup', mollieTopup);

// Route Debug Mollie
app.post('/mollie-login', mollieLogin);

// Route Topup Google
app.post('/google-topup', googleTopup);

// Route Topup WesternUnion
app.post('/western-topup', westernTopup);

//

// Route pour le débogage de Google
app.post('/google-login', googleLogin);

// Lancer la requête programmée de login toutes les 23 heures
//scheduleMollieLogin();

// Démarrer le serveur HTTPS
https.createServer({ key, cert }, app)
     .listen(port, () => console.log(`API HTTPS sur ${port}`));