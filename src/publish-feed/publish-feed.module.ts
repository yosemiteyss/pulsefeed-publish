import {
  PUBLISH_KEYWORDS_MSG_TTL,
  PUBLISH_KEYWORDS_QUEUE,
  RepositoryModule,
  RMQ_CLIENT,
} from '@pulsefeed/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PublishFeedController } from './controller';
import { ConfigService } from '@nestjs/config';
import { PublishFeedService } from './service';
import { ArticleRepository } from '../shared';
import { TrendingModule } from '../trending';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    TrendingModule,
    RepositoryModule,
    ClientsModule.registerAsync([
      {
        name: RMQ_CLIENT,
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL')!],
            queue: PUBLISH_KEYWORDS_QUEUE,
            queueOptions: {
              durable: false,
              arguments: {
                'x-message-ttl': PUBLISH_KEYWORDS_MSG_TTL,
              },
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [PublishFeedController],
  providers: [ArticleRepository, PublishFeedService],
})
export class PublishFeedModule {}
