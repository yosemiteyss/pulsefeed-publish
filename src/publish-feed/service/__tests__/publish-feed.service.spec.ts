import {
  ArticleCategoryEnum,
  FeedRepository,
  LanguageEnum,
  PublishFeedDto,
  RemoteConfigService,
  RMQ_CLIENT,
} from '@pulsefeed/common';
import { ClientProxy, RmqContext } from '@nestjs/microservices';
import { PublishFeedService } from '../publish-feed.service';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Test, TestingModule } from '@nestjs/testing';
import { ArticleRepository } from '../../../shared';
import { ConsumeMessage, Channel } from 'amqplib';
import { LoggerService } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Observable } from 'rxjs';

describe('PublishFeedService', () => {
  let publishFeedService: PublishFeedService;
  let context: DeepMockProxy<RmqContext>;
  let feedRepository: DeepMockProxy<FeedRepository>;
  let articleRepository: DeepMockProxy<ArticleRepository>;
  let loggerService: DeepMockProxy<LoggerService>;
  let publishClient: DeepMockProxy<ClientProxy>;
  let remoteConfigService: DeepMockProxy<RemoteConfigService>;
  let channel: DeepMockProxy<Channel>;
  let consumeMessage: DeepMockProxy<ConsumeMessage>;

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
    feedRepository = mockDeep<FeedRepository>();
    articleRepository = mockDeep<ArticleRepository>();
    loggerService = mockDeep<LoggerService>();
    publishClient = mockDeep<ClientProxy>();
    remoteConfigService = mockDeep<RemoteConfigService>();

    channel = mockDeep<Channel>();
    consumeMessage = mockDeep<ConsumeMessage>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublishFeedService,
        {
          provide: FeedRepository,
          useValue: feedRepository,
        },
        {
          provide: ArticleRepository,
          useValue: articleRepository,
        },
        {
          provide: WINSTON_MODULE_NEST_PROVIDER,
          useValue: loggerService,
        },
        {
          provide: RMQ_CLIENT,
          useValue: publishClient,
        },
        {
          provide: RemoteConfigService,
          useValue: remoteConfigService,
        },
      ],
    }).compile();

    publishFeedService = module.get<PublishFeedService>(PublishFeedService);

    context.getChannelRef.mockReturnValue(channel);
    context.getMessage.mockReturnValue(consumeMessage);
  });

  describe('publishFeed', () => {
    it('should not requeue when upsert feed to db failed', async () => {
      feedRepository.upsert.mockRejectedValue(new Error('db error'));

      await publishFeedService.publishFeed(mockedFeed, context);

      expect(channel.nack).toHaveBeenCalledWith(consumeMessage, false, false);
    });

    it('should insert articles to db, without publishing keywords', async () => {
      feedRepository.upsert.mockResolvedValue(mockedFeed.feed);
      articleRepository.create.mockResolvedValue(mockedFeed.articles);
      remoteConfigService.get.mockResolvedValue(false); // no keywords

      await publishFeedService.publishFeed(mockedFeed, context);

      expect(articleRepository.create).toHaveBeenCalled();
      expect(articleRepository.publish).toHaveBeenCalled();
      expect(channel.ack).toHaveBeenCalledWith(consumeMessage);
    });

    it('should insert articles to db, and publish keywords', async () => {
      feedRepository.upsert.mockResolvedValue(mockedFeed.feed);
      articleRepository.create.mockResolvedValue(mockedFeed.articles);
      remoteConfigService.get.mockResolvedValue(true); // feature enabled
      publishClient.emit.mockReturnValue(new Observable());

      await publishFeedService.publishFeed(mockedFeed, context);

      expect(articleRepository.create).toHaveBeenCalled();
      expect(articleRepository.publish).toHaveBeenCalled();
      expect(publishClient.emit).toHaveBeenCalledTimes(mockedFeed.articles.length);
      expect(channel.ack).toHaveBeenCalledWith(consumeMessage);
    });

    it('should insert articles to db, but not publish keywords, when there is inserted keywords', async () => {
      feedRepository.upsert.mockResolvedValue(mockedFeed.feed);

      for (const article of mockedFeed.articles) {
        article.keywords = ['keyword-1', 'keyword-2'];
      }
      articleRepository.create.mockResolvedValue(mockedFeed.articles);

      remoteConfigService.get.mockResolvedValue(true); // feature enabled
      publishClient.emit.mockReturnValue(new Observable());

      await publishFeedService.publishFeed(mockedFeed, context);

      expect(articleRepository.create).toHaveBeenCalled();
      expect(articleRepository.publish).toHaveBeenCalled();
      expect(publishClient.emit).not.toHaveBeenCalled();
      expect(channel.ack).toHaveBeenCalledWith(consumeMessage);
    });

    it('should nack and not requeue for unknown error', async () => {
      feedRepository.upsert.mockResolvedValue(mockedFeed.feed);
      remoteConfigService.get.mockResolvedValue(false); // no keywords
      articleRepository.create.mockImplementation(async () => {
        throw new Error('unknown error');
      });

      await publishFeedService.publishFeed(mockedFeed, context);

      expect(channel.nack).toHaveBeenCalledWith(consumeMessage, false, false);
    });

    it('should requeue message when prisma deadlock detected', async () => {
      feedRepository.upsert.mockResolvedValue(mockedFeed.feed);
      context.getChannelRef.mockReturnValue(channel);
      consumeMessage.fields.redelivered = false;
      context.getMessage.mockReturnValue(consumeMessage);
      articleRepository.create.mockImplementation(async () => {
        throw new Prisma.PrismaClientUnknownRequestError('40P01 deadlock detected', {
          clientVersion: '1',
          batchRequestIdx: 1,
        });
      });

      await publishFeedService.publishFeed(mockedFeed, context);

      expect(channel.nack).toHaveBeenCalledWith(consumeMessage, false, true);
    });

    it('should nack and not requeue when prisma deadlock detected after requeue once', async () => {
      feedRepository.upsert.mockResolvedValue(mockedFeed.feed);
      context.getChannelRef.mockReturnValue(channel);
      consumeMessage.fields.redelivered = true;
      context.getMessage.mockReturnValue(consumeMessage);
      articleRepository.create.mockImplementation(async () => {
        throw new Prisma.PrismaClientUnknownRequestError('40P01 deadlock detected', {
          clientVersion: '1',
          batchRequestIdx: 1,
        });
      });

      await publishFeedService.publishFeed(mockedFeed, context);

      expect(channel.nack).toHaveBeenCalledWith(consumeMessage, false, false);
    });
  });
});
