// AI: Database connection test script (Claude assisted)
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://chatuser:chatpass@localhost:5432/chatapp';

async function testConnection() {
  console.log('🔄 Testing PostgreSQL connection...');
  console.log(`   URL: ${DATABASE_URL}`);
  
  const pool = new Pool({
    connectionString: DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 5000,
    connectionTimeoutMillis: 3000,
  });

  try {
    // Test basic connection
    const result = await pool.query('SELECT NOW() as current_time, version()');
    console.log('✅ Connection successful!');
    console.log(`   Current time: ${result.rows[0].current_time}`);
    console.log(`   Version: ${result.rows[0].version.split(' ')[0]}`);

    // Test our tables exist
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'chats', 'chat_participants', 'messages')
      ORDER BY table_name
    `);
    
    console.log('✅ Database schema check:');
    const expectedTables = ['chats', 'chat_participants', 'messages', 'users'];
    const foundTables = tablesResult.rows.map(row => row.table_name);
    
    expectedTables.forEach(table => {
      if (foundTables.includes(table)) {
        console.log(`   ✓ ${table} table exists`);
      } else {
        console.log(`   ✗ ${table} table missing`);
      }
    });

    // Test sample data
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    const messageCount = await pool.query('SELECT COUNT(*) FROM messages');
    console.log(`✅ Sample data: ${userCount.rows[0].count} users, ${messageCount.rows[0].count} messages`);

  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }

  console.log('🎉 Database connection test completed successfully!');
}

testConnection();