import {
  ArticleCategoryEnum,
  LanguageEnum,
  PublishFeedDto,
  PublishKeywordsDto,
} from '@pulsefeed/common';
import { PublishFeedService } from '../publish-feed.service';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { PublishFeedRepository } from '../../repository';
import { Test, TestingModule } from '@nestjs/testing';
import { RmqContext } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';

describe('PublishFeedService', () => {
  let publishFeedService: PublishFeedService;
  let publishFeedRepository: DeepMockProxy<PublishFeedRepository>;
  let mockedContext: DeepMockProxy<RmqContext>;

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
  const mockedPublishKeywords: PublishKeywordsDto = {
    articleId: '1',
    keywords: ['keyword-1', 'keyword-2'],
  };

  beforeEach(async () => {
    publishFeedRepository = mockDeep<PublishFeedRepository>();
    mockedContext = mockDeep<RmqContext>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublishFeedService,
        {
          provide: PublishFeedRepository,
          useValue: publishFeedRepository,
        },
        {
          provide: WINSTON_MODULE_NEST_PROVIDER,
          useValue: new Logger(),
        },
      ],
    }).compile();

    publishFeedService = module.get<PublishFeedService>(PublishFeedService);
  });

  describe('publishFeed', () => {
    it('should deserialize message to dto, and ack', async () => {
      mockedContext.getChannelRef.mockReturnValue(mockedChannel);
      mockedContext.getMessage.mockReturnValue(mockedMessage);
      publishFeedRepository.publishFeed.mockResolvedValue(mockedFeed.articles);

      const json = JSON.stringify(mockedFeed);
      await publishFeedService.publishFeed(json, mockedContext);

      expect(publishFeedRepository.publishFeed).toHaveBeenCalledWith(
        mockedFeed.feed,
        mockedFeed.articles,
      );
      expect(mockedChannel.ack).toHaveBeenCalledWith(mockedMessage);
    });

    it('should nack for unknown error', async () => {
      mockedContext.getChannelRef.mockReturnValue(mockedChannel);
      mockedContext.getMessage.mockReturnValue(mockedMessage);
      publishFeedRepository.publishFeed.mockImplementation(async () => {
        throw new Error('unknown error');
      });

      const json = JSON.stringify(mockedFeed);
      await publishFeedService.publishFeed(json, mockedContext);

      expect(mockedChannel.nack).toHaveBeenCalledWith(mockedMessage, false, false);
    });

    it('should requeue message when prisma deadlock detected', async () => {
      mockedContext.getChannelRef.mockReturnValue(mockedChannel);
      mockedContext.getMessage.mockReturnValue(mockedMessage);
      publishFeedRepository.publishFeed.mockImplementation(async () => {
        throw new Prisma.PrismaClientUnknownRequestError('40P01 deadlock detected', {
          clientVersion: '1',
          batchRequestIdx: 1,
        });
      });

      const json = JSON.stringify(mockedFeed);
      await publishFeedService.publishFeed(json, mockedContext);

      expect(mockedChannel.nack).toHaveBeenCalledWith(mockedMessage, false, true);
    });
  });

  describe('publishKeywords', () => {
    it('should call update nlp keywords, and ack', async () => {
      mockedContext.getChannelRef.mockReturnValue(mockedChannel);
      mockedContext.getMessage.mockReturnValue(mockedMessage);
      publishFeedRepository.updateArticleNlpKeywords.mockResolvedValue();

      const json = JSON.stringify(mockedPublishKeywords);
      await publishFeedService.publishKeywords(json, mockedContext);

      expect(publishFeedRepository.updateArticleNlpKeywords).toHaveBeenCalledWith(
        mockedPublishKeywords.articleId,
        mockedPublishKeywords.keywords,
      );
      expect(mockedChannel.ack).toHaveBeenCalledWith(mockedMessage);
    });

    it('should nack when error occurs', async () => {
      mockedContext.getChannelRef.mockReturnValue(mockedChannel);
      mockedContext.getMessage.mockReturnValue(mockedMessage);
      publishFeedRepository.updateArticleNlpKeywords.mockResolvedValue();

      expect(mockedChannel.nack).toHaveBeenCalledWith(mockedMessage, false, false);
    });
  });
});
