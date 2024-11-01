import { PATTERN_PUBLISH_FEED, PATTERN_PUBLISH_KEYWORDS } from '@pulsefeed/common';
import { Ctx, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import { PublishFeedService } from './publish-feed.service';
import { Controller } from '@nestjs/common';

@Controller()
export class PublishFeedController {
  constructor(private readonly publishFeedService: PublishFeedService) {}

  @MessagePattern(PATTERN_PUBLISH_FEED)
  async publishFeed(@Payload() data: any, @Ctx() context: RmqContext) {
    await this.publishFeedService.publishFeed(data, context);
  }

  @MessagePattern(PATTERN_PUBLISH_KEYWORDS)
  async publishKeywords(@Payload() data: any, @Ctx() context: RmqContext) {
    await this.publishFeedService.publishKeywords(data, context);
  }
}
