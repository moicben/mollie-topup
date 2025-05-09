import express from 'express';
import cors from 'cors';
import fs from 'fs';
import https from 'https';

import googleTopup from './googleTopup.js';
import googleLogin from './googleLogin.js';

import westernInit from './westernInit.js'; // handler Express qui met à jour westernSession
import westernProceedHandler from './westernProceed.js';

import westernTopup from './westernTopup.js';
import westernDebug from './westernDebug.js'; // handler Express qui met à jour westernSession

import { westernSession } from './westernSession.js';

const app = express();
//const PORT = process.env.PORT || 443;
const PORT = 3000; // Port HTTP pour le développement local


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

// La route pour la transaction utilise les objets contenus dans westernSession
app.post('/western-proceed', (req, res) => {
  return westernProceedHandler(westernSession.browser, westernSession.page)(req, res);
});



https.createServer(sslOptions, app).listen(PORT, () => {
  console.log(`HTTPS Server is running on https://api.christopeit-sport.fr`);
});