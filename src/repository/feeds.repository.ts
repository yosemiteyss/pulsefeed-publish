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

      await manager
        .createQueryBuilder()
        .insert()
        .into('feeds_news')
        .values(
          feed.items.map((news) => ({
            feedId: feed.id,
            newsId: news.id,
          })),
        )
        .execute();

      return await manager
        .getRepository(FeedEntity)
        .findOne({ relations: { items: true }, where: { id: feed.id } });
    });
  }
}
