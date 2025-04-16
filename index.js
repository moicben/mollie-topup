import express from 'express';
import cors from 'cors';
import fs from 'fs';
import https from 'https';

import googleTopup from './googleTopup.js';
import googleLogin from './googleLogin.js';

import westernInit from './westernInit.js';
import westernProceedHandler from './westernProceed.js';
import westernTopup from './westernTopup.js';
import { westernSession } from './westernSession.js';

const app = express();
const PORT = process.env.PORT || 443; // Port par défaut pour HTTPS

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

//

//

// Route pour le débogage de Google
app.post('/google-login', googleLogin);

// Route Topup Google
app.post('/google-topup', googleTopup);

//

//


// Initialisation de Western Union

let westernBrowser, westernPage;

app.post('/western-init', ({ westernBrowser, westernPage } = westernInit))

// Transaction Western Union
app.post('/western-proceed',  westernProceedHandler(westernSession.browser, westernSession.page));

// Route Topup WesternUnion
app.post('/western-topup', westernTopup);



// Lancer la requête programmée de login toutes les 23 heures
//scheduleMollieLogin();

//

// Démarrer le serveur HTTPS
https.createServer(sslOptions, app).listen(PORT, () => {
  console.log(`HTTPS Server is running on https://api.christopeit-sport.fr`);
});