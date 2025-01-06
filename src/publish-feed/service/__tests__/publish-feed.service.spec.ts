import {
  ArticleCategoryEnum,
  LanguageEnum,
  PublishFeedDto,
  RemoteConfigService,
} from '@pulsefeed/common';
import { InvalidJSONFormatException } from '@nestjs/microservices/errors/invalid-json-format.exception';
import { GenerateKeywordsService, TrendingKeywordsService } from '../../../trending';
import { PublishFeedTaskService } from '../publish-feed-task.service';
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
  let publishFeedTaskService: DeepMockProxy<PublishFeedTaskService>;

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
    publishFeedTaskService = mockDeep<PublishFeedTaskService>();

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
        {
          provide: PublishFeedTaskService,
          useValue: publishFeedTaskService,
        },
      ],
    }).compile();

    publishFeedService = module.get<PublishFeedService>(PublishFeedService);

    context.getChannelRef.mockReturnValue(mockedChannel);
    context.getMessage.mockReturnValue(mockedMessage);
  });

  describe('publishFeed', () => {
    it('should throw InvalidJSONFormatException when deserialize dto failed', async () => {
      const json = 'invalid';

      await expect(publishFeedService.publishFeed(json, context)).rejects.toThrow(
        InvalidJSONFormatException,
      );
      expect(mockedChannel.nack).not.toHaveBeenCalled();
    });

    it('should requeue when create publish feed task failed', async () => {
      publishFeedTaskService.addTask.mockRejectedValue(new Error('db error'));

      const json = JSON.stringify(mockedFeed);
      await publishFeedService.publishFeed(json, context);

      expect(mockedChannel.nack).toHaveBeenCalledWith(mockedMessage, false, true);
    });

    it('should insert articles to db, without publishing keywords', async () => {
      const publishFeedTaskId = 'id';
      articleRepository.create.mockResolvedValue(mockedFeed.articles);
      remoteConfigService.get.mockResolvedValue(false); // no keywords
      publishFeedTaskService.addTask.mockResolvedValue(publishFeedTaskId);

      const json = JSON.stringify(mockedFeed);
      await publishFeedService.publishFeed(json, context);

      expect(articleRepository.create).toHaveBeenCalled();
      expect(articleRepository.publish).toHaveBeenCalled();
      expect(mockedChannel.ack).toHaveBeenCalledWith(mockedMessage);
      expect(publishFeedTaskService.updateTask).toHaveBeenCalledWith({
        taskId: publishFeedTaskId,
        status: 'Succeed',
        finishedAt: expect.any(Date),
      });
    });

    it('should insert articles to db, and publish keywords', async () => {
      const publishFeedTaskId = 'id';

      articleRepository.create.mockResolvedValue(mockedFeed.articles);
      remoteConfigService.get.mockResolvedValue(true); // feature enabled
      publishFeedTaskService.addTask.mockResolvedValue(publishFeedTaskId);

      const json = JSON.stringify(mockedFeed);
      await publishFeedService.publishFeed(json, context);

      expect(articleRepository.create).toHaveBeenCalled();
      expect(articleRepository.publish).toHaveBeenCalled();
      expect(generateKeywordsService.generateArticlesKeywords).toHaveBeenCalled();
      expect(mockedChannel.ack).toHaveBeenCalledWith(mockedMessage);
      expect(publishFeedTaskService.updateTask).toHaveBeenCalledWith({
        taskId: publishFeedTaskId,
        status: 'PublishKeywords',
      });
      expect(publishFeedTaskService.updateTask).toHaveBeenCalledWith({
        taskId: publishFeedTaskId,
        status: 'Succeed',
        finishedAt: expect.any(Date),
      });
    });

    it('should nack and not requeue for unknown error', async () => {
      const publishFeedTaskId = 'id';

      remoteConfigService.get.mockResolvedValue(false); // no keywords
      publishFeedTaskService.addTask.mockResolvedValue(publishFeedTaskId);
      articleRepository.create.mockImplementation(async () => {
        throw new Error('unknown error');
      });

      const json = JSON.stringify(mockedFeed);
      await publishFeedService.publishFeed(json, context);

      expect(mockedChannel.nack).toHaveBeenCalledWith(mockedMessage, false, false);
      expect(publishFeedTaskService.updateTask).toHaveBeenCalledWith({
        taskId: publishFeedTaskId,
        status: 'Failed',
        finishedAt: expect.any(Date),
      });
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
  });
});
