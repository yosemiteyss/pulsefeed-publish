import { SanitizeService } from '../../service/sanitize.service';
import { LoggerService } from '@common/logger';
import { EtnetSource } from '../etnet.source';
import { NewsCategory } from '@common/model';
import { Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';

describe('etnet', () => {
  it('should convert feed entity', async () => {
    const file = fs.readFileSync(path.resolve(__dirname, './assets/etnet.xml'), {
      encoding: 'utf8',
    });

    const source = new EtnetSource(new LoggerService(new Logger()), new SanitizeService());
    const entity = await source.getFeedEntity(
      file,
      NewsCategory.FINANCE,
      'https://www.etnet.com.hk/www/tc/news/rss.php?section=editor',
    );

    expect(entity.id).toBe('14ffc0d0be57cb8aff4943ec89b756dd5cf4d5360f1bea34861f254fad48d468');
    expect(entity.title).toBe('ETNet 新聞 - 精選新聞');
    expect(entity.description).toBe('ETNet 新聞 - 精選新聞');
    expect(entity.link).toBe('https://www.etnet.com.hk/www/tc/news/rss.php?section=editor');
    expect(entity.items!.length).toBeGreaterThan(0);

    expect(entity.items![0].id).toBe(
      '804ca76fc3aa69ed8b90907b8976bbf82d892b298c95fa8e9e993d035e099b83',
    );
    expect(entity.items![0].title).toBe(
      '《午市前瞻》恒指有望逼近兩萬大關，追中特估首選電訊股中電信',
    );
    expect(entity.items![0].link).toBe(
      'https://www.etnet.com.hk/www/tc/news/home_categorized_news_detail.php?newsid=ETN34051046',
    );
    expect(entity.items![0].description).toBe(
      '《經濟通通訊社１０日專訊》恒生指數半日報１８８５９，升３２１點或１﹒７％，主板成' +
        '交逾９３９億元。恒生中國企業指數報６６７９，升１１８點或１﹒８％。恒生科技指數報' +
        '３９３６，跌１１點或０﹒３％。' +
        '恒指三大成交股份依次為建行（００９３９）、港交所（００３８８）及騰訊' +
        '（００７００）；建行報５﹒６１元，升０﹒３３元或６﹒２％，成交６７﹒８９億元；港交所' +
        '報２８３﹒６元，升１８元或６﹒８％，成',
    );

    const publishedAt = entity.items![0].publishedAt as Date;
    expect(publishedAt.getTime()).toBe(
      new Date(Date.parse('Fri, 10 May 2024 12:17:00 +0800')).getTime(),
    );
    expect(entity.items![0].category).toBe(NewsCategory.FINANCE);
    expect(entity.items![0].image).toBeUndefined();
    expect(entity.items![0].keywords).toBeUndefined();
  });
});
