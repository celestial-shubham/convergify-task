import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { DatabaseModule } from '@chat-app/common';
import { UserModule } from './user/user.module';
import { join } from 'path';

@Module({
  imports: [
    // Database connection with DAOs
    DatabaseModule,

    // GraphQL configuration
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      playground: true,
      introspection: true,
      sortSchema: true,
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
    UserModule,
  ],
})
export class AppModule {}