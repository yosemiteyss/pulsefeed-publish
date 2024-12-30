import { Article, Feed, FeedRepository, LanguageEnum } from '@pulsefeed/common';
import { ArticleMapper } from './article.mapper';
import { Injectable } from '@nestjs/common';
import * as R from 'ramda';

@Injectable()
export class ArticleRepository extends FeedRepository {
  private readonly articleMapper = new ArticleMapper();

  /**
   * Insert feed and article records to db.
   * @param feed the feed.
   * @param articles the articles of the feed.
   * @returns array of inserted article.
   */
  async create(feed: Feed, articles: Article[]): Promise<Article[]> {
    const insertedFeed = await this.upsert(feed);
    return this.prismaService.$transaction(
      async (tx) => {
        // Insert articles.
        const articleInput = articles.map((article) =>
          this.articleMapper.articleModelToCreateInput(article),
        );
        const articleResult = await tx.article.createManyAndReturn({
          data: articleInput,
          skipDuplicates: true,
        });
        const articleIds = articleResult.map((article) => article.id);

        // Insert feed-article relations.
        const feedArticleRelations: { feedId: string; articleId: string }[] = [];
        for (const articleId of articleIds) {
          feedArticleRelations.push({
            feedId: insertedFeed.id,
            articleId: articleId,
          });
        }
        await tx.articlesOnFeeds.createMany({
          data: feedArticleRelations,
          skipDuplicates: true,
        });

        // Insert article-languages relations.
        const articleLangRelations: { articleId: string; languageKey: string }[] = [];
        for (const article of articles) {
          if (articleIds.includes(article.id)) {
            for (const language of article.languages) {
              articleLangRelations.push({
                articleId: article.id,
                languageKey: language,
              });
            }
          }
        }
        await tx.languagesOnArticles.createMany({
          data: articleLangRelations,
          skipDuplicates: true,
        });

        // Create article-languages map.
        const articleLangGrouped = R.groupBy((item) => item.articleId, articleLangRelations);

        return articleResult.map((article) => {
          const languages = articleLangGrouped[article.id]!.map(
            ({ languageKey }) => languageKey as LanguageEnum,
          );
          return this.articleMapper.articleEntityToModel(article, languages);
        });
      },
      {
        maxWait: 5000,
        timeout: 10000,
      },
    );
  }

  /**
   * Update article keywords.
   * @param articleId the article id.
   * @param keywords the generated keywords.
   */
  async updateKeywords(articleId: string, keywords: string[]) {
    await this.prismaService.article.update({
      where: {
        id: articleId,
      },
      data: {
        keywords: keywords,
      },
    });
  }

  /**
   * Mark articles as published.
   * @param articles the article list.
   */
  async publish(articles: Article[]) {
    const articleIds = articles.map((article) => article.id);
    await this.prismaService.article.updateMany({
      where: {
        id: {
          in: articleIds,
        },
      },
      data: {
        isPublished: true,
      },
    });
  }
}
