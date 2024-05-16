import { AggregateStrategyService } from './service/aggregate-strategy.service';
import { AggregateJobService } from './service/aggregate-job.service';
import { AggregateService } from './service/aggregate.service';
import { SanitizeService } from './service/sanitize.service';
import { SourceService } from './service/source.service';
import { DatabaseModule } from '@common/db';
import { Module } from '@nestjs/common';

@Module({
  imports: [DatabaseModule],
  providers: [
    AggregateService,
    AggregateJobService,
    AggregateStrategyService,
    SourceService,
    SanitizeService,
  ],
})
export class AggregateModule {}
