const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Check if .env files exist
const envPath = path.join(process.cwd(), '.env');
const envLocalPath = path.join(process.cwd(), '.env.local');

console.log('Environment file check:');
console.log('.env exists:', fs.existsSync(envPath));
console.log('.env.local exists:', fs.existsSync(envLocalPath));

const requiredEnvVars = [
  'DATABASE_URL',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN'
];

console.log('\nChecking environment variables...');
console.log('Current working directory:', process.cwd());

requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  console.log(`${envVar}: ${value ? '✓ Set' : '✗ Missing'}`);
}); 