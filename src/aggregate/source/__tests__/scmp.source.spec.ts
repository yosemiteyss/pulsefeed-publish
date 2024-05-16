import { SanitizeService } from '../../service/sanitize.service';
import { LoggerService } from '@common/logger';
import { NewsCategory } from '@common/model';
import { SCMPSource } from '../scmp.source';
import { Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';

describe('scmp', () => {
  it('should convert feed entity', async () => {
    const file = fs.readFileSync(path.resolve(__dirname, './assets/scmp.xml'), {
      encoding: 'utf8',
    });

    const source = new SCMPSource(new LoggerService(new Logger()), new SanitizeService());
    const entity = await source.getFeedEntity(
      file,
      NewsCategory.TOP,
      'https://www.scmp.com/rss/91/feed',
    );

    expect(entity.id).toBe('ee5be543d70ff8c9978192d600c3b9ced4c785712e59081c500ce7bcc549c4b6');
    expect(entity.title).toBe('News - South China Morning Post');
    expect(entity.description).toBe(
      'All the latest breaking news from Hong Kong, China and around the world',
    );
    expect(entity.link).toBe('https://www.scmp.com/rss/91/feed');
    expect(entity.items!.length).toBeGreaterThan(0);

    expect(entity.items![0].id).toBe(
      'bd8b7f489ed04d57f58ea3b71a03d32a0d182f073239433ce165e51dd20f2876',
    );
    expect(entity.items![0].title).toBe(
      'Hong Kong customs shuts down 2 online stores selling fake luxury goods worth HK$920,000; 2 arrested',
    );
    expect(entity.items![0].link).toBe(
      'https://www.scmp.com/news/hong-kong/law-and-crime/article/3262013/hong-kong-customs-shuts-down-2-online-stores-selling-fake-luxury-goods-worth-hk920000-2-arrested',
    );
    expect(entity.items![0].description).toBe(
      'Customs officers arrest two people, with consumers warned fake cosmetic products and perfumes could pose health and safety risks.',
    );

    const publishedAt = entity.items![0].publishedAt as Date;
    expect(publishedAt.getTime()).toBe(
      new Date(Date.parse('Thu, 09 May 2024 15:56:44 +0800')).getTime(),
    );
    expect(entity.items![0].category).toBe(NewsCategory.TOP);
    expect(entity.items![0].image).toBe(
      'https://cdn.i-scmp.com/sites/default/files/styles/1280x720/public/d8/images/canvas/2024/05/09/890b0fe6-684f-459d-88e5-2bb7a35895a7_3929ac31.jpg?itok=nKcEBw6G',
    );
    expect(entity.items![0].keywords).toBeUndefined();
  });
});
