import dotenv from 'dotenv';

// Load environment variables from .env file (mostly for local development)
const result = dotenv.config();

if (process.env.NODE_ENV !== 'production') {
  if (result.error) {
    console.warn('ℹ No .env file found at root. Using system environment variables.');
  } else {
    console.log('✅ .env file detected and loaded.');
  }
} else {
  // In production (Render), we typically don't use .env files
  console.log('🚀 Production mode: Environment variables are being read from system (Render).');
}
