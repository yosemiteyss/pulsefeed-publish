import { CacheModule, ConfigModule, DatabaseModule, LoggerModule } from '@pulsefeed/common';
import { PublishFeedModule } from './publish-feed';
import { TrendingModule } from './trending';
import { Module } from '@nestjs/common';

@Module({
  imports: [DatabaseModule, CacheModule, ConfigModule, LoggerModule.forRootAsync()],
})
class CoreModule {}

@Module({
  imports: [CoreModule, PublishFeedModule, TrendingModule],
})
export class AppModule {}
