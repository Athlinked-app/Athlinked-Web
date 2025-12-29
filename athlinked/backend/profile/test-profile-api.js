/**
 * Test script for Profile API
 * Run with: node profile/test-profile-api.js
 *
 * This will test the profile API endpoints to verify they work correctly
 */

const pool = require('./config/db');
const { v4: uuidv4 } = require('uuid');

async function testProfileAPI() {
  console.log('=== Testing Profile API ===\n');

  // Test 1: Check if table exists
  console.log('1. Checking if user_profiles table exists...');
  try {
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles'
      )
    `);
    const tableExists = tableCheck.rows[0].exists;
    console.log(`   Table exists: ${tableExists}`);

    if (!tableExists) {
      console.log('\n❌ ERROR: user_profiles table does not exist!');
      console.log('   Please create it using the SQL in verify-table.sql\n');
      return;
    }
  } catch (error) {
    console.error('   Error checking table:', error.message);
    return;
  }

  // Test 2: Check table structure
  console.log('\n2. Checking table structure...');
  try {
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'user_profiles'
      ORDER BY ordinal_position
    `);
    console.log('   Columns:');
    columns.rows.forEach(col => {
      console.log(
        `     - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`
      );
    });
  } catch (error) {
    console.error('   Error checking structure:', error.message);
  }

  // Test 3: Check for unique constraint on user_id
  console.log('\n3. Checking constraints...');
  try {
    const constraints = await pool.query(`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'user_profiles'
    `);
    console.log('   Constraints:');
    constraints.rows.forEach(constraint => {
      console.log(
        `     - ${constraint.constraint_name} (${constraint.constraint_type})`
      );
    });

    const hasUniqueUserId = constraints.rows.some(
      c =>
        c.constraint_type === 'UNIQUE' && c.constraint_name.includes('user_id')
    );
    if (!hasUniqueUserId) {
      console.log('   ⚠️  WARNING: No UNIQUE constraint on user_id found!');
    }
  } catch (error) {
    console.error('   Error checking constraints:', error.message);
  }

  // Test 4: Get a test user ID
  console.log('\n4. Getting a test user ID...');
  let testUserId;
  try {
    const userResult = await pool.query('SELECT id FROM users LIMIT 1');
    if (userResult.rows.length === 0) {
      console.log('   ⚠️  No users found in database');
      console.log('   Using a test UUID for testing...');
      testUserId = uuidv4();
    } else {
      testUserId = userResult.rows[0].id;
      console.log(`   Using user ID: ${testUserId}`);
    }
  } catch (error) {
    console.error('   Error getting user:', error.message);
    testUserId = uuidv4();
    console.log(`   Using generated UUID: ${testUserId}`);
  }

  // Test 5: Test INSERT
  console.log('\n5. Testing INSERT...');
  try {
    const testId = uuidv4();
    const insertQuery = `
      INSERT INTO user_profiles (
        id, user_id, bio, education, primary_sport, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        bio = EXCLUDED.bio,
        education = EXCLUDED.education,
        primary_sport = EXCLUDED.primary_sport,
        updated_at = NOW()
      RETURNING *
    `;
    const result = await pool.query(insertQuery, [
      testId,
      testUserId,
      'Test bio',
      'Test University',
      'Basketball',
    ]);
    console.log('   ✅ INSERT successful');
    console.log('   Inserted row:', result.rows[0]);
  } catch (error) {
    console.error('   ❌ INSERT failed:', error.message);
    console.error('   Error code:', error.code);
    console.error('   Error detail:', error.detail);
  }

  // Test 6: Test SELECT
  console.log('\n6. Testing SELECT...');
  try {
    const selectResult = await pool.query(
      'SELECT * FROM user_profiles WHERE user_id = $1',
      [testUserId]
    );
    console.log(
      `   ✅ SELECT successful (found ${selectResult.rows.length} rows)`
    );
    if (selectResult.rows.length > 0) {
      console.log('   Sample row:', selectResult.rows[0]);
    }
  } catch (error) {
    console.error('   ❌ SELECT failed:', error.message);
  }

  // Test 7: Count all rows
  console.log('\n7. Counting all rows in user_profiles...');
  try {
    const countResult = await pool.query(
      'SELECT COUNT(*) as count FROM user_profiles'
    );
    console.log(`   Total rows in table: ${countResult.rows[0].count}`);
  } catch (error) {
    console.error('   Error counting rows:', error.message);
  }

  console.log('\n=== Test Complete ===\n');
  process.exit(0);
}

testProfileAPI().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
