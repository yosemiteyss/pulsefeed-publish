import { PublishFeedController } from './controller/publish-feed.controller';
import { PublishFeedService } from './service/publish-feed.service';
import { SaveFeedsService } from './service/save-feeds.service';
import { DatabaseModule } from '@common/db';
import { Module } from '@nestjs/common';

@Module({
  imports: [DatabaseModule],
  controllers: [PublishFeedController],
  providers: [PublishFeedService, SaveFeedsService],
})
export class PublishFeedModule {}
