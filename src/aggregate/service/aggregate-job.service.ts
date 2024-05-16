import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { LoggerService } from '@common/logger';
import { JobEntity } from '@common/db/entity';
import * as moment from 'moment';

@Injectable()
export class AggregateJobService {
  constructor(
    @InjectRepository(JobEntity) private readonly jobRepository: Repository<JobEntity>,
    private readonly logger: LoggerService,
  ) {}

  async addJob(): Promise<JobEntity> {
    const created = this.jobRepository.create();
    const inserted = await this.jobRepository.save(created);

    this.logger.log(
      AggregateJobService.name,
      `Added job (${inserted.id}) status: ${inserted.status}`,
    );

    return inserted;
  }

  async finishJob(entity: DeepPartial<JobEntity>, elapsedTime: number) {
    const job = await this.jobRepository.findOneBy({ id: entity.id });
    if (!job) {
      throw new NotFoundException(`job (${entity.id}) does not exist`);
    }

    const result = await this.jobRepository.save(entity);
    const elapsedFmt = moment.utc(elapsedTime).format('HH:mm:ss');

    this.logger.log(
      AggregateJobService.name,
      `Finished job (${result.id}) status: ${result.status}, elapsed: ${elapsedFmt}`,
    );
  }
}
