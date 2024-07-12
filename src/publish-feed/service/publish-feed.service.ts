import { FeedRepository } from '../repository/feed.repository';
import { RmqContext } from '@nestjs/microservices';
import { LoggerService } from '@common/logger';
import { PublishFeedDto } from '@common/dto';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PublishFeedService {
  constructor(
    private readonly feedRepository: FeedRepository,
    private readonly logger: LoggerService,
  ) {}

  async publishFeed(data: any, context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMessage = context.getMessage();

    const dto: PublishFeedDto = JSON.parse(data);

    try {
      const insertedArticles = await this.feedRepository.create(dto.feed);

      this.logger.log(
        PublishFeedService.name,
        `Published articles count: ${insertedArticles.length}, feed ${dto.feed.link}`,
      );

      channel.ack(originalMessage);
    } catch (err) {
      this.logger.error(PublishFeedService.name, `Failed to publish feed: ${dto.feed?.link}`, err);
      channel.nack(originalMessage, false, false);
    }
  }
}
