const { Pool } = require('pg');
require('dotenv').config();

async function testConnection() {
  console.log('\n🔍 Testing Database Connection...\n');
  console.log('📋 Connection Details:');
  console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`   Port: ${process.env.DB_PORT || 5432}`);
  console.log(`   Database: ${process.env.DB_NAME || 'athlinked'}`);
  console.log(`   User: ${process.env.DB_USER || 'postgres'}`);
  console.log(`   SSL: ${process.env.DB_SSL || 'false'}`);
  console.log(`   SSL Reject Unauthorized: ${process.env.DB_SSL_REJECT_UNAUTHORIZED || 'true'}`);
  console.log('');

  // Create a test pool with longer timeout for cloud databases
  const sslConfig = process.env.DB_SSL === 'true' || process.env.DB_SSL === '1' 
    ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
    : false;

  const testPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'athlinked',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
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
      console.error('\n💡 Tip: Check if DB_HOST is correct (hostname not found)');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Tip: Check if DB_PORT is correct or if the database server is running');
    } else if (error.code === '28P01' || error.message.includes('password')) {
      console.error('\n💡 Tip: Check if DB_USER and DB_PASSWORD are correct');
    } else if (error.code === '3D000' || error.message.includes('database')) {
      console.error('\n💡 Tip: Check if DB_NAME is correct (database does not exist)');
    } else if (error.message.includes('SSL') || error.code === '08006') {
      console.error('\n💡 Tip: SSL connection issue - try setting DB_SSL_REJECT_UNAUTHORIZED=false');
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
