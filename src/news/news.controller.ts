import { MessagePattern, Payload } from '@nestjs/microservices';
import { PublishService } from './publish.service';
import { Controller } from '@nestjs/common';
import { FeedEntity } from '@common/db';
import { DeepPartial } from 'typeorm';

@Controller()
export class NewsController {
  constructor(private readonly publishNewsService: PublishService) {}

  @MessagePattern('publish-feed')
  async publishFeed(@Payload() data: any) {
    const feed = data as DeepPartial<FeedEntity>;
    await this.publishNewsService.publishFeed(feed);
  }
}
