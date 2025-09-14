// AI: Send message input DTO (Claude assisted)
import { InputType, Field, ID } from '@nestjs/graphql';
import { IsString, IsUUID, Length } from 'class-validator';

@InputType()
export class SendMessageInput {
  @Field(() => ID, { description: 'Chat UUID' })
  @IsUUID(4, { message: 'Chat ID must be a valid UUID' })
  chatId!: string;

  @Field(() => ID, { description: 'Sender UUID' })
  @IsUUID(4, { message: 'Sender ID must be a valid UUID' })
  senderId!: string;

  @Field({ description: 'Message content (1-1000 characters)' })
  @IsString()
  @Length(1, 1000, { message: 'Message content must be 1-1000 characters' })
  content!: string;
}