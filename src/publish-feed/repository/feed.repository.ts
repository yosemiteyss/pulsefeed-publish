import {
  ArticleEntity,
  FeedEntity,
  LanguageEntity,
  TBL_FEEDS_ARTICLES,
  TBL_LANGUAGES_ARTICLES,
} from '@common/db';
import { DataSource, EntityManager, In } from 'typeorm';
import { Article, Feed } from '@common/model';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FeedRepository {
  constructor(private readonly dataSource: DataSource) {}

  async create(feed: Feed): Promise<ArticleEntity[]> {
    return await this.dataSource.transaction(async (entityManager) => {
      await this.insertFeed(entityManager, feed);

      const articles = await this.insertArticles(entityManager, feed.items);
      await this.insertFeedArticleRelation(entityManager, feed.id, articles);

      await this.insertArticleLangRelation(entityManager, articles);

      return articles;
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

  /**
   * Returns inserted article ids.
   */
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

  private async insertArticleLangRelation(entityManager: EntityManager, articles: ArticleEntity[]) {
    const relations = [];
    for (const article of articles) {
      for (const language of article.languages as LanguageEntity[]) {
        relations.push({
          languageKey: language.key,
          articleId: article.id,
        });
      }
    }

    await entityManager
      .createQueryBuilder()
      .insert()
      .into(TBL_LANGUAGES_ARTICLES)
      .values(relations)
      .orIgnore()
      .execute();
  }
}
