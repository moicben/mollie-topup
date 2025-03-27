import express from 'express';
import cors from 'cors';

import createMollieHandler from './pay.js';

const app = express();
const PORT = process.env.PORT || 3000;

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
  res.status(200).json({ message: 'Bienvenue sur la page d\'accueil' });
});

// Route pour créer un lien de paiement Mollie 
app.post('/pay', createMollieHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});