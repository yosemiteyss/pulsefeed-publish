import { ConfigModule } from '@common/config/config.module';
import { NewsModule } from './news/news.module';
import { LoggerModule } from '@common/logger';
import { Module } from '@nestjs/common';

@Module({
  imports: [ConfigModule, LoggerModule.forRoot({ appName: 'pf-publish' }), NewsModule],
})
export class AppModule {}
