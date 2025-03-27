import fetch from 'node-fetch';

export async function changePhoneStatus(orderId) {
  try {
    const apiKey = "00391327792459169befa029ed22d646";
    const lang = 'en';
    const status = 8; // STATUS_CANCEL
    
    const url = `https://sms-activation-service.net/stubs/handler_api?api_key=${apiKey}&action=setStatus&id=${orderId}&status=${status}&lang=${lang}`;
    

    const response = await fetch(url, { method: 'GET' });
    const data = await response.text();
    console.log('Change Status Response:', data);
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}