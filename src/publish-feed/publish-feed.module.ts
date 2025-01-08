import { CacheModule, DatabaseModule, FeedRepository } from '@pulsefeed/common';
import { PublishFeedService, PublishFeedTaskService } from './service';
import { PublishFeedController } from './controller';
import { ArticleRepository } from '../shared';
import { TrendingModule } from '../trending';
import { Module } from '@nestjs/common';

@Module({
  imports: [DatabaseModule, CacheModule, TrendingModule],
  controllers: [PublishFeedController],
  providers: [FeedRepository, ArticleRepository, PublishFeedService, PublishFeedTaskService],
})
export class PublishFeedModule {}
