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

  async publishFeed(feed: DeepPartial<FeedEntity>) {
    try {
      const created = this.feedsRepository.create(feed);
      const inserted = await this.feedsRepository.save(created);

      const itemsCount = inserted.items?.length ?? 0;

      this.logger.log(PublishService.name, `Published news: ${itemsCount}, feed ${inserted.link}`);
    } catch (err) {
      this.logger.error(PublishService.name, `Failed to publish news, feed: ${feed.link}`, err);
    }
  }
}
