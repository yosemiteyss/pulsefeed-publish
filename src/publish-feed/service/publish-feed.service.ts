import {
  Feed,
  FeedRepository,
  PublishFeedDto,
  RMQ_CLIENT,
  RemoteConfigKey,
  RemoteConfigService,
  PUBLISH_KEYWORDS_PATTERN,
} from '@pulsefeed/common';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { ClientProxy, RmqContext } from '@nestjs/microservices';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { ConsumeMessage, Channel } from 'amqplib';
import { ArticleRepository } from '../../shared';
import { Prisma } from '@prisma/client';

export interface PublishArticleKeywordsDto {
  readonly id: string;
  readonly title: string;
}

@Injectable()
export class PublishFeedService {
  constructor(
    private readonly feedRepository: FeedRepository,
    private readonly articleRepository: ArticleRepository,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
    @Inject(RMQ_CLIENT) private readonly publishClient: ClientProxy,
    private readonly remoteConfigService: RemoteConfigService,
  ) {}

  // async onModuleInit() {
  //   const trendingKeywords = await this.trendingKeywordsService.getTrendingKeywordsForLang('zh-hk');
  //   this.logger.log(
  //     `Trending: ${trendingKeywords.map((item) => `${item.keyword}:${item.score} `)}`,
  //     PublishFeedService.name,
  //   );
  //
  //   for (const category of Object.values(ArticleCategoryEnum)) {
  //     const keywords = await this.trendingKeywordsService.getTrendingKeywordsForCategory(
  //       'zh-hk',
  //       category,
  //     );
  //     this.logger.log(
  //       `[${category}]: ${keywords.map((item) => `${item.keyword}:${item.score} `)}`,
  //       PublishFeedService.name,
  //     );
  //   }
  // }

  /**
   * Handle the publishing of feed.
   * @param event the publish feed event.
   * @param context rmq context for the message.
   */
  async publishFeed(event: PublishFeedDto, context: RmqContext) {
    const channel = context.getChannelRef() as Channel;
    const originalMessage = context.getMessage() as ConsumeMessage;
    const startTime = Date.now();

    // Insert feed to db.
    let insertedFeed: Feed;
    try {
      insertedFeed = await this.feedRepository.upsert(event.feed);
    } catch (error) {
      this.logger.error(`Failed to upsert feed to db`, error.stack, PublishFeedService.name);
      channel.nack(originalMessage, false, false);
      return;
    }

    // Insert articles to db.
    try {
      const insertedArticles = await this.articleRepository.create(insertedFeed, event.articles);

      const featureLLMKeywords = await this.remoteConfigService.get<boolean>(
        RemoteConfigKey.FEATURE_LLM_KEYWORDS,
        false,
      );

      // Send publish keywords events to queue.
      if (featureLLMKeywords) {
        for (const article of insertedArticles) {
          const request: PublishArticleKeywordsDto = {
            id: article.id,
            title: article.title,
          };

          this.publishClient.emit(PUBLISH_KEYWORDS_PATTERN, request);
          this.logger.log(
            `Sent publish keywords event, article id: ${article.id}`,
            PublishFeedService.name,
          );
        }
      }

      // Mark isPublished flag to true.
      await this.articleRepository.publish(insertedArticles);

      const elapsedTime = Date.now() - startTime;

      this.logger.log(
        `Published articles: ${insertedArticles.length}, feed: ${insertedFeed.link}, time taken: ${elapsedTime} ms`,
        PublishFeedService.name,
      );

      channel.ack(originalMessage);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientUnknownRequestError &&
        error.message.includes('40P01') &&
        !originalMessage.fields.redelivered
      ) {
        this.logger.error(
          `Deadlock detected: ${event.feed?.link}, send requeue.`,
          error.stack,
          PublishFeedService.name,
        );
        channel.nack(originalMessage, false, true);
        return;
      }

      this.logger.error(
        `Publish feed failed: ${event.feed?.link}`,
        error.stack,
        PublishFeedService.name,
      );
      channel.nack(originalMessage, false, false);
    }
  }
}
