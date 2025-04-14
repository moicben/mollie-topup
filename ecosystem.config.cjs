module.exports = {
  apps: [
    {
      name: "app",
      script: "./index.js",
      env: {
        NODE_ENV: "production",
        DISPLAY: ":11",
        XAUTHORITY: "/root/.Xauthority", // ou le chemin approprié pour l'utilisateur exécutant la session
        PUPPETEER_EXECUTABLE_PATH: "/usr/bin/google-chrome-stable",
        PUPPETEER_PROFIL_PATH: "/root/chrome-profile/Default",
        PORT: 443, 
      }
    }
  ],
};
