import { PublishFeedController } from './publish-feed.controller';
import { CacheModule, DatabaseModule } from '@pulsefeed/common';
import { PublishFeedRepository } from './repository';
import { PublishFeedService } from './service';
import { Module } from '@nestjs/common';

@Module({
  imports: [DatabaseModule, CacheModule],
  controllers: [PublishFeedController],
  providers: [PublishFeedService, PublishFeedRepository],
})
export class PublishFeedModule {}
