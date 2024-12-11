import { Article, Feed, FeedRepository, LanguageEnum } from '@pulsefeed/common';
import { PublishFeedMapper } from './publish-feed.mapper';
import { Injectable } from '@nestjs/common';
import * as R from 'ramda';

@Injectable()
export class PublishFeedRepository extends FeedRepository {
  private readonly publishFeedMapper = new PublishFeedMapper();

  /**
   * Publish feed and the associated articles to db.
   * @param feed the feed.
   * @param articles the articles of the feed.
   * @returns array of inserted article.
   */
  async publishFeed(feed: Feed, articles: Article[]): Promise<Article[]> {
    const insertedFeed = await this.upsert(feed);
    return this.prismaService.$transaction(
      async (tx) => {
        // Insert articles.
        const articleInput = articles.map((article) =>
          this.publishFeedMapper.articleModelToCreateInput(article),
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
          return this.publishFeedMapper.articleEntityToModel(article, languages);
        });
      },
      {
        maxWait: 5000,
        timeout: 10000,
      },
    );
  }

  /**
   * Update nlp keywords of article.
   * @param articleId the id of the article.
   * @param keywordsNlp array of nlp keywords
   */
  async updateArticleNlpKeywords(articleId: string, keywordsNlp: string[]) {
    await this.prismaService.article.update({
      where: {
        id: articleId,
      },
      data: {
        keywordsNlp: keywordsNlp,
      },
    });
  }
}
