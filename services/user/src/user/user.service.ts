// AI: User Service business logic (Claude assisted)
import { Injectable, Inject, ConflictException, NotFoundException } from '@nestjs/common';
import { UserDAO, USER_DAO } from '@chat-app/common';
import { CreateUserInput } from './dto/create-user.input';
import { UserType } from './user.types';

@Injectable()
export class UserService {
  constructor(@Inject(USER_DAO) private readonly userDAO: UserDAO) {}

  /**
   * Create new user with validation
   */
  async createUser(createUserInput: CreateUserInput): Promise<UserType> {
    const { username, email } = createUserInput;

    // Check if username already exists
    const existingUser = await this.userDAO.getUserByUsername(username);
    if (existingUser) {
      throw new ConflictException(`Username '${username}' is already taken`);
    }

    // Check if email already exists (if provided)
    if (email) {
      // Note: We'd need to add getUserByEmail method to DAO for full email validation
      // For now, relying on database UNIQUE constraint
    }

    try {
      const user = await this.userDAO.createUser(username, email);
      
      // Convert to GraphQL type (UUID for external ID)
      return {
        id: user.uuid,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        lastSeen: user.lastSeen,
        isActive: user.isActive,
      };
    } catch (error: any) {
      if (error.code === '23505') { // PostgreSQL unique constraint violation
        if (error.constraint?.includes('username')) {
          throw new ConflictException(`Username '${username}' is already taken`);
        }
        if (error.constraint?.includes('email')) {
          throw new ConflictException(`Email '${email}' is already registered`);
        }
      }
      throw error;
    }
  }

  /**
   * Get user by UUID
   */
  async getUser(id: string): Promise<UserType> {
    const user = await this.userDAO.getUserByUUID(id);
    
    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    return {
      id: user.uuid,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      lastSeen: user.lastSeen,
      isActive: user.isActive,
    };
  }

  /**
   * Get user by username
   */
  async getUserByUsername(username: string): Promise<UserType | null> {
    const user = await this.userDAO.getUserByUsername(username);
    
    if (!user) {
      return null;
    }

    return {
      id: user.uuid,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      lastSeen: user.lastSeen,
      isActive: user.isActive,
    };
  }

  /**
   * Update user's last seen timestamp
   */
  async updateLastSeen(id: string): Promise<void> {
    await this.userDAO.updateLastSeen(id);
  }
}