import { Ctx, MessagePattern, Payload, RmqContext } from "@nestjs/microservices";
import { PublishService } from "../service/publish.service";
import { PATTERN_PUBLISH_FEED } from "@common/queue";
import { Controller } from "@nestjs/common";

@Controller()
export class NewsController {
  constructor(private readonly publishNewsService: PublishService) {}

  @MessagePattern(PATTERN_PUBLISH_FEED)
  async publishFeed(@Payload() data: any, @Ctx() context: RmqContext) {
    await this.publishNewsService.publishFeed(data, context);
  }
}
