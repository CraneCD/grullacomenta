const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Check if .env files exist
const envPath = path.join(process.cwd(), '.env');
const envLocalPath = path.join(process.cwd(), '.env.local');

console.log('Environment file check:');
console.log('.env exists:', fs.existsSync(envPath));
console.log('.env.local exists:', fs.existsSync(envLocalPath));

// Try to read the files
try {
  if (fs.existsSync(envPath)) {
    console.log('\n.env contents:');
    console.log(fs.readFileSync(envPath, 'utf8'));
  }
  if (fs.existsSync(envLocalPath)) {
    console.log('\n.env.local contents:');
    console.log(fs.readFileSync(envLocalPath, 'utf8'));
  }
} catch (error) {
  console.error('Error reading files:', error);
}

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
  if (value) {
    // Show first few characters of the value for verification
    const maskedValue = value.substring(0, 5) + '...' + value.substring(value.length - 5);
    console.log(`  Value: ${maskedValue}`);
  }
}); 