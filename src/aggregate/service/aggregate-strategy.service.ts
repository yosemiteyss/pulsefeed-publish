import { NewsSource } from '../source/news.source';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { FeedEntity } from '@common/db/entity';
import { LoggerService } from '@common/logger';
import { Injectable } from '@nestjs/common';

export interface AggregateResult {
  readonly isSuccess: boolean;
  readonly feedsCount: number;
  readonly itemsCount: number;
  readonly errs: Error[];
}

@Injectable()
export class AggregateStrategyService {
  constructor(
    @InjectRepository(FeedEntity) private readonly feedsRepository: Repository<FeedEntity>,
    private readonly logger: LoggerService,
  ) {}

  async batchFetchSingleInsert(sourceList: NewsSource[]): Promise<AggregateResult> {
    let feedsCount = 0;
    let itemsCount = 0;
    let isSuccess = true;

    // Keep track of any error and save to db.
    const errs: Error[] = [];

    // Fetch feeds from all sources concurrently.
    const fetchPromises = sourceList.map((source) => source.getFetchFeedsPromises()).flat();
    const fetchResult = await Promise.all(fetchPromises);
    const feedResult: DeepPartial<FeedEntity>[] = [];

    // Extract successfully fetched feeds.
    for (const result of fetchResult) {
      if (result instanceof Error) {
        isSuccess = false;
        errs.push(result);
      } else {
        feedResult.push(result);
      }
    }

    // Insert feeds to db sequentially.
    for (const entity of feedResult) {
      const result = await this.insertFeed(entity);

      if (result instanceof Error) {
        isSuccess = false;
        errs.push(result);
      } else {
        feedsCount++;
        itemsCount += result.items?.length ?? 0;
      }
    }

    this.logger.log(
      AggregateStrategyService.name,
      `Inserted feeds: ${feedsCount}, news: ${itemsCount}`,
    );

    return { isSuccess, feedsCount, itemsCount, errs };
  }

  private async insertFeed(entity: DeepPartial<FeedEntity>): Promise<FeedEntity | Error> {
    try {
      const created = this.feedsRepository.create(entity);
      const inserted = await this.feedsRepository.save(created, {});

      const itemsCount = inserted.items?.length ?? 0;

      this.logger.log(
        AggregateStrategyService.name,
        `Inserted news: ${itemsCount}, for feed ${inserted.link}`,
      );

      return created;
    } catch (err) {
      this.logger.error(
        AggregateStrategyService.name,
        `Failed to insert feed, ${entity.link}`,
        err,
      );

      return err as Error;
    }
  }
}
