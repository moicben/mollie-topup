import fetch from 'node-fetch';

export async function getPhoneStatus(orderId) {
  try {
    const apiKey = "00391327792459169befa029ed22d646";
    const lang = 'en';
    const url = `https://sms-activation-service.net/stubs/handler_api?api_key=${apiKey}&action=getStatus&id=${orderId}&lang=${lang}`;

    const response = await fetch(url, { method: 'GET' });
    const data = await response.text();
    console.log('Status Response:', data);
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}