const express = require('express');
const { startSession } = require('./checkoutInit');
const { completePayment } = require('./checkoutProceed');
const { verifyPayment } = require('./checkoutVerify');
const app = express();

app.use(express.json());

let browser, page, client;

app.post('/eneba_checkout/init', async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { userLong, userLat, payAmount } = req.body;
  const giftCardValues = [5, 10, 15, 20, 25, 30, 50, 70, 100];

  try {
    ({ browser, page, client } = await startSession(userLat, userLong, payAmount, giftCardValues));
    res.status(200).json({ message: 'Session started successfully' });
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({ message: 'Error starting session', error: error.message });
  }
});

app.post('/eneba_checkout/proceed', async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { cardHolder, cardNumber, cardExpiration, cardCVC } = req.body;

  const ownerName = cardHolder.split(' ')[0];
  const ownerSurname = cardHolder.split(' ')[1];
  const cardEmail = `${ownerName}.${ownerSurname}@tenvil.com`;

  const formattedCardNumber = cardNumber.replace(/ /g, '');
  const cardMonth = parseInt(cardExpiration.split('/')[0]).toString();
  const cardYear = parseInt(cardExpiration.split('/')[1]).toString();

  try {
    const { payAmount } = await completePayment(browser, page, cardHolder, formattedCardNumber, cardMonth, cardYear, cardCVC, cardEmail);
    res.status(200).json({ message: 'Payment processed successfully', payAmount });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ message: 'Error processing payment', error: error.message });
  }
});

app.post('/eneba_checkout/verify', async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { otpCode } = req.body;

  try {
    await verifyPayment(browser, page, otpCode);
    res.status(200).json({ message: '3D-secure verification completed successfully' });
  } catch (error) {
    console.error('Error verifying 3D-secure:', error);
    res.status(500).json({ message: 'Error verifying 3D-secure', error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));