import { Article, ArticleCategoryEnum, Feed } from '@common/model';
import { Article as ArticleEntity, Prisma } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/db';

@Injectable()
export class FeedRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(feed: Feed): Promise<Article[]> {
    return this.prismaService.$transaction(async (tx) => {
      // Insert feeds.
      const feedInput = this.feedModelToCreateInput(feed);
      await tx.feed.upsert({
        where: {
          id: feedInput.id,
        },
        create: feedInput,
        update: {
          title: feedInput.title,
          description: feedInput.description,
          link: feedInput.link,
        },
      });

      // Insert articles.
      const articleInputs = feed.items.map((article) => this.articleModelToCreateInput(article));
      const insertedArticles = await tx.article.createManyAndReturn({
        data: articleInputs,
        skipDuplicates: true,
      });

      return insertedArticles.map((article) => this.articleEntityToModel(article));
    });
  }

  private feedModelToCreateInput(model: Feed): Prisma.FeedCreateInput {
    return {
      id: model.id,
      title: model.title,
      description: model.description,
      link: model.link,
      source: {
        connect: {
          id: model.sourceId,
        },
      },
    };
  }

  private articleModelToCreateInput(model: Article): Prisma.ArticleCreateManyInput {
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

  private articleEntityToModel(entity: ArticleEntity): Article {
    return {
      id: entity.id,
      title: entity.title,
      link: entity.link,
      description: entity.description ?? undefined,
      image: entity.image ?? undefined,
      keywords: entity.keywords,
      publishedAt: entity.publishedAt ?? undefined,
      category: entity.categoryKey as ArticleCategoryEnum,
      sourceId: entity.sourceId,
    };
  }
}
