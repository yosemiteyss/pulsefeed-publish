import { ArticleEntity, FeedEntity, TBL_FEEDS_ARTICLES } from '@common/db';
import { DataSource, EntityManager, In } from 'typeorm';
import { Article, Feed } from '@common/model';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FeedRepository {
  constructor(private readonly dataSource: DataSource) {}

  async create(feed: Feed): Promise<ArticleEntity[]> {
    return await this.dataSource.transaction(async (entityManager) => {
      const articles = await this.insertArticles(entityManager, feed.items);
      await this.insertFeedArticleRelation(entityManager, feed.id, articles);

      await this.insertFeed(entityManager, feed);

      return articles;
    });
  }

  private async insertArticles(
    entityManager: EntityManager,
    articles: Article[],
  ): Promise<ArticleEntity[]> {
    const { raw } = await entityManager
      .createQueryBuilder()
      .insert()
      .into(ArticleEntity)
      .values(articles)
      .orIgnore() // Ignore conflict records
      .returning('id')
      .execute();

    if (!raw || raw.length === 0) {
      return [];
    }

    const articleIds: string[] = raw.map((r) => r.id);
    return await entityManager.find(ArticleEntity, {
      where: {
        id: In(articleIds),
      },
    });
  }

  private async insertFeed(entityManager: EntityManager, feed: Feed) {
    await entityManager
      .createQueryBuilder()
      .insert()
      .into(FeedEntity)
      .values(feed)
      .orUpdate(['title', 'description'], ['id'], { skipUpdateIfNoValuesChanged: true })
      .execute();
  }

  private async insertFeedArticleRelation(
    entityManager: EntityManager,
    feedId: string,
    articles: ArticleEntity[],
  ) {
    const relations = articles.map(({ id }) => ({
      feedId,
      articleId: id,
    }));

    await entityManager
      .createQueryBuilder()
      .insert()
      .into(TBL_FEEDS_ARTICLES)
      .values(relations)
      .orIgnore()
      .execute();
  }
}
