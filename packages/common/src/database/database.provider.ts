// AI: PostgreSQL connection pool provider (Claude assisted)
import { Pool, PoolClient } from 'pg';

export const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://chatuser:chatpass@postgres:5432/chatapp';

/**
 * Creates and configures PostgreSQL connection pool
 */
export async function createDatabasePool(): Promise<Pool> {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    max: 20, // maximum pool size
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
  
  // Test connection
  try {
    const result = await pool.query('SELECT NOW() as current_time, version()');
    console.log('✅ Database connected successfully');
    console.log(`   Time: ${result.rows[0].current_time}`);
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
  
  return pool;
}

/**
 * Transaction helper for ACID operations
 * Automatically handles BEGIN/COMMIT/ROLLBACK
 */
export async function withTransaction<T>(
  pool: Pool, 
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Provider tokens for NestJS DI
export const DATABASE_POOL = 'DATABASE_POOL';
export const USER_DAO = 'USER_DAO';
export const CHAT_DAO = 'CHAT_DAO'; 
export const MESSAGE_DAO = 'MESSAGE_DAO';