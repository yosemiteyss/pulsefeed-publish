import { PublishFeedModule } from './publish-feed/publish-feed.module';
import { ConfigModule, LoggerModule } from '@pulsefeed/common';
import { Module } from '@nestjs/common';

@Module({
  imports: [ConfigModule, LoggerModule.forRoot({ appName: 'pf-publish' }), PublishFeedModule],
})
export class AppModule {}
