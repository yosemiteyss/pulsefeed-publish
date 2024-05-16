import { SanitizeService } from '../../service/sanitize.service';
import { NytimesCnSource } from '../nytimes-cn.source';
import { LoggerService } from '@common/logger';
import { NewsCategory } from '@common/model';
import { Logger } from '@nestjs/common';
import { sha256 } from '@common/utils';
import * as path from 'path';
import * as fs from 'fs';

describe('nytimes-cn', () => {
  it('should convert feed entity', async () => {
    const file = fs.readFileSync(path.resolve(__dirname, './assets/nytimes-cn.html'), {
      encoding: 'utf8',
    });

    const source = new NytimesCnSource(new LoggerService(new Logger()), new SanitizeService());
    const entity = await source.getFeedEntity(
      file,
      NewsCategory.WORLD,
      'https://m.cn.nytimes.com/world',
    );

    expect(entity.id).toBe(sha256('https://m.cn.nytimes.com/world'));
    expect(entity.title).toBe('國際 - 紐約時報中文網');
    expect(entity.description).toBe('');
    expect(entity.link).toBe('https://m.cn.nytimes.com/world');
    expect(entity.items!.length).toBeGreaterThan(0);

    expect(entity.items![0].id).toBe(
      sha256('https://cn.nytimes.com/world/20240513/xi-europe-diplomacy/zh-hant/'),
    );
    expect(entity.items![0].title).toBe('習近平能打消歐洲對華疑慮嗎');
    expect(entity.items![0].link).toBe(
      'https://cn.nytimes.com/world/20240513/xi-europe-diplomacy/zh-hant/',
    );
    expect(entity.items![0].description).toBe(
      '習近平在法國、塞爾維亞和匈牙利受到熱情歡迎，中國官媒將他的訪問稱為「勝利之旅」，但此行並沒有在貿易、俄烏戰爭等導致中歐關係緊張的問題上取得進展。',
    );

    expect(entity.items![0].publishedAt).toBeUndefined();
    expect(entity.items![0].category).toBe(NewsCategory.WORLD);
    expect(entity.items![0].image).toBe(
      'https://static01.nyt.com/images/2024/05/10/multimedia/10xi-europe-2-tpwz/10xi-europe-2-tpwz-thumbLarge.jpg',
    );
    expect(entity.items![0].keywords).toBeUndefined();
  });
});
