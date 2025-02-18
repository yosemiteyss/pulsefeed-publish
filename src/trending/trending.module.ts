import { GenerateKeywordsService, TrendingKeywordsService } from './service';
import { RepositoryModule } from '@pulsefeed/common';
import { ArticleRepository } from '../shared';
import { Module } from '@nestjs/common';

@Module({
  imports: [RepositoryModule],
  providers: [GenerateKeywordsService, TrendingKeywordsService, ArticleRepository],
  exports: [GenerateKeywordsService, TrendingKeywordsService],
})
export class TrendingModule {}
