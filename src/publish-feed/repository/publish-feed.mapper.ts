import { Article, ArticleCategoryEnum, LanguageEnum, PrismaClient } from '@pulsefeed/common';

export class PublishFeedMapper {
  /**
   * Convert article model to prisma create input.
   * @param model the article model.
   * @returns prisma create input
   * @private
   */
  articleModelToCreateInput(model: Article): PrismaClient.Prisma.ArticleCreateManyInput {
    return {
      id: model.id,
      title: model.title,
      link: model.link,
      description: model.description,
      image: model.image,
      keywords: model.keywords,
      publishedAt: model.publishedAt,
      sourceId: model.sourceId,
      categoryKey: model.category,
    };
  }

  /**
   * Convert article entity
   * @param entity the article entity.
   * @param languages the languages of the article.
   * @returns article model
   * @private
   */
  articleEntityToModel(entity: PrismaClient.Article, languages: LanguageEnum[]): Article {
    return {
      id: entity.id,
      title: entity.title,
      link: entity.link,
      description: entity.description ?? undefined,
      image: entity.image ?? undefined,
      keywords: entity.keywords,
      createdAt: entity.createdAt,
      publishedAt: entity.publishedAt ?? undefined,
      category: entity.categoryKey as ArticleCategoryEnum,
      sourceId: entity.sourceId,
      languages: languages,
    };
  }
}
