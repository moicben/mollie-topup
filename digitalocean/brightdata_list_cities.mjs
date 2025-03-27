import 'dotenv/config';
import fetch from 'node-fetch';

const country = 'fr'; // Specify the country
const options = { method: 'GET', headers: { Authorization: `Bearer ${process.env.BRIGHTDATA_API_KEY}` } };

fetch(`https://api.brightdata.com/zone/static/cities?country=${country}`, options)
  .then(response => response.json()) // Directly parse the JSON response
  .then(response => {
    console.log('Full response:', response); // Log the full response
    console.log('Parsed response:', response);
  })
  .catch(err => console.error('Error:', err));