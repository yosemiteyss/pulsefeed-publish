import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL],
      queue: process.env.RABBITMQ_PUBLISH_QUEUE,
      queueOptions: {
        durable: false,
      },
      noAck: false,
      prefetchCount: 10,
    },
  });
  await app.listen();
}

bootstrap().then();
