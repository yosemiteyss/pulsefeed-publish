import { CacheModule, DatabaseModule } from '@pulsefeed/common';
import { PublishFeedController } from './controller';
import { PublishFeedService } from './service';
import { ArticleRepository } from '../shared';
import { TrendingModule } from '../trending';
import { Module } from '@nestjs/common';

@Module({
  imports: [DatabaseModule, CacheModule, TrendingModule],
  controllers: [PublishFeedController],
  providers: [PublishFeedService, ArticleRepository],
})
export class PublishFeedModule {}
