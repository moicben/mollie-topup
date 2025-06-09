
// Choisir aléatoirement un prénom et un nom dans identities.json
export async function getRandomDomain() {

  const domains = [
    "@cpav3.com",
    "@nuclene.com",
    "@steveix.com",
    "@mocvn.com",
    "@tenvil.com",
    "@tgvis.com",
    "@amozix.com",
    "@anypsd.com",
    "@maxric.com"
  ];
  const domain = domains[Math.floor(Math.random() * domains.length)];

  return domain;
}


