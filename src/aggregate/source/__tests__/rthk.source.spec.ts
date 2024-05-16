import { SanitizeService } from '../../service/sanitize.service';
import { LoggerService } from '@common/logger';
import { NewsCategory } from '@common/model';
import { RTHKSource } from '../rthk.source';
import { Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';

describe('rthk', () => {
  it('should parse feed entity', async () => {
    const file = fs.readFileSync(path.resolve(__dirname, './assets/rthk.xml'), {
      encoding: 'utf8',
    });

    const source = new RTHKSource(new LoggerService(new Logger()), new SanitizeService());
    const entity = await source.getFeedEntity(
      file,
      NewsCategory.LOCAL,
      'https://rthk.hk/news/rss/c_expressnews_clocal.xml',
    );

    expect(entity.id).toBe('24f9f6e7101c9551d4e9034ca21a724f682c849e8fb5c6cf2171259daf76e9be');
    expect(entity.title).toBe('rthk.hk - 即時新聞: 本地');
    expect(entity.description).toBe('rthk.hk - 即時新聞: 本地');
    expect(entity.link).toBe('https://rthk.hk/news/rss/c_expressnews_clocal.xml');
    expect(entity.items!.length).toBeGreaterThan(0);

    expect(entity.items![0].id).toBe(
      'bd4238402d0ff819e40c32a3db09e934f513c0e4bdfc28efa570d01ac8b70aca',
    );
    expect(entity.items![0].title).toBe('調查發現近半數受訪長者有子女曾於過去3年移居外地');
    expect(entity.items![0].description).toBe(
      '一項調查顯示，近半數受訪長者的子女曾於過去3年移居外地，當中超過三成是75歲或以上年老長者群體。' +
        '循道衛理中心於2023年6月至12月期間，向205名本港65歲或以上的長者進行網上問卷調查，並邀請部份調查對象作深入訪談，發現約48%受訪長者有1名或多於1名子女，曾於過去3年移居外地，75歲或以上年老長者佔整體受訪長者31%；另外近7成由65至74歲。' +
        '調查又發現，約75%受訪長者現時由伴侣或其他年長的親友照顧。機構認為反映「以老護老」的情況在這類「留港長者」老齡化的情況下趨向普遍。受訪的長者亦預視數年後身體情況改變，普遍需要「情緒支援」、「服務轉介」及「實質陪伴」三方面服務。' +
        '循道衛理中心預備推行一個以跨專業為本的社區健康計劃，以個案管理模式監察這群「留港長者」的身體狀況，並由社工、物理治療師、護理人員等提供一站式服務和治理。',
    );
    expect(entity.items![0].link).toBe(
      'https://news.rthk.hk/rthk/ch/component/k2/1751961-20240506.htm',
    );

    const publishedAt = entity.items![0].publishedAt as Date;
    expect(publishedAt.getTime()).toBe(
      new Date(Date.parse('Mon, 06 May 2024 11:32:05 +0800')).getTime(),
    );
    expect(entity.items![0].category).toBe(NewsCategory.LOCAL);
    expect(entity.items![0].image).toBeUndefined();
    expect(entity.items![0].keywords).toBeUndefined();
  });
});
