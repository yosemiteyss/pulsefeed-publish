import { PublishFeedModule } from './publish-feed/publish-feed.module';
import { ConfigModule } from '@common/config/config.module';
import { LoggerModule } from '@common/logger';
import { Module } from '@nestjs/common';

@Module({
  imports: [ConfigModule, LoggerModule.forRoot({ appName: 'pf-publish' }), PublishFeedModule],
})
export class AppModule {}
