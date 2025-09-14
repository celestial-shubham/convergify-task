import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UserService } from './user.service';
import { UserType } from './user.types';
import { CreateUserInput } from './dto/create-user.input';

@Resolver(() => UserType)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  /**
   * Create new user
   */
  @Mutation(() => UserType, { 
    description: 'Create a new user account',
    name: 'createUser'
  })
  async createUser(
    @Args('input') createUserInput: CreateUserInput,
  ): Promise<UserType> {
    return this.userService.createUser(createUserInput);
  }

  /**
   * Get user by ID
   */
  @Query(() => UserType, { 
    nullable: true,
    description: 'Get user by UUID',
    name: 'user'
  })
  async getUser(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<UserType> {
    return this.userService.getUser(id);
  }

  /**
   * Get user by username
   */
  @Query(() => UserType, { 
    nullable: true,
    description: 'Find user by username',
    name: 'userByUsername' 
  })
  async getUserByUsername(
    @Args('username') username: string,
  ): Promise<UserType | null> {
    return this.userService.getUserByUsername(username);
  }
}