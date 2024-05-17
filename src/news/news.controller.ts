import { Ctx, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import { PublishService } from './publish.service';
import { Controller } from '@nestjs/common';
import { FeedEntity } from '@common/db';
import { DeepPartial } from 'typeorm';

@Controller()
export class NewsController {
  constructor(private readonly publishNewsService: PublishService) {}

  @MessagePattern('publish-feed')
  async publishFeed(@Payload() data: any, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMessage = context.getMessage();

    try {
      const feed: DeepPartial<FeedEntity> = JSON.parse(data);
      await this.publishNewsService.publishFeed(feed);
      channel.ack(originalMessage); // Acknowledge message after processing
    } catch (err) {
      channel.nack(originalMessage);
    }
  }
}
