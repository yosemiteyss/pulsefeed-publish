import { ConfigModule, LoggerModule } from '@pulsefeed/common';
import { PublishFeedModule } from './publish-feed';
import { Module } from '@nestjs/common';

@Module({
  imports: [ConfigModule, LoggerModule, PublishFeedModule],
})
export class AppModule {}
