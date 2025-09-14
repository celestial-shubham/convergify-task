// AI: Chat Service Bootstrap (Claude assisted)
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  // Use port from environment or default
  const port = process.env.PORT || 3002;
  
  await app.listen(port);
  
  console.log(`🚀 Chat Service running on: http://localhost:${port}`);
  console.log(`📊 GraphQL Playground: http://localhost:${port}/graphql`);
  console.log(`🔔 Subscriptions enabled via WebSocket`);
}

bootstrap().catch((error) => {
  console.error('Failed to start Chat Service:', error);
  process.exit(1);
});