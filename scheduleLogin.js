import fetch from 'node-fetch';

function scheduleMollieLogin() {
  const vingtTroisHeures = 23 * 60 * 60 * 1000;
  console.log("Programmation de la requête login toutes les 23 heures...");

  // Planification de la requête login toutes les 23 heures
  setInterval(async () => {
    try {
      console.log("Exécution programmée de la requête login...");
      const response = await fetch('https://api.christopeit-france.shop/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      console.log("Requête login programmée terminée avec le status :", response.status);
    } catch (error) {
      console.error("Erreur lors de la requête programmée :", error.message);
    }
  }, vingtTroisHeures);
}

export default scheduleMollieLogin;