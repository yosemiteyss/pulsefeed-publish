import {
  ArticleCategoryEnum,
  LanguageEnum,
  PublishFeedDto,
  RemoteConfigKey,
  RemoteConfigService,
} from '@pulsefeed/common';
import { GenerateKeywordsService, TrendingKeywordsService } from '../../../trending';
import { PublishFeedService } from '../publish-feed.service';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Test, TestingModule } from '@nestjs/testing';
import { ArticleRepository } from '../../../shared';
import { RmqContext } from '@nestjs/microservices';
import { LoggerService } from '@nestjs/common';
import { Prisma } from '@prisma/client';

describe('PublishFeedService', () => {
  let publishFeedService: PublishFeedService;
  let context: DeepMockProxy<RmqContext>;
  let logger: DeepMockProxy<LoggerService>;
  let articleRepository: DeepMockProxy<ArticleRepository>;
  let generateKeywordsService: DeepMockProxy<GenerateKeywordsService>;
  let trendingKeywordsService: DeepMockProxy<TrendingKeywordsService>;
  let remoteConfigService: DeepMockProxy<RemoteConfigService>;

  const mockedChannel = {
    ack: jest.fn(),
    nack: jest.fn(),
  };
  const mockedMessage: Record<string, any> = {};

  const mockedFeed: PublishFeedDto = {
    feed: {
      id: 'id',
      title: 'title',
      link: 'link',
      sourceId: 'sourceId',
    },
    articles: [
      {
        id: 'id',
        title: 'title',
        link: 'link',
        category: ArticleCategoryEnum.HEALTH,
        sourceId: 'sourceId',
        languages: [LanguageEnum.en_us],
      },
    ],
  };

  beforeEach(async () => {
    context = mockDeep<RmqContext>();
    logger = mockDeep<LoggerService>();
    articleRepository = mockDeep<ArticleRepository>();
    generateKeywordsService = mockDeep<GenerateKeywordsService>();
    trendingKeywordsService = mockDeep<TrendingKeywordsService>();
    remoteConfigService = mockDeep<RemoteConfigService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublishFeedService,
        {
          provide: WINSTON_MODULE_NEST_PROVIDER,
          useValue: logger,
        },
        {
          provide: ArticleRepository,
          useValue: articleRepository,
        },
        {
          provide: GenerateKeywordsService,
          useValue: generateKeywordsService,
        },
        {
          provide: TrendingKeywordsService,
          useValue: trendingKeywordsService,
        },
        {
          provide: RemoteConfigService,
          useValue: remoteConfigService,
        },
      ],
    }).compile();

    publishFeedService = module.get<PublishFeedService>(PublishFeedService);
  });

  describe('publishFeed', () => {
    it('should deserialize message to dto, and ack', async () => {
      context.getChannelRef.mockReturnValue(mockedChannel);
      context.getMessage.mockReturnValue(mockedMessage);
      articleRepository.create.mockResolvedValue(mockedFeed.articles);

      const json = JSON.stringify(mockedFeed);
      await publishFeedService.publishFeed(json, context);

      expect(articleRepository.create).toHaveBeenCalledWith(mockedFeed.feed, mockedFeed.articles);
      expect(mockedChannel.ack).toHaveBeenCalledWith(mockedMessage);
    });

    it('should nack for unknown error', async () => {
      context.getChannelRef.mockReturnValue(mockedChannel);
      context.getMessage.mockReturnValue(mockedMessage);
      articleRepository.create.mockImplementation(async () => {
        throw new Error('unknown error');
      });

      const json = JSON.stringify(mockedFeed);
      await publishFeedService.publishFeed(json, context);

      expect(mockedChannel.nack).toHaveBeenCalledWith(mockedMessage, false, false);
    });

    it('should requeue message when prisma deadlock detected', async () => {
      context.getChannelRef.mockReturnValue(mockedChannel);
      context.getMessage.mockReturnValue(mockedMessage);
      articleRepository.create.mockImplementation(async () => {
        throw new Prisma.PrismaClientUnknownRequestError('40P01 deadlock detected', {
          clientVersion: '1',
          batchRequestIdx: 1,
        });
      });

      const json = JSON.stringify(mockedFeed);
      await publishFeedService.publishFeed(json, context);

      expect(mockedChannel.nack).toHaveBeenCalledWith(mockedMessage, false, true);
    });

    it('should publish keywords if FEATURE_LLM_KEYWORDS is true', async () => {
      context.getChannelRef.mockReturnValue(mockedChannel);
      context.getMessage.mockReturnValue(mockedMessage);

      articleRepository.create.mockResolvedValue(mockedFeed.articles);
      remoteConfigService.get
        .calledWith(RemoteConfigKey.FEATURE_LLM_KEYWORDS, false)
        .mockResolvedValue(true);

      const json = JSON.stringify(mockedFeed);
      await publishFeedService.publishFeed(json, context);

      expect(generateKeywordsService.generateArticlesKeywords).toHaveBeenCalled();
    });
  });
});
