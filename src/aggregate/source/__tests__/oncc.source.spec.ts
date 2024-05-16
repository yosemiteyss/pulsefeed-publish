import { SanitizeService } from '../../service/sanitize.service';
import { LoggerService } from '@common/logger';
import { NewsCategory } from '@common/model';
import { OnccSource } from '../oncc.source';
import { Logger } from '@nestjs/common';
import { sha256 } from '@common/utils';
import * as path from 'path';
import * as fs from 'fs';

describe('oncc', () => {
  it('should convert feed entity', async () => {
    const file = fs.readFileSync(path.resolve(__dirname, './assets/oncc.json'), {
      encoding: 'utf8',
    });

    const source = new OnccSource(new LoggerService(new Logger()), new SanitizeService());
    const entity = await source.getFeedEntity(
      JSON.parse(file),
      NewsCategory.LOCAL,
      'https://hk.on.cc/hk/bkn/js/totop_news.js',
    );

    expect(entity.id).toBe(sha256('https://hk.on.cc/hk/bkn/js/totop_news.js'));
    expect(entity.title).toBe('news');
    expect(entity.description).toBeUndefined();
    expect(entity.link).toBe('https://hk.on.cc/hk/bkn/js/totop_news.js');
    expect(entity.items!.length).toBeGreaterThan(0);

    expect(entity.items![0].id).toBe(
      sha256('https://hk.on.cc/hk/bkn/cnt/news/20240512/bkn-20240512033056489-0512_00822_001.html'),
    );
    expect(entity.items![0].title).toBe('東方日報A1：5‧27擴個人遊　8市3300萬人口　救港旅業零售');
    expect(entity.items![0].link).toBe(
      'https://hk.on.cc/hk/bkn/cnt/news/20240512/bkn-20240512033056489-0512_00822_001.html',
    );
    expect(entity.items![0].description).toBe(
      '內地再增個人遊城市催谷本港經濟。國家出入境管理局昨日公布，由本月27日起，再新增8個居民可個人遊訪港的北方城市，香港旅遊發展局主席彭耀佳表示，新增8市共涉及3,388萬人，有助刺激訪港旅客「人氣」、並帶來「財氣」，該局隨即在內地多個社交平台',
    );

    const publishedAt = entity.items![0].publishedAt as Date;
    expect(publishedAt.getTime()).toBe(1715455856000);
    expect(entity.items![0].category).toBe(NewsCategory.LOCAL);
    expect(entity.items![0].image).toBe(
      'https://hk.on.cc/hk/bkn/cnt/news/20240512/photo/bkn-20240512033056489-0512_00822_001_01p.jpg?20240512033354',
    );
    expect(entity.items![0].keywords).toBeUndefined();
  });
});
