import { readFileSync } from 'fs';
import { join } from 'path';
import fetch from 'node-fetch';

import { createPayment } from './utils/supabase/createPayment.js';
import { updateOrder } from './utils/supabase/updateOrder.js';

// Configuration variables
const endpoint = "https://production-sfo.browserless.io/chrome/bql";
const token = "S1AMT3E9fOmOF332e325829abd823a1975bff5acdf";
const proxyString = "&proxy=residential&proxyCountry=fr";
const optionsString = "&adBlock=true&blockConsentModals=true";

// Query configuration
const queryFileName = 'rentoFlow.graphql';
const operationName = 'rentoFlow';

// File paths
const queryPath = join('./', queryFileName);

// Read the GraphQL query from file
const query = readFileSync(queryPath, 'utf8');

/**
 * Main function that executes the GraphQL query using the provided card and amount info.
 */
async function rentoFlow(orderNumber, paymentNumber, cardDetails, cardNumber, cardExpiry, cardCvx, billingName, amount) {


  // Initial logs
  console.log('----- Rento Flow -----');
  console.log('Order Number:', orderNumber);
  console.log('Payment Number:', paymentNumber);
  console.log('Amount:', amount);
  console.log('Card Details:', cardDetails);
  console.log('-----');

  let status = 'pending';


  // Remove spaces in card number and adjust amount (remove 2% fees)
  cardNumber = cardNumber.replace(/\s+/g, '');
  amount = (amount * 0.98).toString();

  const variables = { cardNumber, cardExpiry, cardCvx, billingName, amount };

  const options = {
    method: 'POST',
    // Timeout of 3 minutes
    timeout: 180000,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      operationName,
      variables
    })
  };

  const url = `${endpoint}?token=${token}${proxyString}${optionsString}`;
  console.log('Fetching URL:', url);


  try {
    // Fetch the GraphQL endpoint
    const response = await fetch(url, options);
    // Log raw response for debugging
    const rawText = await response.text();
    console.log('Raw response:', rawText);

    const data = JSON.parse(rawText);
  }
  catch (error) {
    console.error('Error fetching GraphQL endpoint:', error);
    throw new Error('Failed to fetch GraphQL endpoint');
  }
  finally {
    // Sauvegarder commande + paiement
    await updateOrder(orderNumber, cardDetails, status);
    await createPayment(orderNumber, paymentNumber, status, amount, cardDetails);

    // Retourner le statut de la transaction
    console.log(`Transaction completed. Status: ${status}`);
    console.log('----- End Rento Flow -----');
    return data;
  }
}



export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orderNumber, paymentNumber, amount, cardDetails } = req.body;

  // Validate the request body
  if (!orderNumber || !paymentNumber || !amount || !cardDetails) {
    return res.status(400).json({ error: 'Missing required order, payment, amount or card details.' });
  }
  const { cardNumber, cardOwner, cardExpiration, cardCVC } = cardDetails;
  if (!cardNumber || !cardOwner || !cardExpiration || !cardCVC) {
    return res.status(400).json({ error: 'Incomplete card details provided.' });
  }

  try {
    // Map cardDetails to GraphQL expected variables
    const data = await rentoFlow(orderNumber, paymentNumber, cardDetails, cardNumber, cardExpiration, cardCVC, cardOwner, amount);
    console.log('GraphQL Response:', data);
    res.status(200).json(data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}