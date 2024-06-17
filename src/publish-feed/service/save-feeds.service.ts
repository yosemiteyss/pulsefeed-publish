import { ArticleEntity, FeedEntity, TBL_FEEDS_ARTICLES } from '@common/db';
import { DataSource, DeepPartial, In } from 'typeorm';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SaveFeedsService {
  constructor(private readonly dataSource: DataSource) {}

  async upsert(feed: DeepPartial<FeedEntity>): Promise<ArticleEntity[]> {
    return await this.dataSource.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .insert()
        .into(FeedEntity)
        .values(feed)
        .orUpdate(['title', 'description'], ['id'], { skipUpdateIfNoValuesChanged: true })
        .execute();

      const { raw } = await manager
        .createQueryBuilder()
        .insert()
        .into(ArticleEntity)
        .values(feed.items)
        .orIgnore() // Ignore conflict records
        .returning('id')
        .execute();

      // No news items inserted.
      if (!raw || raw.length === 0) {
        return [];
      }

      const articleIds: string[] = raw.map((r) => r.id);

      const insertedArticles = await manager.find(ArticleEntity, {
        where: {
          id: In(articleIds),
        },
      });

      const relations = insertedArticles.map((news) => ({
        feedId: feed.id,
        articleId: news.id,
      }));

      await manager
        .createQueryBuilder()
        .insert()
        .into(TBL_FEEDS_ARTICLES)
        .values(relations)
        .orIgnore()
        .execute();

      return insertedArticles;
    });
  }
}
