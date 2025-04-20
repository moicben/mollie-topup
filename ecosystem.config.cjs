const { exec } = require("child_process");

module.exports = {
  apps: [
    {
      name: "app",
      script: "./index.js",
      env: {
        NODE_ENV: "production",
        DISPLAY: ":10",
        XAUTHORITY: "/root/.Xauthority", // ou le chemin approprié pour l'utilisateur exécutant la session
        PUPPETEER_EXECUTABLE_PATH: "/usr/bin/google-chrome-stable",
        PUPPETEER_PROFIL_PATH: "/root/chrome-profile/Default",
        PORT: 443, 
        NODE_EXTRA_CA_CERTS: "/usr/local/share/ca-certificates/ssl_oculus_certificate.cer",
      }
    }
  ],
};
