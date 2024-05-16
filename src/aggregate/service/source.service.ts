import { YahooNewsHKSource } from '../source/yahoo-news-hk.source';
import { NowNewsSource } from '../source/now-news.source';
import { MingpaoSource } from '../source/mingpao.source';
import { BBCCNSource } from '../source/bbc-cn.source';
import { EtnetSource } from '../source/etnet.source';
import { SanitizeService } from './sanitize.service';
import { NewsSource } from '../source/news.source';
import { HKETSource } from '../source/hket.source';
import { RTHKSource } from '../source/rthk.source';
import { HK01Source } from '../source/hk01.source';
import { SCMPSource } from '../source/scmp.source';
import { OnccSource } from '../source/oncc.source';
import { InjectRepository } from '@nestjs/typeorm';
import { LoggerService } from '@common/logger';
import { Injectable } from '@nestjs/common';
import { SourceEntity } from '@common/db';
import { shuffle } from '@common/utils';
import { Repository } from 'typeorm';

@Injectable()
export class SourceService {
  constructor(
    @InjectRepository(SourceEntity) private readonly sourceRepository: Repository<SourceEntity>,
    private readonly logger: LoggerService,
    private readonly sanitizeService: SanitizeService,
  ) {}

  private readonly sourceList: NewsSource[] = [
    new HKETSource(this.logger, this.sanitizeService),
    new RTHKSource(this.logger, this.sanitizeService),
    new MingpaoSource(this.logger, this.sanitizeService),
    new YahooNewsHKSource(this.logger, this.sanitizeService),
    new HK01Source(this.logger, this.sanitizeService),
    new SCMPSource(this.logger, this.sanitizeService),
    new BBCCNSource(this.logger, this.sanitizeService),
    new EtnetSource(this.logger, this.sanitizeService),
    new OnccSource(this.logger, this.sanitizeService),
    new NowNewsSource(this.logger, this.sanitizeService),
  ];

  async getEnabledSources(): Promise<NewsSource[]> {
    const entities = await this.sourceRepository.find({
      where: {
        enabled: true,
      },
    });

    const result = entities.map((entity) => {
      return this.sourceList.find((source) => source.getSourceEntity().link === entity.link);
    });

    shuffle(result);

    return result;
  }

  getDefaultSources(): NewsSource[] {
    return this.sourceList;
  }
}
