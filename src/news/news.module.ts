import { NewsController } from './news.controller';
import { PublishService } from './publish.service';
import { DatabaseModule } from '@common/db';
import { Module } from '@nestjs/common';

@Module({
  imports: [DatabaseModule],
  controllers: [NewsController],
  providers: [PublishService],
})
export class NewsModule {}
