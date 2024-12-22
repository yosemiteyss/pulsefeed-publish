import { PrismaClient, PublishFeedDto, PublishKeywordsDto } from '@pulsefeed/common';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { PublishFeedRepository } from '../repository';
import { RmqContext } from '@nestjs/microservices';

@Injectable()
export class PublishFeedService {
  constructor(
    private readonly publishFeedRepository: PublishFeedRepository,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {}

  /**
   * Handle the publishing of feed.
   * @param data the feed data received.
   * @param context rmq context for the message.
   */
  async publishFeed(data: string, context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMessage = context.getMessage();
    const request: PublishFeedDto = JSON.parse(data);

    try {
      const articles = await this.publishFeedRepository.publishFeed(request.feed, request.articles);
      this.logger.log(
        `Published articles: ${articles.length}, feed: ${request.feed.link}`,
        PublishFeedService.name,
      );
      channel.ack(originalMessage);
    } catch (err) {
      // Requeue when deadlock occurs.
      if (err instanceof PrismaClient.Prisma.PrismaClientUnknownRequestError) {
        if (err.message.includes('40P01')) {
          this.logger.error(
            `Deadlock detected: ${request.feed?.link}, send requeue,\n$err`,
            PublishFeedService.name,
          );
          channel.nack(originalMessage, false, true);
          return;
        }
      }

      this.logger.error(
        `Failed to publish feed: ${request.feed?.link}`,
        err.stack,
        PublishFeedService.name,
      );
      channel.nack(originalMessage, false, false);
    }
  }

  /**
   * Handle the publishing of keywords.
   * @param data the keywords data received.
   * @param context rmq context for the message.
   */
  async publishKeywords(data: string, context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMessage = context.getMessage();
    const request: PublishKeywordsDto = JSON.parse(data);

    try {
      await this.publishFeedRepository.updateArticleNlpKeywords(
        request.articleId,
        request.keywords,
      );
      channel.ack(originalMessage);
    } catch (err) {
      this.logger.error(
        `Failed to publish keywords: ${request}`,
        err.stack,
        PublishFeedService.name,
      );
      channel.nack(originalMessage, false, false);
    }
  }
}
