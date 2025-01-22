import { PublishFeedService, PublishFeedTaskService } from './service';
import { PublishFeedController } from './controller';
import { FeedRepository } from '@pulsefeed/common';
import { ArticleRepository } from '../shared';
import { TrendingModule } from '../trending';
import { Module } from '@nestjs/common';

@Module({
  imports: [TrendingModule],
  controllers: [PublishFeedController],
  providers: [FeedRepository, ArticleRepository, PublishFeedService, PublishFeedTaskService],
})
export class PublishFeedModule {}
