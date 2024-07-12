import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { PUBLISH_QUEUE_NAME } from '@common/queue';
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
      },
      noAck: false,
      prefetchCount: 10,
    },
  });

  app.enableShutdownHooks();

  await app.listen();
}

bootstrap().then();
