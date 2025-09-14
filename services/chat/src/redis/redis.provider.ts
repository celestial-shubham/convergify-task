// AI: Redis pub/sub provider (Claude assisted)
import { OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { PubSub } from 'graphql-subscriptions';

export const REDIS_PUB_CLIENT = 'REDIS_PUB_CLIENT';
export const REDIS_SUB_CLIENT = 'REDIS_SUB_CLIENT';
export const PUB_SUB_SERVICE = 'PUB_SUB_SERVICE';

export class RedisPubSub extends PubSub implements OnModuleDestroy {
  private publisherClient: Redis;
  private subscriberClient: Redis;
  private isReady: boolean = false;

  constructor() {
    super();
    console.log('🔧 Initializing Redis PubSub...');
    
    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    };

    console.log('📡 Connecting to Redis:', redisConfig);

    // Separate clients for pub/sub (Redis best practice)
    this.publisherClient = new Redis(redisConfig);
    this.subscriberClient = new Redis(redisConfig);
    
    // Test connections
    this.publisherClient.on('connect', () => {
      console.log('✅ Redis Publisher connected');
      this.checkReady();
    });
    
    this.subscriberClient.on('connect', () => {
      console.log('✅ Redis Subscriber connected');
      this.checkReady();
    });

    this.publisherClient.on('error', (err: any) => {
      console.error('❌ Redis Publisher error:', err);
      this.isReady = false;
    });
    
    this.subscriberClient.on('error', (err: any) => {
      console.error('❌ Redis Subscriber error:', err);
      this.isReady = false;
    });

    this.publisherClient.on('ready', () => {
      console.log('🔥 Redis Publisher ready');
      this.checkReady();
    });
    
    this.subscriberClient.on('ready', () => {
      console.log('🔥 Redis Subscriber ready');
      this.checkReady();
    });
  }

  private checkReady() {
    const pubReady = this.publisherClient.status === 'ready';
    const subReady = this.subscriberClient.status === 'ready';
    
    if (pubReady && subReady && !this.isReady) {
      this.isReady = true;
      console.log('🎉 Redis PubSub fully initialized!');
    }
  }

  // Override publish to use Redis
  async publish(triggerName: string, payload: any): Promise<void> {
    await this.publisherClient.publish(triggerName, JSON.stringify(payload));
  }

  // Override subscribe to use Redis
  subscribe(triggerName: string, onMessage: Function): Promise<number> {
    return new Promise((resolve, reject) => {
      this.subscriberClient.subscribe(triggerName, (err: any, count: any) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(count || 0);
      });

      this.subscriberClient.on('message', (channel: any, message: any) => {
        if (channel === triggerName) {
          try {
            const payload = JSON.parse(message);
            onMessage(payload);
          } catch (error) {
            console.error('Error parsing Redis message:', error);
          }
        }
      });
    });
  }

  // Override asyncIterator for GraphQL subscriptions
  asyncIterator<T>(triggers: string | string[]): AsyncIterator<T> {
    console.log('🔄 Creating async iterator for triggers:', triggers);
    
    if (!this.subscriberClient) {
      console.error('❌ Subscriber client is not initialized!');
      throw new Error('Redis subscriber client not initialized');
    }

    const triggerNames = typeof triggers === 'string' ? [triggers] : triggers;
    const pubSubInstance = this; // Capture the RedisPubSub instance
    let isListening = false;
    const eventQueue: T[] = [];
    let resolveNext: ((result: IteratorResult<T>) => void) | null = null;
    
    const messageHandler = (channel: string, message: string) => {
      console.log(`📨 Redis message received on channel: ${channel}`);
      if (triggerNames.includes(channel)) {
        try {
          const payload = JSON.parse(message);
          console.log('📦 Parsed payload for iterator:', payload);
          
          if (resolveNext) {
            resolveNext({ value: payload, done: false });
            resolveNext = null;
          } else {
            eventQueue.push(payload);
          }
        } catch (error) {
          console.error('Error parsing Redis message:', error);
        }
      }
    };

    const iterator: AsyncIterator<T> = {
      async next(): Promise<IteratorResult<T>> {
        console.log('🔄 AsyncIterator.next() called, isListening:', isListening);
        
        // Wait for Redis to be ready
        if (!pubSubInstance.isReady) {
          console.log('⏳ Waiting for Redis to be ready...');
          await new Promise((resolve) => {
            const checkReady = () => {
              if (pubSubInstance.isReady) {
                resolve(undefined);
              } else {
                setTimeout(checkReady, 100);
              }
            };
            checkReady();
          });
        }

        // Set up subscription if not already done
        if (!isListening) {
          console.log('🎯 Setting up Redis subscription...');
          isListening = true;
          
          pubSubInstance.subscriberClient.on('message', messageHandler);
          
          // Subscribe to all triggers
          for (const trigger of triggerNames) {
            await pubSubInstance.subscriberClient.subscribe(trigger);
            console.log(`🔔 Subscribed to Redis channel: ${trigger}`);
          }
        }

        // Return queued message if available
        if (eventQueue.length > 0) {
          const message = eventQueue.shift()!;
          console.log('📤 Returning queued message:', message);
          return { value: message, done: false };
        }

        // Wait for next message
        console.log('⏳ Waiting for next Redis message...');
        return new Promise((resolve) => {
          resolveNext = resolve;
        });
      },
      
      async return(): Promise<IteratorResult<T>> {
        console.log('🛑 AsyncIterator cleanup requested');
        if (isListening && pubSubInstance.subscriberClient) {
          pubSubInstance.subscriberClient.off('message', messageHandler);
          for (const trigger of triggerNames) {
            await pubSubInstance.subscriberClient.unsubscribe(trigger);
            console.log(`❌ Unsubscribed from Redis channel: ${trigger}`);
          }
          isListening = false;
        }
        return { value: undefined as any, done: true };
      },
      
      async throw(error: any): Promise<IteratorResult<T>> {
        console.error('💥 AsyncIterator error:', error);
        throw error;
      }
    };

    // Add the Symbol.asyncIterator method
    (iterator as any)[Symbol.asyncIterator] = function() {
      return this;
    };

    return iterator;
  }

  async onModuleDestroy() {
    await this.publisherClient.quit();
    await this.subscriberClient.quit();
    console.log('📡 Redis connections closed');
  }
}

// Factory function for NestJS
export const createRedisPubSub = (): RedisPubSub => {
  return new RedisPubSub();
};