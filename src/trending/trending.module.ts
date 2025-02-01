import { GenerateKeywordsService, TrendingKeywordsService } from './service';
import { TrendingKeywordsRepository } from '@pulsefeed/common';
import { Module } from '@nestjs/common';

@Module({
  providers: [GenerateKeywordsService, TrendingKeywordsService, TrendingKeywordsRepository],
  exports: [GenerateKeywordsService, TrendingKeywordsService],
})
export class TrendingModule {}
