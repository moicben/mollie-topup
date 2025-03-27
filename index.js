import express from 'express';
import createMollieHandler from './create-mollie.js';
import payMollieHandler from './pay-mollie.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware pour parser le JSON
app.use(express.json());

// Route /
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Bienvenue sur la page d\'accueil' });
});

// Route pour créer un lien de paiement Mollie 
app.post('/create-mollie', createMollieHandler);

// Route pour effectuer un paiement Mollie
app.post('/pay-mollie', payMollieHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
