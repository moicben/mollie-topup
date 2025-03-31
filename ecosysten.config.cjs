module.exports = {
  apps: [
    {
      name: "mollie-topup",
      script: "./index.js",
      env: {
        NODE_ENV: "production",
        DISPLAY: ":11",
        XAUTHORITY: "/root/.Xauthority", // ou le chemin approprié pour l'utilisateur exécutant la session
        PUPPETEER_EXECUTABLE_PATH: "/usr/bin/google-chrome"
      }
    }
  ]
};
