import fs from 'fs/promises';
import path from 'path';

// Choisir aléatoirement un prénom et un nom dans identities.json
export async function getRandomIdentity() {
  const data = await fs.readFile(path.join('identities.json'), 'utf8');
  const identities = JSON.parse(data);

  const randomFirstNameIndex = Math.floor(Math.random() * identities.length);
  const randomLastNameIndex = Math.floor(Math.random() * identities.length);
  const randomAddressIndex = Math.floor(Math.random() * identities.length);
  const randomCityIndex = Math.floor(Math.random() * identities.length);
  const randomPostalIndex = Math.floor(Math.random() * identities.length);
  const randomPhoneIndex = Math.floor(Math.random() * identities.length);

  const firstName = identities[randomFirstNameIndex].firstName;
  const lastName = identities[randomLastNameIndex].lastName;
  const address = identities[randomAddressIndex].address;
  const city = identities[randomCityIndex].city;
  const postal = identities[randomPostalIndex].postal;
  const phone = identities[randomPhoneIndex].phone;

  //console.log('Random Identity:', { firstName, lastName, address, city, postal, phone });
  return { firstName, lastName, address, city, postal, phone };
}


