import { PublishFeedService, PublishFeedTaskService } from './service';
import { CacheModule, DatabaseModule } from '@pulsefeed/common';
import { PublishFeedController } from './controller';
import { ArticleRepository } from '../shared';
import { TrendingModule } from '../trending';
import { Module } from '@nestjs/common';

@Module({
  imports: [DatabaseModule, CacheModule, TrendingModule],
  controllers: [PublishFeedController],
  providers: [ArticleRepository, PublishFeedService, PublishFeedTaskService],
})
export class PublishFeedModule {}
