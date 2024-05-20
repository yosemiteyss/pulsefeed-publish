import { FeedEntity, NewsEntity } from '@common/db';
import { DataSource, DeepPartial } from 'typeorm';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FeedsRepository {
  constructor(private readonly dataSource: DataSource) {}

  async upsert(feed: DeepPartial<FeedEntity>): Promise<FeedEntity> {
    return await this.dataSource.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .insert()
        .into(FeedEntity)
        .values(feed)
        .orUpdate(['title', 'description'], ['id'], { skipUpdateIfNoValuesChanged: true })
        .execute();

      await manager
        .createQueryBuilder()
        .insert()
        .into(NewsEntity)
        .values(feed.items)
        .orIgnore() // Ignore conflict records
        .execute();

      const insertedFeed = await manager.findOne(FeedEntity, {
        relations: { items: true },
        where: { id: feed.id },
      });

      const relations = insertedFeed.items.map((news) => ({
        feedId: feed.id,
        newsId: news.id,
      }));

      await manager
        .createQueryBuilder()
        .insert()
        .into('feeds_news')
        .values(relations)
        .orIgnore()
        .execute();

      return insertedFeed;
    });
  }
}
