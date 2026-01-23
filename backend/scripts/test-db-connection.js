const { Pool } = require('pg');
const path = require('path');

// Load .env file from the backend directory (parent of scripts)
const envPath = path.join(__dirname, '..', '.env');
const result = require('dotenv').config({ path: envPath });

if (result.error) {
  console.error(`\n❌ Error loading .env file from: ${envPath}`);
  console.error(`   ${result.error.message}\n`);
  process.exit(1);
}

async function testConnection() {
  // Read from .env file format: username, password, host, port, database, sslmode
  // Support both formats for backward compatibility
  // Use parsed result directly to avoid Windows case-insensitivity issues
  const envConfig = result.parsed || {};
  
  // DEBUG: Show what we're reading
  // console.log('DEBUG envConfig.username:', envConfig.username);
  // console.log('DEBUG envConfig.password:', envConfig.password);
  
  const dbHost = process.env.DB_HOST || envConfig.DB_HOST || process.env.host || envConfig.host;
  const dbPort = process.env.DB_PORT || envConfig.DB_PORT || process.env.port || envConfig.port;
  const dbName = process.env.DB_NAME || envConfig.DB_NAME || process.env.database || envConfig.database;
  const dbUser = process.env.DB_USER || envConfig.DB_USER || envConfig.username || process.env.username;
  const dbPassword = process.env.DB_PASSWORD || envConfig.DB_PASSWORD || envConfig.password || process.env.password;
  const sslMode = process.env.DB_SSL || envConfig.DB_SSL || process.env.sslmode || envConfig.sslmode;
  
  // Validate required environment variables
  const missingVars = [];
  if (!dbHost) missingVars.push('host or DB_HOST');
  if (!dbPort) missingVars.push('port or DB_PORT');
  if (!dbName) missingVars.push('database or DB_NAME');
  if (!dbUser) missingVars.push('username or DB_USER');
  if (!dbPassword) missingVars.push('password or DB_PASSWORD');
  
  if (missingVars.length > 0) {
    console.error('\n❌ Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\n💡 Your .env file should have these variables:');
    console.error('   Example format:');
    console.error('   host = your-host');
    console.error('   port = 5432');
    console.error('   database = your-database');
    console.error('   username = your-username');
    console.error('   password = your-password');
    console.error('   sslmode = require (optional, for SSL connections)');
    console.error('\n💡 Current .env file location:', envPath);
    console.error('💡 Note: Variable names must match exactly (case-sensitive)\n');
    process.exit(1);
  }

  console.log('\n🔍 Testing Database Connection...\n');
  console.log('📋 Connection Details:');
  console.log(`   Host: ${dbHost}`);
  console.log(`   Port: ${dbPort}`);
  console.log(`   Database: ${dbName}`);
  console.log(`   User: ${dbUser}`);
  console.log(`   SSL: ${sslMode || 'false'}`);
  console.log(`   SSL Reject Unauthorized: ${process.env.DB_SSL_REJECT_UNAUTHORIZED || 'true'}`);
  console.log('');

  // Create a test pool with longer timeout for cloud databases
  // Handle sslmode = require or DB_SSL = true
  const sslConfig = (sslMode === 'require' || sslMode === 'true' || sslMode === '1')
    ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
    : false;

  const testPool = new Pool({
    host: dbHost,
    port: parseInt(dbPort, 10),
    database: dbName,
    user: dbUser,
    password: dbPassword,
    ssl: sslConfig,
    connectionTimeoutMillis: 10000, // 10 seconds for cloud databases
  });

  let client;
  try {
    // Try to get a client from the pool
    console.log('⏳ Attempting to connect...');
    client = await testPool.connect();
    console.log('✅ Successfully connected to the database!\n');

    // Test query - get PostgreSQL version
    console.log('📊 Running test query...');
    const result = await client.query('SELECT version(), current_database(), current_user');
    
    console.log('✅ Query executed successfully!\n');
    console.log('📋 Database Information:');
    console.log(`   PostgreSQL Version: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}`);
    console.log(`   Current Database: ${result.rows[0].current_database}`);
    console.log(`   Current User: ${result.rows[0].current_user}`);
    console.log('');

    // Test query - check if we can read from a table (try users table if it exists)
    try {
      const tableCheck = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        LIMIT 5
      `);
      
      if (tableCheck.rows.length > 0) {
        console.log('📋 Available Tables (first 5):');
        tableCheck.rows.forEach((row, index) => {
          console.log(`   ${index + 1}. ${row.table_name}`);
        });
        console.log('');
      }
    } catch (err) {
      // Ignore if tables don't exist or query fails
    }

    console.log('✅ Database connection test PASSED! 🎉\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Database connection test FAILED!\n');
    console.error('Error Details:');
    console.error(`   Code: ${error.code || 'N/A'}`);
    console.error(`   Message: ${error.message}`);
    
    if (error.code === 'ENOTFOUND') {
      console.error('\n💡 Tip: Check if host is correct (hostname not found)');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Tip: Check if port is correct or if the database server is running');
    } else if (error.code === '28P01' || error.message.includes('password')) {
      console.error('\n💡 Tip: Check if username and password are correct');
    } else if (error.code === '3D000' || error.message.includes('database')) {
      console.error('\n💡 Tip: Check if database name is correct (database does not exist)');
    } else if (error.message.includes('SSL') || error.code === '08006') {
      console.error('\n💡 Tip: SSL connection issue - try setting DB_SSL_REJECT_UNAUTHORIZED=false in .env');
    }
    
    console.error('');
    process.exit(1);
  } finally {
    // Release the client back to the pool
    if (client) {
      client.release();
    }
    // Close the pool
    await testPool.end();
  }
}

// Run the test
testConnection();
