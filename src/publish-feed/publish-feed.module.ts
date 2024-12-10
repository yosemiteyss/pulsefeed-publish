import { PublishFeedController } from './publish-feed.controller';
import { PublishFeedRepository } from './publish-feed.repository';
import { PublishFeedService } from './publish-feed.service';
import { DatabaseModule } from '@pulsefeed/common';
import { Module } from '@nestjs/common';

@Module({
  imports: [DatabaseModule],
  controllers: [PublishFeedController],
  providers: [PublishFeedService, PublishFeedRepository],
})
export class PublishFeedModule {}
