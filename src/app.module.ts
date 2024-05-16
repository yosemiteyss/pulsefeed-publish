import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AggregateModule } from './aggregate/aggregate.module';
import { ConfigModule } from '@common/config/config.module';
import { LoggerMiddleware } from 'nestjs-http-logger';
import { ScheduleModule } from '@nestjs/schedule';
import { LoggerModule } from '@common/logger';
import { DatabaseModule } from '@common/db';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    LoggerModule.forRoot({ appName: 'pf-aggregate' }),
    ScheduleModule.forRoot(),
    AggregateModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
