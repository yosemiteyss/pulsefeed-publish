import { ConfigModule, LoggerModule } from '@pulsefeed/common';
import { PublishFeedModule } from './publish-feed';
import { TrendingModule } from './trending';
import { Module } from '@nestjs/common';

@Module({
  imports: [ConfigModule, LoggerModule.forRootAsync(), PublishFeedModule, TrendingModule],
})
export class AppModule {}
