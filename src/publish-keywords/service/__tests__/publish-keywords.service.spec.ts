import { GenerateKeywordsService, TrendingKeywordsService } from '../../../trending';
import { Article, ArticleCategoryEnum, LanguageEnum } from '@pulsefeed/common';
import { PublishKeywordsService } from '../publish-keywords.service';
import { PublishArticleKeywordsDto } from '../../../publish-feed';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Test, TestingModule } from '@nestjs/testing';
import { ArticleRepository } from '../../../shared';
import { RmqContext } from '@nestjs/microservices';
import { ConsumeMessage, Channel } from 'amqplib';
import { LoggerService } from '@nestjs/common';
import OpenAI from 'openai';

describe('PublishKeywordsService', () => {
  let publishKeywordsService: PublishKeywordsService;
  let context: DeepMockProxy<RmqContext>;
  let articleRepository: DeepMockProxy<ArticleRepository>;
  let loggerService: DeepMockProxy<LoggerService>;
  let trendingKeywordsService: DeepMockProxy<TrendingKeywordsService>;
  let generateKeywordsService: DeepMockProxy<GenerateKeywordsService>;
  let channel: DeepMockProxy<Channel>;
  let consumeMessage: DeepMockProxy<ConsumeMessage>;

  beforeEach(async () => {
    articleRepository = mockDeep<ArticleRepository>();
    context = mockDeep<RmqContext>();
    loggerService = mockDeep<LoggerService>();
    trendingKeywordsService = mockDeep<TrendingKeywordsService>();
    generateKeywordsService = mockDeep<GenerateKeywordsService>();
    channel = mockDeep<Channel>();
    consumeMessage = mockDeep<ConsumeMessage>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublishKeywordsService,
        {
          provide: ArticleRepository,
          useValue: articleRepository,
        },
        {
          provide: WINSTON_MODULE_NEST_PROVIDER,
          useValue: loggerService,
        },
        {
          provide: TrendingKeywordsService,
          useValue: trendingKeywordsService,
        },
        {
          provide: GenerateKeywordsService,
          useValue: generateKeywordsService,
        },
      ],
    }).compile();

    publishKeywordsService = module.get(PublishKeywordsService);

    context.getChannelRef.mockReturnValue(channel);
    context.getMessage.mockReturnValue(consumeMessage);
  });

  describe('publishKeywords', () => {
    it('should nack when the requested article is not found', async () => {
      articleRepository.getArticle.mockResolvedValue(undefined);

      const event: PublishArticleKeywordsDto = {
        id: 'id',
        title: 'title',
      };
      await publishKeywordsService.publishKeywords(event, context);

      expect(channel.nack).toHaveBeenCalledWith(consumeMessage, false, false);
    });

    it('should generate keywords, save keywords to db, and increment keyword rankings', async () => {
      const event: PublishArticleKeywordsDto = {
        id: 'id',
        title: 'title',
      };
      const article: Article = {
        id: event.id,
        title: event.title,
        link: 'link',
        category: ArticleCategoryEnum.LOCAL,
        sourceId: 'sourceId',
        languages: [LanguageEnum.en_us],
      };

      articleRepository.getArticle.mockResolvedValue(article);
      generateKeywordsService.generateArticleKeywords.mockResolvedValue({
        articleId: article.id,
        keywords: ['keyword-1', 'keyword-2'],
      });

      await publishKeywordsService.publishKeywords(event, context);

      expect(articleRepository.updateKeywords).toHaveBeenCalled();
      expect(trendingKeywordsService.incrementKeyword).toHaveBeenCalled();
      expect(channel.ack).toHaveBeenCalled();
    });

    it('should nack when generate keywords failed', async () => {
      const event: PublishArticleKeywordsDto = {
        id: 'id',
        title: 'title',
      };
      const article: Article = {
        id: event.id,
        title: event.title,
        link: 'link',
        category: ArticleCategoryEnum.LOCAL,
        sourceId: 'sourceId',
        languages: [LanguageEnum.en_us],
      };

      articleRepository.getArticle.mockResolvedValue(article);
      generateKeywordsService.generateArticleKeywords.mockRejectedValue(
        new Error('Generate error'),
      );

      await publishKeywordsService.publishKeywords(event, context);

      expect(channel.nack).toHaveBeenCalledWith(consumeMessage, false, false);
    });

    it('should nack and requeue when generate keywords failed with openai error 429', async () => {
      const event: PublishArticleKeywordsDto = {
        id: 'id',
        title: 'title',
      };
      const article: Article = {
        id: event.id,
        title: event.title,
        link: 'link',
        category: ArticleCategoryEnum.LOCAL,
        sourceId: 'sourceId',
        languages: [LanguageEnum.en_us],
      };

      articleRepository.getArticle.mockResolvedValue(article);
      generateKeywordsService.generateArticleKeywords.mockRejectedValue(
        new OpenAI.APIError(429, new Error(), undefined, undefined),
      );
      consumeMessage.fields.redelivered = false;

      await publishKeywordsService.publishKeywords(event, context);

      expect(channel.nack).toHaveBeenCalledWith(consumeMessage, false, true);
    });

    it('should nack and not requeue when generate keywords failed with openai error 429 after requeue once', async () => {
      const event: PublishArticleKeywordsDto = {
        id: 'id',
        title: 'title',
      };
      const article: Article = {
        id: event.id,
        title: event.title,
        link: 'link',
        category: ArticleCategoryEnum.LOCAL,
        sourceId: 'sourceId',
        languages: [LanguageEnum.en_us],
      };

      articleRepository.getArticle.mockResolvedValue(article);
      generateKeywordsService.generateArticleKeywords.mockRejectedValue(
        new OpenAI.APIError(429, new Error(), undefined, undefined),
      );
      consumeMessage.fields.redelivered = true;

      await publishKeywordsService.publishKeywords(event, context);

      expect(channel.nack).toHaveBeenCalledWith(consumeMessage, false, false);
    });

    it('should nack when increment keywords failed', async () => {
      const event: PublishArticleKeywordsDto = {
        id: 'id',
        title: 'title',
      };
      const article: Article = {
        id: event.id,
        title: event.title,
        link: 'link',
        category: ArticleCategoryEnum.LOCAL,
        sourceId: 'sourceId',
        languages: [LanguageEnum.en_us],
      };

      articleRepository.getArticle.mockResolvedValue(article);
      generateKeywordsService.generateArticleKeywords.mockResolvedValue({
        articleId: article.id,
        keywords: ['keyword-1', 'keyword-2'],
      });
      trendingKeywordsService.incrementKeyword.mockRejectedValue(new Error('Increment error'));

      await publishKeywordsService.publishKeywords(event, context);

      expect(channel.nack).toHaveBeenCalledWith(consumeMessage, false, false);
    });
  });
});
