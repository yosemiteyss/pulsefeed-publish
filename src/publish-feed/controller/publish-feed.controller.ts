import { Ctx, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import { PublishFeedService } from '../service/publish-feed.service';
import { PATTERN_PUBLISH_FEED } from '@common/queue';
import { Controller } from '@nestjs/common';

@Controller()
export class PublishFeedController {
  constructor(private readonly publishFeedService: PublishFeedService) {}

  @MessagePattern(PATTERN_PUBLISH_FEED)
  async publishFeed(@Payload() data: any, @Ctx() context: RmqContext) {
    await this.publishFeedService.publishFeed(data, context);
  }
}
