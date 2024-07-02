import { PublishFeedController } from './controller/publish-feed.controller';
import { PublishFeedService } from './service/publish-feed.service';
import { FeedRepository } from './repository/feed.repository';
import { DatabaseModule } from '@common/db';
import { Module } from '@nestjs/common';

@Module({
  imports: [DatabaseModule],
  controllers: [PublishFeedController],
  providers: [PublishFeedService, FeedRepository],
})
export class PublishFeedModule {}
