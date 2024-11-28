import { PublishFeedModule } from './publish-feed/publish-feed.module';
import { ConfigModule, LoggerModule } from '@pulsefeed/common';
import { Module } from '@nestjs/common';

@Module({
  imports: [ConfigModule, LoggerModule, PublishFeedModule],
})
export class AppModule {}
