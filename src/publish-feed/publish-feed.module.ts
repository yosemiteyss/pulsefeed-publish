import { CacheModule, DatabaseModule } from '@pulsefeed/common';
import { PublishFeedController } from './controller';
import { PublishFeedRepository } from './repository';
import { PublishFeedService } from './service';
import { Module } from '@nestjs/common';

@Module({
  imports: [DatabaseModule, CacheModule],
  controllers: [PublishFeedController],
  providers: [PublishFeedService, PublishFeedRepository],
})
export class PublishFeedModule {}
