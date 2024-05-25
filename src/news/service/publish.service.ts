import { InsertFeedsService } from "./insert-feeds.service";
import { RmqContext } from "@nestjs/microservices";
import { LoggerService } from "@common/logger";
import { Injectable } from "@nestjs/common";
import { FeedModel } from "@common/db";

@Injectable()
export class PublishService {
  constructor(
    private readonly insertFeedsService: InsertFeedsService,
    private readonly logger: LoggerService,
  ) {}

  async publishFeed(data: any, context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMessage = context.getMessage();

    let feedModel: FeedModel;

    try {
      feedModel = JSON.parse(data);

      const insertedNews = await this.insertFeedsService.upsert(feedModel);

      this.logger.log(
        PublishService.name,
        `Published news: ${insertedNews.length}, feed ${feedModel.link}`,
      );

      channel.ack(originalMessage);
    } catch (err) {
      this.logger.error(
        PublishService.name,
        `Failed to publish news, feed: ${feedModel?.link}`,
        err,
      );

      channel.nack(originalMessage, false, false);
    }
  }
}
