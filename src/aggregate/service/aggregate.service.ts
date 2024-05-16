import { AggregateStrategyService } from './aggregate-strategy.service';
import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { AggregateJobService } from './aggregate-job.service';
import { NewsSource } from '../source/news.source';
import { InjectRepository } from '@nestjs/typeorm';
import { SourceEntity } from '@common/db/entity';
import { SourceService } from './source.service';
import { LoggerService } from '@common/logger';
import { JobStatus } from '@common/model';
import { Cron } from '@nestjs/schedule';
import { Repository } from 'typeorm';

@Injectable()
export class AggregateService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(SourceEntity) private readonly sourceRepository: Repository<SourceEntity>,
    private readonly logger: LoggerService,
    private readonly jobService: AggregateJobService,
    private readonly strategyService: AggregateStrategyService,
    private readonly sourceService: SourceService,
  ) {}

  async onApplicationBootstrap() {
    // Populate sources when app starts.
    const sourceList = this.sourceService.getDefaultSources();
    await this.insertSources(sourceList);

    // Run job when app start.
    await this.startJob();
  }

  @Cron('0 0-6 * * *', { name: 'fetch-news-day' })
  async startDayJob() {
    await this.startJob();
  }

  @Cron('30 6-23 * * *', { name: 'fetch-news-midnight' })
  async startMidNightJob() {
    await this.startJob();
  }

  private async startJob() {
    const sourceList = await this.sourceService.getEnabledSources();
    await this.fetchNews(sourceList);
  }

  private async insertSources(sourceList: NewsSource[]): Promise<boolean> {
    const sources = sourceList.map((source) => source.getSourceEntity());

    try {
      const entities = this.sourceRepository.create(sources);
      const result = await this.sourceRepository.save(entities);

      this.logger.log(AggregateService.name, `Inserted sources: ${result.length}`);

      return true;
    } catch (err) {
      this.logger.error(AggregateService.name, 'Failed to insert sources,', err);
      return false;
    }
  }

  private async fetchNews(sourceList: NewsSource[]) {
    const startTime = performance.now();
    const job = await this.jobService.addJob();

    const { isSuccess, errs, feedsCount, itemsCount } =
      await this.strategyService.batchFetchSingleInsert(sourceList);

    const errsToString = (errs: Error[]): string => {
      return errs.map((err) => this.logger.formatError(err)).join('\n\n');
    };

    const endTime = performance.now();
    const elapsedTime = endTime - startTime;

    try {
      await this.jobService.finishJob(
        {
          id: job.id,
          status: isSuccess ? JobStatus.SUCCESS : JobStatus.FAILURE,
          feedsCount,
          itemsCount,
          reason: errs.length > 0 ? errsToString(errs) : undefined,
        },
        elapsedTime,
      );
    } catch (err) {
      this.logger.error(AggregateService.name, 'Failed to update job,', err);
    }
  }
}
