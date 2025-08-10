#!/usr/bin/env node

/**
 * Script de démarrage pour le Cloud Gateway
 */

const { spawn } = require('child_process');
const path = require('path');

// Configuration
const isDevelopment = process.env.NODE_ENV !== 'production';
const port = process.env.PORT || 3001;

console.log('🚀 Démarrage du Cloud Gateway...');
console.log(`📍 Environnement: ${isDevelopment ? 'développement' : 'production'}`);
console.log(`🌐 Port: ${port}`);

// Vérifier les variables d'environnement critiques
const requiredEnvVars = [
  'API_SECRET_KEY',
  'JWT_SECRET'
];

if (!isDevelopment) {
  requiredEnvVars.push('BROWSERLESS_API_KEY');
}

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Variables d\'environnement manquantes:');
  missingVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  process.exit(1);
}

// Démarrer le serveur
const command = isDevelopment ? 'dev' : 'start';
const args = [command];

if (isDevelopment) {
  args.push('-p', port);
}

console.log(`🏃 Exécution: npm run ${command}`);

const child = spawn('npm', args, {
  stdio: 'inherit',
  cwd: path.resolve(__dirname, '..'),
  env: { ...process.env, PORT: port }
});

// Gestion des signaux
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt du serveur...');
  child.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Arrêt du serveur (SIGTERM)...');
  child.kill('SIGTERM');
  process.exit(0);
});

// Gestion des erreurs
child.on('error', (error) => {
  console.error('❌ Erreur lors du démarrage:', error);
  process.exit(1);
});

child.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Le serveur s'est arrêté avec le code ${code}`);
    process.exit(code);
  }
  console.log('✅ Serveur arrêté proprement');
}); 