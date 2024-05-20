import { DataSource, DeepPartial, In } from 'typeorm';
import { FeedEntity, NewsEntity } from '@common/db';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FeedsRepository {
  constructor(private readonly dataSource: DataSource) {}

  async upsert(feed: DeepPartial<FeedEntity>): Promise<NewsEntity[]> {
    return await this.dataSource.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .insert()
        .into(FeedEntity)
        .values(feed)
        .orUpdate(['title', 'description'], ['id'], { skipUpdateIfNoValuesChanged: true })
        .execute();

      const insertedNewsResult = await manager
        .createQueryBuilder()
        .insert()
        .into(NewsEntity)
        .values(feed.items)
        .orIgnore() // Ignore conflict records
        .returning('id')
        .execute();

      const insertNewsIds: string[] = insertedNewsResult.raw.map((raw) => raw.id);
      const insertedNews = await manager.find(NewsEntity, {
        where: {
          id: In(insertNewsIds),
        },
      });

      const relations = insertedNews.map((news) => ({
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

      return insertedNews;
    });
  }
}
