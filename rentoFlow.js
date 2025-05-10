import { readFileSync } from 'fs';
import { join } from 'path';
import fetch from 'node-fetch';

// Configuration variables
const endpoint = "https://production-sfo.browserless.io/chrome/bql";
const token = "S1AMT3E9fOmOF332e325829abd823a1975bff5acdf";
const proxyString = "&proxy=residential&proxyCountry=fr";
const optionsString = "&humanlike=true&adBlock=true&blockConsentModals=true";

// Query configuration
const queryFileName = 'rentoflow.graphql';
const operationName = 'rentoFlow';

// File paths
const queryPath = join('./', queryFileName);

// Read the GraphQL query from file
const query = readFileSync(queryPath, 'utf8');

// Handler for the rentoFlow endpoint
export default async function rentoFlow(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Extract variables from request body
  const { cardNumber, cardExpiry, cardCvx, billingName, amount } = req.body;
  if (!cardNumber || !cardExpiry || !cardCvx || !billingName || !amount) {
    return res.status(400).json({ error: 'Missing required card or amount information.' });
  }

  const variables = { cardNumber, cardExpiry, cardCvx, billingName, amount };

  const options = {
    method: 'POST',
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
    const response = await fetch(url, options);
    const data = await response.json();

    if (data.errors) {
      console.error('GraphQL Errors:', data.errors);
      return res.status(500).json({ error: 'Error executing GraphQL query', details: data.errors });
    }

    console.log('GraphQL Response:', data);
    res.status(200).json(data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}