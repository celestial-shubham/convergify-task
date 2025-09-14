// AI: Chat Service Main Module (Claude assisted)
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { DatabaseModule } from '@chat-app/common';
import { ChatModule } from './chat/chat.module';
import { join } from 'path';

@Module({
  imports: [
    // Database connection with DAOs
    DatabaseModule,

    // GraphQL with subscriptions
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      playground: true,
      introspection: true,
      sortSchema: true,
      
      // Use built-in Date scalar
      
      // Enable subscriptions
      subscriptions: {
        'graphql-ws': true,
      },
      
      context: ({ req, res }: { req: any; res: any }) => ({ req, res }),
      formatError: (error: any) => {
        console.error('GraphQL Error:', error);
        return {
          message: error.message,
          code: error.extensions?.code,
          path: error.path,
        };
      },
    }),

    // Feature modules
    ChatModule,
  ],
})
export class AppModule {}