import { PublishKeywordsController } from './controller';
import { RepositoryModule } from '@pulsefeed/common';
import { PublishKeywordsService } from './service';
import { ArticleRepository } from '../shared';
import { TrendingModule } from '../trending';
import { Module } from '@nestjs/common';

@Module({
  imports: [TrendingModule, RepositoryModule],
  controllers: [PublishKeywordsController],
  providers: [PublishKeywordsService, ArticleRepository],
})
export class PublishKeywordsModule {}
