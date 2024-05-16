import { SanitizeService } from '../../service/sanitize.service';
import { BBCCNSource } from '../bbc-cn.source';
import { LoggerService } from '@common/logger';
import { NewsCategory } from '@common/model';
import { Logger } from '@nestjs/common';
import { sha256 } from '@common/utils';
import * as path from 'path';
import * as fs from 'fs';

describe('bbc-cn', () => {
  it('should convert rss feed entity', async () => {
    const file = fs.readFileSync(path.resolve(__dirname, './assets/bbc_cn.xml'), {
      encoding: 'utf8',
    });

    const source = new BBCCNSource(new LoggerService(new Logger()), new SanitizeService());
    const entity = await source.getFeedEntity(
      file,
      NewsCategory.TOP,
      'https://www.bbc.co.uk/zhongwen/trad/index.xml',
    );

    expect(entity.id).toBe('0a8380a4b4f607466c90e830e31b06d0ab05a789d9e965cd63014dfb73d3bbaf');
    expect(entity.title).toBe('BBC Chinese - 主頁');
    expect(entity.description).toBe('BBC Chinese - 主頁');
    expect(entity.link).toBe('https://www.bbcchinese.com');
    expect(entity.items!.length).toBeGreaterThan(0);

    expect(entity.items![0].id).toBe(
      sha256('https://www.bbc.com/zhongwen/trad/world-68974813?at_medium=RSS&at_campaign=KARANGA'),
    );
    expect(entity.items![0].title).toBe(
      '習近平到訪「鐵桿朋友」塞爾維亞 反感北約但靠攏歐盟的巴爾幹樞紐',
    );
    expect(entity.items![0].link).toBe(
      'https://www.bbc.com/zhongwen/trad/world-68974813?at_medium=RSS&at_campaign=KARANGA',
    );
    expect(entity.items![0].description).toBe(
      '塞爾維亞近年來一直在深化與中國的關係，儘管這個國家還在繼續推進加入歐盟的談判。2016年習近平上次訪問塞爾維亞時，雙方宣佈建立「全面戰略伙伴關係」，去年兩國進一步簽署自貿協議。',
    );

    const publishedAt = entity.items![0].publishedAt as Date;
    expect(publishedAt.getTime()).toBe(
      new Date(Date.parse('Wed, 08 May 2024 05:02:03 GMT')).getTime(),
    );
    expect(entity.items![0].category).toBe(NewsCategory.TOP);
    expect(entity.items![0].image).toBeUndefined();
    expect(entity.items![0].keywords).toBeUndefined();
  });

  it('should convert atom feed entity', async () => {
    const file = fs.readFileSync(path.resolve(__dirname, './assets/bbc_cn_atom.xml'), {
      encoding: 'utf8',
    });

    const source = new BBCCNSource(new LoggerService(new Logger()), new SanitizeService());
    const entity = await source.getFeedEntity(
      file,
      NewsCategory.WORLD,
      'https://www.bbc.co.uk/zhongwen/trad/world/index.xml',
    );

    expect(entity.id).toBe(sha256('http://www.bbc.co.uk/zhongwen/trad/world/index.xml'));
    expect(entity.title).toBe('bbcchinese.com | 國際');
    expect(entity.description).toBeUndefined();
    expect(entity.link).toBe('https://www.bbc.co.uk/zhongwen/trad/world/index.xml');
    expect(entity.items!.length).toBeGreaterThan(0);

    expect(entity.items![0].id).toBe(
      sha256(
        'http://www.bbc.co.uk/zhongwen/trad/world/2014/09/140925_china_send_troops_to_scudan.shtml',
      ),
    );
    expect(entity.items![0].title).toBe('中國證實派遣700名步兵到南蘇丹維和');
    expect(entity.items![0].link).toBe(
      'https://www.bbc.co.uk/zhongwen/trad/world/2014/09/140925_china_send_troops_to_scudan.shtml',
    );
    expect(entity.items![0].description).toBe(
      '中國國防部發言人耿雁生周四表示，中國決定派遣一700人組成的維和步兵營赴南蘇丹執行聯合國維和任務。',
    );

    const publishedAt = entity.items![0].publishedAt as Date;
    expect(publishedAt.getTime()).toBe(new Date(Date.parse('2014-09-25T09:38:00+00:00')).getTime());
    expect(entity.items![0].category).toBe(NewsCategory.WORLD);
    expect(entity.items![0].image).toBe(
      'https://ichef.bbci.co.uk/wsimagechef/ic/106x60/amz/worldservice/live/assets/images/2014/09/25/140925095203_china_troops_144x81_xinhua_nocredit.jpg',
    );
    expect(entity.items![0].keywords).toEqual([
      '中國',
      '維和',
      '部隊',
      '南蘇丹',
      '步兵營',
      '聯合國維和',
    ]);
  });
});
