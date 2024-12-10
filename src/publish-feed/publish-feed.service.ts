import { PublishFeedDto, PublishKeywordsDto } from '@pulsefeed/common';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { PublishFeedRepository } from './publish-feed.repository';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { RmqContext } from '@nestjs/microservices';
import { Prisma } from '@prisma/client';

@Injectable()
export class PublishFeedService {
  constructor(
    private readonly feedRepository: PublishFeedRepository,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {}

  async publishFeed(data: any, context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMessage = context.getMessage();

    const request: PublishFeedDto = JSON.parse(data);

    try {
      const articles = await this.feedRepository.create(request.feed, request.articles);
      this.logger.log(
        `Published articles: ${articles.length}, feed: ${request.feed.link}`,
        PublishFeedService.name,
      );
      channel.ack(originalMessage);
    } catch (err) {
      // Requeue when deadlock occurs.
      if (err instanceof Prisma.PrismaClientUnknownRequestError) {
        if (err.message.includes('40P01')) {
          this.logger.warn(
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

  async publishKeywords(data: any, context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMessage = context.getMessage();

    const request: PublishKeywordsDto = JSON.parse(data);

    try {
      await this.feedRepository.updateArticleKeywords(request.articleId, request.keywords);
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
