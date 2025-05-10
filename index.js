import express from 'express';
import cors from 'cors';
import fs from 'fs';
import https from 'https';

import westernInit from './westernInit.js'; 
import westernProceedHandler from './westernProceed.js';
import westernTopup from './westernTopup.js';
import westernDebug from './westernDebug.js'; 

import rentoInit from './rentoInit.js'; 
import rentoDebug from './rentoDebug.js';
import rentoProceedHandler from './rentoProceed.js';

import { browserSession } from './utils/puppeteer/browserSession.js';

//

// Config

//

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

//

// Definir les routes

//

app.get('/', (req, res) => {
  res.status(200).json({ message: 'Bienvenue sur la page d\'accueil ' });
});

app.post('/rento-init', rentoInit);
app.post('/rento-debug', rentoDebug);
app.post('/rento-proceed', (req, res) => {
  return rentoProceedHandler(browserSession.PaymentUrl)(req, res);
});


https.createServer(sslOptions, app).listen(PORT, () => {
  console.log(`HTTPS Server is running on https://api.christopeit-sport.fr`);
});