const { delay } = require('./utils');

async function verifyPayment(browser, page, otpCode) {
  
  // Extra time to let the popup load
  await delay(10000);
  console.log('3d-secure loaded');

  if (otpCode) {
    // Click in the middle of the screen
    await page.mouse.click(page.viewport().width / 2, page.viewport().height / 2);
    console.log('Clicked in the middle of the screen');
    await delay(1000);

    // Entering OTP code
    await page.keyboard.press('Tab');
    await delay(1000);
    await page.keyboard.press('Tab');
    await delay(1000);  

    await page.keyboard.type(otpCode);
    await delay(1000);

    await page.screenshot({ path: 'eneba_otp.png' });
    await page.keyboard.press('Tab');
    await delay(1000);

    // Send OTP code
    await page.keyboard.press('Enter');
    console.log('OTP code sent');
    await delay(5000);
  } else {
    // Extra-time to user to validate 3D-secure
    await delay(5000);
    console.log('3D-secure time passed');
  }

  await page.screenshot({ path: 'eneba_passed.png' });

  // Wait for payment to be processed
  await delay(15000);
  await page.screenshot({ path: 'eneba_verified.png' });

  // Résolution du captcha CloudFare
  console.log('Attempting to solve captcha...');
  await page.screenshot({ path: 'eneba_captcha.png' });

  try {
    const { getPhoneNumber } = await import('./getPhoneNumber.mjs');
    const { orderId, phoneNumberWithoutPrefix } = await getPhoneNumber();
    // Entering phone number
    await page.keyboard.press('Tab');
    await delay(1000);  
    await page.keyboard.press('Tab');
    await delay(1000);
    await page.keyboard.press('Tab');
    await delay(1000);

    await page.keyboard.type(phoneNumberWithoutPrefix);
    await delay(1000);
    console.log('Phone number entered');
    await page.screenshot({ path: 'eneba_phone.png' });

    await page.keyboard.press('Enter');
    await delay(5000);

    // Get sent page state
    await page.screenshot({ path: 'eneba_sent.png' });
    console.log('Send content:', await page.content());

    // Check phone status every 5 seconds for up to 3 minutes
    let status;
    const { getPhoneStatus } = await import('./getPhoneStatus.mjs');
    const { changePhoneStatus } = await import('./changePhoneStatus.mjs');
    const maxAttempts = 36; // 3 minutes / 5 seconds
    let attempts = 0;

    do {
      status = await getPhoneStatus(orderId);
      console.log('Current Status:', status);
      await delay(5000);
      attempts++;
    } while (status === 'STATUS_WAIT_CODE' && attempts < maxAttempts);

    if (status.startsWith('STATUS_OK')) {
      const code = status.split(':')[1];
      console.log('Verification Code:', code);
      await page.screenshot({ path: 'eneba_precode.png' });

      // Entering verification code
      await page.keyboard.press('Tab');
      await delay(1000);  
      await page.keyboard.press('Tab');
      await delay(1000);
      await page.keyboard.press('Tab');
      await delay(1000);

      await page.keyboard.type(code);
      await delay(1000);
      console.log('Verification code entered');
      await page.screenshot({ path: 'eneba_code.png' });

      await page.keyboard.press('Enter');
      await delay(10000);

    } else if (attempts >= maxAttempts) {
      console.error('Failed to get verification code within 3 minutes, changing status to cancelled');
      await changePhoneStatus(orderId)
    } else {
      console.error('Failed to get verification code:', status);
    }
  } catch (error) {
    console.error('Error:', error);
  }

  console.log('After code');
  //await page.screenshot({ path: 'eneba_aftercode.png' });

  // Get HTML content
}

module.exports = { verifyPayment };