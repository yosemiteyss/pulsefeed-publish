import { PublishFeedDto, PublishKeywordsDto } from '@common/dto';
import { RmqContext } from '@nestjs/microservices';
import { FeedRepository } from './feed.repository';
import { LoggerService } from '@common/logger';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class PublishFeedService {
  constructor(
    private readonly feedRepository: FeedRepository,
    private readonly logger: LoggerService,
  ) {}

  async publishFeed(data: any, context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMessage = context.getMessage();

    const request: PublishFeedDto = JSON.parse(data);

    try {
      const articles = await this.feedRepository.create(request.feed);

      this.logger.log(
        PublishFeedService.name,
        `Published articles: ${articles.length}, feed ${request.feed.link}`,
      );

      channel.ack(originalMessage);
    } catch (err) {
      // Requeue when deadlock occurs.
      if (err instanceof Prisma.PrismaClientUnknownRequestError) {
        if (err.message.includes('40P01')) {
          this.logger.warn(
            PublishFeedService.name,
            `Deadlock detected: ${request.feed?.link}, send requeue,\n$err`,
          );
          channel.nack(originalMessage, false, true);
          return;
        }
      }

      this.logger.error(
        PublishFeedService.name,
        `Failed to publish feed: ${request.feed?.link}`,
        err,
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
      this.logger.error(PublishFeedService.name, `Failed to publish keywords: ${request}`, err);
      channel.nack(originalMessage, false, false);
    }
  }
}
