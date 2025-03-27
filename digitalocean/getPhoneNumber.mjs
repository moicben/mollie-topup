import { get } from 'http';
import fetch from 'node-fetch';

export async function getPhoneNumber() {
  const apiKey = "00391327792459169befa029ed22d646";
  const service = 'uf'; // ENEBA
  const operator = 'any';
  const country = '78'; //France
  const lang = 'en';
  const url = `https://sms-activation-service.net/stubs/handler_api?api_key=${apiKey}&action=getNumber&country=${country}&operator=${operator}&service=${service}&lang=${lang}`;

  while (true) {
    try {
      const response = await fetch(url, { method: 'GET' });
      const data = await response.text();
      console.log('Response:', data);
      if (data.startsWith('ACCESS_NUMBER')) {
        const parts = data.split(':');
        const orderId = parts[1];
        const phoneNumber = parts[2];
        const phoneNumberWithoutPrefix = phoneNumber.startsWith('33') ? phoneNumber.slice(2) : phoneNumber;
        console.log('Order ID:', orderId);
        console.log('Phone Number without prefix:', phoneNumberWithoutPrefix);
        return { orderId, phoneNumberWithoutPrefix };
      } else if (data === 'NO_NUMBERS') {
        console.error('No available numbers from API, retrying in 2 seconds...');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 2 seconds before retrying
      } else {
        throw new Error('Invalid response from API');
      }
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }
}


getPhoneNumber();