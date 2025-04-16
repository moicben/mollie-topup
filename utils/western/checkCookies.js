
export async function checkCookies(page){
  // Verifie sur la page si 'button#onetrust-reject-all-handler' est présent ?
  await page.mouse.click(100, 10);
  await new Promise(resolve => setTimeout(resolve, 2000));

  const popup = await page.$('button#onetrust-reject-all-handler');

  if (popup) {
    console.log('Cookies found!');
    await popup.click();
    await new Promise(resolve => setTimeout(resolve, 2000));
  } else {
    console.log('Cookies not found..');
  }
}