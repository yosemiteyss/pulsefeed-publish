import {
  Article,
  ArticleCategoryEnum,
  CacheService,
  Feed,
  LanguageEnum,
  PrismaService,
} from '@pulsefeed/common';
import { Article as ArticleEntity, Feed as FeedEntity } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { ArticleRepository } from '../article.repository';
import { Test, TestingModule } from '@nestjs/testing';

describe('ArticleRepository', () => {
  let articleRepository: ArticleRepository;
  let prismaService: DeepMockProxy<PrismaService>;
  let cacheService: DeepMockProxy<CacheService>;

  const mockedFeedEntity: FeedEntity = {
    id: 'id',
    title: 'title',
    link: 'link',
    description: 'description',
    sourceId: 'sourceId',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };
  const mockedArticleEntity: ArticleEntity = {
    id: 'id',
    title: 'title',
    link: 'link',
    description: 'description',
    sourceId: 'sourceId',
    image: 'image',
    keywords: ['keyword-1', 'keyword-2'],
    publishedAt: new Date(),
    categoryKey: ArticleCategoryEnum.HEALTH,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    isPublished: false,
  };

  const feed: Feed = {
    id: mockedFeedEntity.id,
    title: mockedFeedEntity.title,
    link: mockedFeedEntity.link,
    sourceId: mockedFeedEntity.sourceId,
  };
  const article: Article = {
    id: mockedArticleEntity.id,
    title: mockedArticleEntity.title,
    link: mockedArticleEntity.link,
    description: mockedArticleEntity.description!,
    image: mockedArticleEntity.image!,
    keywords: mockedArticleEntity.keywords,
    createdAt: mockedArticleEntity.createdAt,
    publishedAt: mockedArticleEntity.publishedAt!,
    category: ArticleCategoryEnum.HEALTH,
    sourceId: mockedArticleEntity.sourceId,
    languages: [LanguageEnum.en_us, LanguageEnum.en_hk],
  };

  beforeEach(async () => {
    prismaService = mockDeep<PrismaService>();
    cacheService = mockDeep<CacheService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticleRepository,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
        {
          provide: CacheService,
          useValue: cacheService,
        },
      ],
    }).compile();

    articleRepository = module.get<ArticleRepository>(ArticleRepository);
  });

  describe('publishFeed', () => {
    it('should correctly publish a feed and its articles to the database', async () => {
      prismaService.article.createManyAndReturn.mockResolvedValue([mockedArticleEntity]);
      prismaService.articlesOnFeeds.createMany.mockResolvedValue({ count: 1 });
      prismaService.languagesOnArticles.createMany.mockResolvedValue({ count: 1 });
      prismaService.$transaction.mockImplementation(async (callback: any) =>
        callback(prismaService),
      );

      const articles = [article];
      const result = await articleRepository.create(feed, articles);

      expect(prismaService.$transaction).toHaveBeenCalled();
      expect(prismaService.article.createManyAndReturn).toHaveBeenCalledWith({
        data: expect.arrayContaining([expect.objectContaining({ id: articles[0].id })]),
        skipDuplicates: true,
      });
      expect(prismaService.articlesOnFeeds.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            feedId: feed.id,
            articleId: articles[0].id,
          }),
        ]),
        skipDuplicates: true,
      });
      expect(prismaService.languagesOnArticles.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          {
            articleId: articles[0].id,
            languageKey: articles[0].languages[0],
          },
          {
            articleId: articles[0].id,
            languageKey: articles[0].languages[1],
          },
        ]),
        skipDuplicates: true,
      });
      expect(result).toEqual(articles);
    });
  });

  describe('updateKeywords', () => {
    it('should update article keywords', async () => {
      const articleId = '1';
      const keywords = ['keyword-1', 'keyword-2'];

      await articleRepository.updateKeywords(articleId, keywords);
      expect(prismaService.article.update).toHaveBeenCalledWith({
        where: {
          id: articleId,
        },
        data: {
          keywords: keywords,
        },
      });
    });
  });

  describe('publish', () => {
    it('should update articles isPublished flag to true', async () => {
      const articleIds = [article.id];
      await articleRepository.publish([article]);

      expect(prismaService.article.updateMany).toHaveBeenCalledWith({
        where: {
          id: {
            in: articleIds,
          },
        },
        data: {
          isPublished: true,
        },
      });
    });
  });
});
