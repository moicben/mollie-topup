import crypto from 'crypto';
import https from 'https';

export async function getEmailOtp(email) {
  const md5Email = crypto.createHash('md5').update(email).digest('hex');
  
  const options = {
    method: 'GET',
    hostname: 'privatix-temp-mail-v1.p.rapidapi.com',
    path: `/request/mail/id/${md5Email}/`,
    headers: {
      'x-rapidapi-key': '05a4e12364mshcf22fc9ff60af0fp1428ccjsn9014ff4739d8',
      'x-rapidapi-host': 'privatix-temp-mail-v1.p.rapidapi.com',
    },
  };

  const fetchOtp = () => {
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
              const latestEmail = emails[0];
                const otpMatch = latestEmail.mail_text_only.match(/>(\d{6})/)
              if (otpMatch) {
                return resolve(otpMatch[0].replace(/>/g, '').trim());
              } else {
                return reject(new Error('OTP not found in the latest email'));
              }
            } else {
              return reject(new Error('No emails found'));
            }
          } catch (error) {
            return reject(new Error('Failed to parse email response'));
          }
        });
      });
  
      req.on('error', (error) => {
        return reject(error);
      });
  
      req.end();
    });
  };

  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const otp = await fetchOtp();
      if (otp) {
        return otp;
      }
    } catch (error) {
      console.log(`Pas de code OTP : Tentative ${attempt}...`);
    }
    if (attempt < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 4000));
    }
  }
  throw new Error('No OTP found after 3 attempts');
}


// Usage example
// (async () => {
//   try {
//     const otp = await getEmailOtp('ver.galat@cpav3.com');
//     console.log('OTP Code:', otp);
//   } catch (error) {
//     console.error('Error:', error.message);
//   }
// }
// )();