import { ConfigModule, LoggerModule } from '@pulsefeed/common';
import { PublishFeedModule } from './publish-feed';
import { Module } from '@nestjs/common';

@Module({
  imports: [ConfigModule, LoggerModule.forRootAsync(), PublishFeedModule],
})
export class AppModule {}
