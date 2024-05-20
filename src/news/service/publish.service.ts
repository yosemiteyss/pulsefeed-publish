import { FeedsRepository } from '../../repository/feeds.repository';
import { RmqContext } from '@nestjs/microservices';
import { LoggerService } from '@common/logger';
import { Injectable } from '@nestjs/common';
import { FeedEntity } from '@common/db';
import { DeepPartial } from 'typeorm';

@Injectable()
export class PublishService {
  constructor(
    private readonly feedsRepository: FeedsRepository,
    private readonly logger: LoggerService,
  ) {}

  async publishFeed(data: any, context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMessage = context.getMessage();

    let feed: DeepPartial<FeedEntity>;

    try {
      feed = JSON.parse(data);

      const insertedNews = await this.feedsRepository.upsert(feed);
      this.logger.log(
        PublishService.name,
        `Published news: ${insertedNews.length}, feed ${feed.link}`,
      );

      channel.ack(originalMessage);
    } catch (err) {
      this.logger.error(PublishService.name, `Failed to publish news, feed: ${feed?.link}`, err);
      channel.nack(originalMessage, false, false);
    }
  }
}
