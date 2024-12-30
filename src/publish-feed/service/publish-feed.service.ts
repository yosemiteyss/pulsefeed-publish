import { InvalidJSONFormatException } from '@nestjs/microservices/errors/invalid-json-format.exception';
import { GenerateKeywordsService, TrendingKeywordsService } from '../../trending';
import { Article, ArticleCategoryEnum, PublishFeedDto } from '@pulsefeed/common';
import { Inject, Injectable, LoggerService, OnModuleInit } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { RmqContext } from '@nestjs/microservices';
import { ArticleRepository } from '../../shared';
import { Prisma } from '@prisma/client';

@Injectable()
export class PublishFeedService implements OnModuleInit {
  constructor(
    private readonly articleRepository: ArticleRepository,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
    private readonly generateKeywordsService: GenerateKeywordsService,
    private readonly trendingKeywordsService: TrendingKeywordsService,
  ) {}

  private readonly GENERATE_KEYWORDS_MAX_RETRIES = 2;

  // TODO: remove this
  async onModuleInit() {
    const trendingKeywords = await this.trendingKeywordsService.getTrendingKeywordsForLang('zh-hk');
    this.logger.log(
      `Trending: ${trendingKeywords.map((item) => `${item.keyword}:${item.score} `)}`,
      PublishFeedService.name,
    );

    for (const category of Object.values(ArticleCategoryEnum)) {
      const keywords = await this.trendingKeywordsService.getTrendingKeywordsForCategory(
        'zh-hk',
        category,
      );
      this.logger.log(
        `[${category}]: ${keywords.map((item) => `${item.keyword}:${item.score} `)}`,
        PublishFeedService.name,
      );
    }
  }

  /**
   * Handle the publishing of feed.
   * @param data the feed data received.
   * @param context rmq context for the message.
   */
  async publishFeed(data: string, context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMessage = context.getMessage();
    const startTime = Date.now();

    let request: PublishFeedDto;
    try {
      request = JSON.parse(data);
    } catch (error) {
      throw new InvalidJSONFormatException(error, data);
    }

    try {
      const insertedArticles = await this.articleRepository.create(request.feed, request.articles);

      // Update article keywords.
      if (insertedArticles.length > 0) {
        await this.generateKeywords(insertedArticles);
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
    } catch (error) {
      // Requeue when deadlock occurs.
      if (error instanceof Prisma.PrismaClientUnknownRequestError) {
        if (error.message.includes('40P01')) {
          this.logger.error(
            `Deadlock detected: ${request.feed?.link}, send requeue.`,
            error.stack,
            PublishFeedService.name,
          );
          channel.nack(originalMessage, false, true);
          return;
        }
      }

      this.logger.error(
        `Failed to publish feed: ${request.feed?.link}`,
        error.stack,
        PublishFeedService.name,
      );

      // Don't requeue.
      channel.nack(originalMessage, false, false);
    }
  }

  /**
   * Generate and update articles keywords.
   * @param articles the inserted articles.
   * @private
   */
  private async generateKeywords(articles: Article[]) {
    let retryCount = 0;

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
