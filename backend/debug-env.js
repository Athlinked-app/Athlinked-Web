const path = require('path');
const result = require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('=== DOTENV PARSING RESULT ===');
if (result.error) {
  console.error('Error:', result.error);
} else {
  console.log('Parsed username from .env:', result.parsed.username);
  console.log('Parsed password from .env:', result.parsed.password ? '***' : undefined);
  console.log('Parsed host from .env:', result.parsed.host);
}

console.log('\n=== ENVIRONMENT VARIABLES ===');
console.log('process.env.username:', process.env.username);
console.log('process.env["username"]:', process.env['username']);
console.log('process.env.USERNAME:', process.env.USERNAME);
console.log('process.env.host:', process.env.host);
console.log('process.env.password:', process.env.password ? '***' : undefined);

// Direct access from parsed result
console.log('\n=== DIRECT FROM PARSED ===');
console.log('result.parsed.username:', result.parsed.username);
console.log('result.parsed.password:', result.parsed.password ? '***' : undefined);
