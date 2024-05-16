import { SanitizeService } from '../../service/sanitize.service';
import { NowNewsSource } from '../now-news.source';
import { LoggerService } from '@common/logger';
import { NewsCategory } from '@common/model';
import { Logger } from '@nestjs/common';
import { sha256 } from '@common/utils';
import * as path from 'path';
import * as fs from 'fs';

describe('now-news', () => {
  it('should convert feed entity', async () => {
    const file = fs.readFileSync(path.resolve(__dirname, './assets/now_news.html'), {
      encoding: 'utf8',
    });

    const source = new NowNewsSource(new LoggerService(new Logger()), new SanitizeService());
    const entity = await source.getFeedEntity(
      file,
      NewsCategory.LOCAL,
      'https://news.now.com/mobile/local',
    );

    expect(entity.id).toBe(sha256('https://news.now.com/mobile/local'));
    expect(entity.title).toBe('港聞 | Now 新聞');
    expect(entity.description).toBe(
      '全面報道本地消息，即時新聞秒速更新，專題節目深入剖析社會時事。',
    );
    expect(entity.link).toBe('https://news.now.com/mobile/local');
    expect(entity.items!.length).toBeGreaterThan(0);

    expect(entity.items![0].id).toBe(
      sha256('https://news.now.com/mobile/local/player?newsId=560387'),
    );
    expect(entity.items![0].title).toBe('陳茂波稱增自由行城市可帶來更多過夜客 議員冀加強航空交通');
    expect(entity.items![0].link).toBe('https://news.now.com/mobile/local/player?newsId=560387');
    expect(entity.items![0].description).toBeUndefined();

    const publishedAt = entity.items![0].publishedAt as Date;
    const now = new Date();
    now.setMinutes(now.getMinutes() - 31);
    expect(publishedAt.getMinutes()).toBe(now.getMinutes());

    expect(entity.items![0].category).toBe(NewsCategory.LOCAL);
    expect(entity.items![0].image).toBe(
      'https://images-news.now.com/newsimage/NewsImage/CITY-NEW-240512-19.jpg',
    );
    expect(entity.items![0].keywords).toBeUndefined();
  });
});
