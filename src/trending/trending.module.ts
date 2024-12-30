import { GenerateKeywordsService, TrendingKeywordsService } from './service';
import { CacheModule } from '@pulsefeed/common';
import { Module } from '@nestjs/common';

@Module({
  imports: [CacheModule],
  providers: [GenerateKeywordsService, TrendingKeywordsService],
  exports: [GenerateKeywordsService, TrendingKeywordsService],
})
export class TrendingModule {}
