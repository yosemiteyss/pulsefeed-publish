import { Ctx, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import { PUBLISH_FEED_PATTERN, PublishFeedDto } from '@pulsefeed/common';
import { PublishFeedService } from '../service';
import { Controller } from '@nestjs/common';

@Controller()
export class PublishFeedController {
  constructor(private readonly publishFeedService: PublishFeedService) {}

  /**
   * Consume publish feed events.
   * @param event the event received.
   * @param context the rmq context.
   */
  @MessagePattern(PUBLISH_FEED_PATTERN)
  async publishFeed(@Payload() event: PublishFeedDto, @Ctx() context: RmqContext) {
    await this.publishFeedService.publishFeed(event, context);
  }
}
