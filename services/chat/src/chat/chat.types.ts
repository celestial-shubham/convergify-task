// AI: GraphQL Chat and Message types (Claude assisted)
import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType('Message')
export class MessageType {
  @Field(() => ID, { description: 'Message UUID' })
  id!: string;

  @Field(() => ID, { description: 'Chat UUID' })
  chatId!: string;

  @Field(() => ID, { description: 'Sender UUID' })
  senderId!: string;

  @Field({ description: 'Message content' })
  content!: string;

  @Field({ description: 'Message creation time (ISO string)' })
  createdAt!: string;

  // Optional fields from JOIN queries
  @Field({ nullable: true, description: 'Sender username' })
  senderUsername?: string;

  @Field({ nullable: true, description: 'Chat name' })
  chatName?: string;
}

@ObjectType('Chat')
export class ChatType {
  @Field(() => ID, { description: 'Chat UUID' })
  id!: string;

  @Field({ nullable: true, description: 'Chat name' })
  name?: string;

  @Field({ description: 'Is group chat' })
  isGroup!: boolean;

  @Field({ description: 'Creation timestamp (ISO string)' })
  createdAt!: string;
}