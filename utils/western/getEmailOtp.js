import crypto from 'crypto';// Fonction pour obtenir le code OTP par email
import https from 'https';

export async function getEmailOtp(email) {
  const md5Email = crypto.createHash('md5').update(email).digest('hex');

  const options = {
    method: 'GET',
    hostname: 'privatix-temp-mail-v1.p.rapidapi.com',
    port: null,
    path: `/request/mail/id/${md5Email}/`,
    headers: {
      'x-rapidapi-key': '05a4e12364mshcf22fc9ff60af0fp1428ccjsn9014ff4739d8',
      'x-rapidapi-host': 'privatix-temp-mail-v1.p.rapidapi.com',
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      const chunks = [];

      res.on('data', (chunk) => {
        chunks.push(chunk);
      });

      res.on('end', () => {
        const body = Buffer.concat(chunks).toString();
        try {
          const emails = JSON.parse(body);
          if (emails && emails.length > 0) {
            const latestEmail = emails[emails.length - 1]; // Get the latest email
            const otpMatch = latestEmail.mail_text_only.match(/\b\d{6}\b/); // Extract 6-digit OTP
            if (otpMatch) {
              resolve(otpMatch[0]); // Return the OTP
            } else {
              reject(new Error('OTP not found in the latest email'));
            }
          } else {
            reject(new Error('No emails found'));
          }
        } catch (error) {
          reject(new Error('Failed to parse email response'));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}
//console.log(await getEmailOtp('kevin.arnaud@tenvil.com'))