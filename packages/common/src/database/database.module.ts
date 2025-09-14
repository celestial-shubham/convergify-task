// AI: NestJS Database Module (Claude assisted)
import { Module, Global } from '@nestjs/common';
import { 
  createDatabasePool,
  DATABASE_POOL,
  USER_DAO,
  CHAT_DAO,
  MESSAGE_DAO
} from './database.provider';
import { UserDAO } from './dao/user.dao';
import { ChatDAO } from './dao/chat.dao';
import { MessageDAO } from './dao/message.dao';

@Global()
@Module({
  providers: [
    // Database pool provider
    {
      provide: DATABASE_POOL,
      useFactory: createDatabasePool,
    },
    // DAO providers
    {
      provide: USER_DAO,
      useClass: UserDAO,
    },
    {
      provide: CHAT_DAO,
      useClass: ChatDAO,
    },
    {
      provide: MESSAGE_DAO,
      useClass: MessageDAO,
    },
  ],
  exports: [
    DATABASE_POOL,
    USER_DAO,
    CHAT_DAO,
    MESSAGE_DAO,
  ],
})
export class DatabaseModule {}