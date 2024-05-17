import { RmqContext } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { LoggerService } from '@common/logger';
import { Injectable } from '@nestjs/common';
import { FeedEntity } from '@common/db';

@Injectable()
export class PublishService {
  constructor(
    @InjectRepository(FeedEntity) private readonly feedsRepository: Repository<FeedEntity>,
    private readonly logger: LoggerService,
  ) {}

  async publishFeed(data: any, context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMessage = context.getMessage();

    let feed: DeepPartial<FeedEntity>;

    try {
      feed = JSON.parse(data);

      const created = this.feedsRepository.create(feed);
      const inserted = await this.feedsRepository.save(created);
      const itemsCount = inserted.items?.length ?? 0;

      this.logger.log(PublishService.name, `Published news: ${itemsCount}, feed ${inserted.link}`);
      channel.ack(originalMessage); // Acknowledge message after processing
    } catch (err) {
      this.logger.error(PublishService.name, `Failed to publish news, feed: ${feed.link}`, err);
      channel.nack(originalMessage);
    }
  }
}
