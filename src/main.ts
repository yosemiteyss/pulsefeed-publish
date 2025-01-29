import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { PUBLISH_QUEUE_NAME } from '@pulsefeed/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL!],
      queue: PUBLISH_QUEUE_NAME,
      queueOptions: {
        durable: false,
        arguments: {
          'x-message-ttl': 7200000, // 2 hours
        },
      },
      noAck: false,
      prefetchCount: 3,
    },
  });
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  app.enableShutdownHooks();

  await app.listen();
}

bootstrap().then();
