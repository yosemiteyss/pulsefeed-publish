import { Article, ArticleCategoryEnum, LanguageEnum } from '@pulsefeed/common';
import { Article as ArticleEntity, Prisma } from '@prisma/client';

export class ArticleMapper {
  /**
   * Convert article model to prisma create input.
   * @param model the article model.
   */
  articleModelToCreateInput(model: Article): Prisma.ArticleCreateManyInput {
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
      isPublished: false,
    };
  }

  /**
   * Convert article entity to model.
   * @param entity the article entity.
   * @param languages the languages of the article.
   */
  articleEntityToModel(entity: ArticleEntity, languages: LanguageEnum[]): Article {
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

  /**
   * Convert article payload to model.
   * @param entity the article payload.
   */
  articlePayloadToModel(
    entity: Prisma.ArticleGetPayload<{
      include: {
        languages: true;
      };
    }>,
  ): Article {
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
      languages: entity.languages.map((language) => language.languageKey as LanguageEnum),
    };
  }
}
