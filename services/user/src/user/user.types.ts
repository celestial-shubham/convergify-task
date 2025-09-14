// AI: GraphQL User types (Claude assisted)
import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType('User')
export class UserType {
  @Field(() => ID, { description: 'User UUID for external API' })
  id!: string;

  @Field({ description: 'Unique username' })
  username!: string;

  @Field({ nullable: true, description: 'User email address' })
  email?: string;

  @Field({ description: 'Account creation timestamp (ISO string)' })
  createdAt!: string;

  @Field({ nullable: true, description: 'Last activity timestamp (ISO string)' })
  lastSeen?: string;

  @Field({ description: 'Account active status' })
  isActive!: boolean;
}