import { SanitizeService } from '../../service/sanitize.service';
import { LoggerService } from '@common/logger';
import { NewsCategory } from '@common/model';
import { HKETSource } from '../hket.source';
import { Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';

describe('hket', () => {
  it('should parse feed entity', async () => {
    const file = fs.readFileSync(path.resolve(__dirname, './assets/hket.xml'), {
      encoding: 'utf8',
    });

    const source = new HKETSource(new LoggerService(new Logger()), new SanitizeService());
    const entity = await source.getFeedEntity(
      file,
      NewsCategory.LOCAL,
      'https://www.hket.com/rss/hongkong',
    );

    expect(entity.id).toBe('d957c50c2776efc9a9f3a84080e65ec0797c0a3b8207d283696759ebfd2d3b00');
    expect(entity.title).toBe('香港新聞RSS - 香港經濟日報 hket.com');
    expect(entity.description).toBe(
      '訂閱新聞RSS，獲取最新香港新聞, 時事 - RSS - 香港經濟日報 hket.com',
    );
    expect(entity.link).toBe('https://www.hket.com/rss/hongkong');
    expect(entity.items!.length).toBeGreaterThan(0);

    expect(entity.items![0].id).toBe(
      'c11ceb9c8461134fa983505c399306f12d41a0474330bc59268014298aa8223b',
    );
    expect(entity.items![0].title).toBe('【交通意外】龍翔道電單車與私家車相撞　部份行車線一度封閉');
    expect(entity.items![0].link).toBe('https://topick.hket.com/article/3754543');
    expect(entity.items![0].description).toBe(
      '龍翔道發生交通意外。警方今早（6日）8時16分接報，指在一輛電單車沿黃大仙龍翔道往荃灣方向行駛時，懷疑意外撞到一輛私家車。救援人員接報到場，電單車司機擦傷，清醒被送院治理。運輸署指，受意外影響，龍翔道...',
    );

    const publishedAt = entity.items![0].publishedAt as Date;
    expect(publishedAt.getTime()).toBe(
      new Date(Date.parse('Mon, 06 May 2024 09:22:00 +0800')).getTime(),
    );
    expect(entity.items![0].category).toBe(NewsCategory.LOCAL);
    expect(entity.items![0].image).toBe(
      'https://static04.hket.com/res/v3/image/content/3750000/3754543/1a404ca588e4-4d6d-9f30-f1ee05fe2311_1024.jpg',
    );
    expect(entity.items![0].keywords).toBeUndefined();
  });
});
