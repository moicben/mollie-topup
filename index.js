import express from 'express';
import cors from 'cors';
import fs from 'fs';
import https from 'https';

import googleTopup from './googleTopup.js';
import googleLogin from './googleLogin.js';

import westernInit from './westernInit.js'; 
import westernProceedHandler from './westernProceed.js';

import westernTopup from './westernTopup.js';
import westernDebug from './westernDebug.js'; 
import { browserSession } from './utils/puppeteer/browserSession.js';

import rentoInit from './rentoInit.js'; 


const app = express();
const PORT = process.env.PORT
//const PORT = 3000; // Port HTTP pour le développement local


const sslOptions = {
  key: fs.readFileSync('/etc/letsencrypt/live/api.christopeit-sport.fr/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/api.christopeit-sport.fr/fullchain.pem')
};

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({ message: 'Bienvenue sur la page d\'accueil ' });
});

app.post('/google-login', googleLogin);
app.post('/google-topup', googleTopup);
app.post('/western-topup', westernTopup);

app.post('/western-debug', westernDebug);

// La route d'initialisation appelle directement le handler de westernInit
app.post('/western-init', westernInit);

// La route pour la transaction utilise les objets contenus dans browserSession
app.post('/western-proceed', (req, res) => {
  return westernProceedHandler(browserSession.browser, browserSession.page)(req, res);
});




https.createServer(sslOptions, app).listen(PORT, () => {
  console.log(`HTTPS Server is running on https://api.christopeit-sport.fr`);
});