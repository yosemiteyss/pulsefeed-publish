import { Ctx, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import { PATTERN_PUBLISH_FEED } from '@pulsefeed/common';
import { PublishFeedService } from '../service';
import { Controller } from '@nestjs/common';

@Controller()
export class PublishFeedController {
  constructor(private readonly publishFeedService: PublishFeedService) {}

  /**
   * Handle the publishing of feed.
   * @param data the feed data received.
   * @param context rmq context for the message.
   */
  @MessagePattern(PATTERN_PUBLISH_FEED)
  async publishFeed(@Payload() data: string, @Ctx() context: RmqContext) {
    await this.publishFeedService.publishFeed(data, context);
  }
}
