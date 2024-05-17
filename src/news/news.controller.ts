import { Ctx, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import { PublishService } from './publish.service';
import { Controller } from '@nestjs/common';

@Controller()
export class NewsController {
  constructor(private readonly publishNewsService: PublishService) {}

  @MessagePattern('publish-feed')
  async publishFeed(@Payload() data: any, @Ctx() context: RmqContext) {
    await this.publishNewsService.publishFeed(data, context);
  }
}
