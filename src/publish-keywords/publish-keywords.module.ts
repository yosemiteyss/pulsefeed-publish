import { PublishKeywordsController } from './controller';
import { PublishKeywordsService } from './service';
import { ArticleRepository } from '../shared';
import { TrendingModule } from '../trending';
import { Module } from '@nestjs/common';

@Module({
  imports: [TrendingModule],
  controllers: [PublishKeywordsController],
  providers: [ArticleRepository, PublishKeywordsService],
})
export class PublishKeywordsModule {}
