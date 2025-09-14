// AI: Chat GraphQL Resolver with subscriptions (Claude assisted)
import { Resolver, Query, Mutation, Subscription, Args, ID, Int } from '@nestjs/graphql';
import { ParseIntPipe } from '@nestjs/common';
import { ChatService } from './chat.service';
import { MessageType } from './chat.types';
import { SendMessageInput } from './dto/send-message.input';

@Resolver(() => MessageType)
export class ChatResolver {
  constructor(private readonly chatService: ChatService) {}
  @Mutation(() => MessageType, { 
    description: 'Send a message to a chat (with real-time distribution)' 
  })
  async sendMessage(
    @Args('input') input: SendMessageInput,
  ): Promise<MessageType> {
    return this.chatService.sendMessage(input);
  }

  @Mutation(() => Boolean, { 
    description: 'Join user to General Chat automatically' 
  })
  async joinGeneralChat(
    @Args('userId', { type: () => ID }) userId: string,
  ): Promise<boolean> {
    return this.chatService.joinGeneralChat(userId);
  }

  /**
   * Get chat history query
   */
  @Query(() => [MessageType], { 
    description: 'Get chat message history with pagination' 
  })
  async chatHistory(
    @Args('chatId', { type: () => ID }) chatId: string,
    @Args('limit', { type: () => Int, defaultValue: 50 }, ParseIntPipe) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }, ParseIntPipe) offset: number,
  ): Promise<MessageType[]> {
    return this.chatService.getChatHistory(chatId, limit, offset);
  }

  /**
   * Real-time message subscription - THE KEY FEATURE
   */
  @Subscription(() => MessageType, {
    description: 'Subscribe to new messages in a specific chat',
    resolve: (payload) => payload.messageAdded, // Extract message from Redis payload
  })
  messageAdded(
    @Args('chatId', { type: () => ID }) chatId: string,
  ) {
    console.log(`🔔 New subscription for chat: ${chatId}`);
    return this.chatService.messageAddedAsyncIterator(chatId);
  }
}