import { CacheModule, ConfigModule, DatabaseModule, LoggerModule } from '@pulsefeed/common';
import { PublishKeywordsModule } from './publish-keywords';
import { PublishFeedModule } from './publish-feed';
import { Module } from '@nestjs/common';

@Module({
  imports: [DatabaseModule, CacheModule, ConfigModule, LoggerModule.forRootAsync()],
})
class CoreModule {}

@Module({
  imports: [CoreModule, PublishFeedModule, PublishKeywordsModule],
})
export class AppModule {}
