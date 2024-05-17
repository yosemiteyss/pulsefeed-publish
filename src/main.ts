import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://admin:123456@localhost:5672'],
      queue: 'pf-publish-queue',
      queueOptions: {
        durable: false,
      },
    },
  });
  await app.listen();
}

bootstrap().then();
