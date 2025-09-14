// AI: GraphQL input types (Claude assisted)
import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsEmail, IsOptional, Length, Matches } from 'class-validator';

@InputType()
export class CreateUserInput {
  @Field({ description: 'Username (3-50 characters, alphanumeric + underscore)' })
  @IsString()
  @Length(3, 50, { message: 'Username must be 3-50 characters long' })
  @Matches(/^[a-zA-Z0-9_]+$/, { 
    message: 'Username can only contain letters, numbers, and underscores' 
  })
  username!: string;

  @Field({ nullable: true, description: 'Email address (optional)' })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Length(5, 100, { message: 'Email must be 5-100 characters long' })
  email?: string;
}