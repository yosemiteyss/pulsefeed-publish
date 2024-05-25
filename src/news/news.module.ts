import { InsertFeedsService } from "./service/insert-feeds.service";
import { NewsController } from "./controller/news.controller";
import { PublishService } from "./service/publish.service";
import { DatabaseModule } from "@common/db";
import { Module } from "@nestjs/common";

@Module({
  imports: [DatabaseModule],
  controllers: [NewsController],
  providers: [PublishService, InsertFeedsService],
})
export class NewsModule {}
