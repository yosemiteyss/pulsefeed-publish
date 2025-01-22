import { GenerateKeywordsService, TrendingKeywordsService } from './service';
import { Module } from '@nestjs/common';

@Module({
  providers: [GenerateKeywordsService, TrendingKeywordsService],
  exports: [GenerateKeywordsService, TrendingKeywordsService],
})
export class TrendingModule {}
