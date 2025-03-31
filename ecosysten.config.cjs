module.exports = {
  apps: [
    {
      name: "mollie-topup",
      script: "./index.js", // ou le script qui lance Puppeteer
      env: {
        NODE_ENV: "production",
        DISPLAY: ":10", // indique le display pour Xvnc
        PUPPETEER_EXECUTABLE_PATH: "/usr/bin/google-chrome", // ou le chemin approprié
        // autres variables d'environnement...
      }
    }
  ]
};