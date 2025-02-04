import {
  PUBLISH_FEED_MSG_TTL,
  PUBLISH_FEED_QUEUE,
  PUBLISH_KEYWORDS_MSG_TTL,
  PUBLISH_KEYWORDS_QUEUE,
} from '@pulsefeed/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL!],
      queue: PUBLISH_FEED_QUEUE,
      queueOptions: {
        durable: false,
        arguments: {
          'x-message-ttl': PUBLISH_FEED_MSG_TTL,
        },
      },
      noAck: false,
      prefetchCount: 3,
    },
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL!],
      queue: PUBLISH_KEYWORDS_QUEUE,
      queueOptions: {
        durable: false,
        arguments: {
          'x-message-ttl': PUBLISH_KEYWORDS_MSG_TTL,
        },
      },
      noAck: false,
      prefetchCount: 1,
    },
  });

  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  app.enableShutdownHooks();

  await app.startAllMicroservices();
}

bootstrap().then();
