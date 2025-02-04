import { Ctx, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import { PublishArticleKeywordsDto } from '../../publish-feed';
import { PUBLISH_KEYWORDS_PATTERN } from '@pulsefeed/common';
import { PublishKeywordsService } from '../service';
import { Controller } from '@nestjs/common';

@Controller()
export class PublishKeywordsController {
  constructor(private readonly publishKeywordsService: PublishKeywordsService) {}

  /**
   * Consume publish keywords events.
   * @param event the event received.
   * @param context the rmq context.
   */
  @MessagePattern(PUBLISH_KEYWORDS_PATTERN)
  async publishKeywords(@Payload() event: PublishArticleKeywordsDto, @Ctx() context: RmqContext) {
    await this.publishKeywordsService.publishKeywords(event, context);
  }
}
