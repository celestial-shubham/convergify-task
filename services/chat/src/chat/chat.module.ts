// AI: Chat Module (Claude assisted)
import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatResolver } from './chat.resolver';
import { RedisPubSub, PUB_SUB_SERVICE, createRedisPubSub } from '../redis/redis.provider';

@Module({
  providers: [
    ChatService,
    ChatResolver,
    {
      provide: PUB_SUB_SERVICE,
      useFactory: createRedisPubSub,
    },
  ],
  exports: [ChatService],
})
export class ChatModule {}