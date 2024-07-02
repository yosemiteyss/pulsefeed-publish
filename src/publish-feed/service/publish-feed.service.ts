import { FeedRepository } from '../repository/feed.repository';
import { RmqContext } from '@nestjs/microservices';
import { LoggerService } from '@common/logger';
import { Injectable } from '@nestjs/common';
import { Feed } from '@common/model';

@Injectable()
export class PublishFeedService {
  constructor(
    private readonly feedRepository: FeedRepository,
    private readonly logger: LoggerService,
  ) {}

  async publishFeed(data: any, context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMessage = context.getMessage();

    let feed: Feed;

    try {
      feed = JSON.parse(data);

      const insertedArticles = await this.feedRepository.create(feed);

      this.logger.log(
        PublishFeedService.name,
        `Published articles count: ${insertedArticles.length}, feed ${feed.link}`,
      );

      channel.ack(originalMessage);
    } catch (err) {
      this.logger.error(PublishFeedService.name, `Failed to publish feed: ${feed?.link}`, err);
      channel.nack(originalMessage, false, false);
    }
  }
}
