// AI: User Data Access Object (Claude assisted)
import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../database.provider';
import { IUser } from '../../interface/user.interface';



@Injectable()
export class UserDAO {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  /**
   * Create new user
   */
  async createUser(username: string, email?: string): Promise<IUser> {
    const query = `
      INSERT INTO users (username, email) 
      VALUES ($1, $2) 
      RETURNING id, uuid, username, email, created_at, updated_at, last_seen, is_active
    `;
    
    const result = await this.pool.query(query, [username, email]);
    return this.mapRowToUser(result.rows[0]);
  }

  /**
   * Get user by UUID (for GraphQL queries)
   */
  async getUserByUUID(uuid: string): Promise<IUser | null> {
    const query = `
      SELECT id, uuid, username, email, created_at, updated_at, last_seen, is_active
      FROM users 
      WHERE uuid = $1 AND is_active = true
    `;
    
    const result = await this.pool.query(query, [uuid]);
    return result.rows.length > 0 ? this.mapRowToUser(result.rows[0]) : null;
  }

  /**
   * Get user by username
   */
  async getUserByUsername(username: string): Promise<IUser | null> {
    const query = `
      SELECT id, uuid, username, email, created_at, updated_at, last_seen, is_active
      FROM users 
      WHERE username = $1 AND is_active = true
    `;
    
    const result = await this.pool.query(query, [username]);
    return result.rows.length > 0 ? this.mapRowToUser(result.rows[0]) : null;
  }

  /**
   * Update user's last seen timestamp
   */
  async updateLastSeen(uuid: string): Promise<void> {
    const query = `
      UPDATE users 
      SET last_seen = NOW() 
      WHERE uuid = $1
    `;
    
    await this.pool.query(query, [uuid]);
  }

  /**
   * Map database row to User object
   */
  private mapRowToUser(row: any): IUser {
    return {
      id: row.id,
      uuid: row.uuid,
      username: row.username,
      email: row.email,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastSeen: row.last_seen,
      isActive: row.is_active,
    };
  }
}