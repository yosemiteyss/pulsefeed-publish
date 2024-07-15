import { PublishFeedController } from './publish-feed.controller';
import { PublishFeedService } from './publish-feed.service';
import { FeedRepository } from './feed.repository';
import { DatabaseModule } from '@common/db';
import { Module } from '@nestjs/common';

@Module({
  imports: [DatabaseModule],
  controllers: [PublishFeedController],
  providers: [PublishFeedService, FeedRepository],
})
export class PublishFeedModule {}
