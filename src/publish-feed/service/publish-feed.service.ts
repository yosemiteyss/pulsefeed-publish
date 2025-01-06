import { InvalidJSONFormatException } from '@nestjs/microservices/errors/invalid-json-format.exception';
import { Article, PublishFeedDto, RemoteConfigKey, RemoteConfigService } from '@pulsefeed/common';
import { GenerateKeywordsService, TrendingKeywordsService } from '../../trending';
import { PublishFeedTaskService } from './publish-feed-task.service';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { RmqContext } from '@nestjs/microservices';
import { ArticleRepository } from '../../shared';
import { Prisma } from '@prisma/client';

@Injectable()
export class PublishFeedService {
  constructor(
    private readonly articleRepository: ArticleRepository,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
    private readonly generateKeywordsService: GenerateKeywordsService,
    private readonly trendingKeywordsService: TrendingKeywordsService,
    private readonly remoteConfigService: RemoteConfigService,
    private readonly publishFeedTaskService: PublishFeedTaskService,
  ) {}

  private readonly GENERATE_KEYWORDS_MAX_RETRIES = 2;

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
   * @param data the feed data received.
   * @param context rmq context for the message.
   */
  async publishFeed(data: string, context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMessage = context.getMessage();
    const startTime = Date.now();

    // Deserialize request.
    const request = this.deserializePublishFeedRequest(data);

    // Add publish feed task.
    const publishFeedTaskId = await this.createPublishFeedTask(request.feed.id);
    if (!publishFeedTaskId) {
      this.logger.log(
        `Send requeue, because failed to add publish feed task to db, `,
        PublishFeedService.name,
      );
      channel.nack(originalMessage, false, true);
      return;
    }

    try {
      const insertedArticles = await this.articleRepository.create(request.feed, request.articles);

      // Generate article keywords using LLM.
      if (insertedArticles.length > 0) {
        const featureLLMKeywords = await this.remoteConfigService.get<boolean>(
          RemoteConfigKey.FEATURE_LLM_KEYWORDS,
          false,
        );
        if (featureLLMKeywords) {
          await this.generateKeywords(publishFeedTaskId, insertedArticles);
        }
      }

      // Mark isPublished flag to true.
      await this.articleRepository.publish(insertedArticles);

      // Calculate used time.
      const endTime = Date.now();
      const elapsedTime = endTime - startTime;

      this.logger.log(
        `Published articles: ${insertedArticles.length}, feed: ${request.feed.link}, time taken: ${elapsedTime} ms`,
        PublishFeedService.name,
      );

      channel.ack(originalMessage);

      await this.publishFeedTaskService.updateTask({
        taskId: publishFeedTaskId,
        status: 'Succeed',
      });
    } catch (error) {
      // Requeue when deadlock occurs.
      if (
        error instanceof Prisma.PrismaClientUnknownRequestError &&
        error.message.includes('40P01')
      ) {
        this.logger.error(
          `Deadlock detected: ${request.feed?.link}, send requeue.`,
          error.stack,
          PublishFeedService.name,
        );
        channel.nack(originalMessage, false, true);
        return;
      }

      this.logger.error(
        `Failed to publish feed: ${request.feed?.link}`,
        error.stack,
        PublishFeedService.name,
      );

      // Don't requeue.
      channel.nack(originalMessage, false, false);

      await this.publishFeedTaskService.updateTask({
        taskId: publishFeedTaskId,
        status: 'Failed',
      });
    }
  }

  private deserializePublishFeedRequest(data: string): PublishFeedDto {
    try {
      return JSON.parse(data);
    } catch (error) {
      throw new InvalidJSONFormatException(error, data);
    }
  }

  private async createPublishFeedTask(feedId: string): Promise<string | undefined> {
    try {
      return await this.publishFeedTaskService.addTask({
        feedId: feedId,
        status: 'PublishArticles',
      });
    } catch (error) {
      this.logger.error(
        `Failed to add publish feed task to db`,
        error.stack,
        PublishFeedService.name,
      );
      return undefined;
    }
  }

  private async generateKeywords(publishFeedTaskId: string, articles: Article[]) {
    let retryCount = 0;

    await this.publishFeedTaskService.updateTask({
      taskId: publishFeedTaskId,
      status: 'PublishKeywords',
    });

    while (retryCount < this.GENERATE_KEYWORDS_MAX_RETRIES) {
      try {
        const articleKeywords =
          await this.generateKeywordsService.generateArticlesKeywords(articles);

        // Update keywords of each article.
        for (const item of articleKeywords) {
          await this.articleRepository.updateKeywords(item.articleId, item.keywords);
        }

        // Increment ranking of each keyword.
        for (const [index, item] of articleKeywords.entries()) {
          const article = articles[index];
          for (const language of article.languages) {
            for (const keyword of item.keywords) {
              await this.trendingKeywordsService.incrementKeyword(
                keyword,
                language,
                article.category,
              );
            }
          }
        }

        break;
      } catch (error) {
        retryCount++;
        this.logger.error(
          `Publish keywords failed #${retryCount}:`,
          error.stack,
          PublishFeedService.name,
        );
      }
    }
  }
}
