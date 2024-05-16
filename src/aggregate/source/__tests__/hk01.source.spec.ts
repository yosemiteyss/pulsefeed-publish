import { SanitizeService } from '../../service/sanitize.service';
import { LoggerService } from '@common/logger';
import { NewsCategory } from '@common/model';
import { HK01Source } from '../hk01.source';
import { Logger } from '@nestjs/common';
import { sha256 } from '@common/utils';
import * as path from 'path';
import * as fs from 'fs';

describe('hk01', () => {
  it('should parse feed entity', async () => {
    const file = fs.readFileSync(path.resolve(__dirname, './assets/hk01.json'), {
      encoding: 'utf8',
    });

    const source = new HK01Source(new LoggerService(new Logger()), new SanitizeService());
    const entity = await source.getFeedEntity(
      JSON.parse(file),
      NewsCategory.LOCAL,
      'https://web-data.api.hk01.com/v2/page/zone/1?bucketId=00000',
    );

    expect(entity.id).toBe('7339c7ef7b81fd7a5738f32117db06d9bb6214c039a0f43195055fb3ac297a41');
    expect(entity.title).toBe('即時新聞｜香港新聞、突發新聞頭條｜香港01｜1700萬讀者在看');
    expect(entity.description).toBe(
      '最新最全面的熱門香港新聞、即時新聞、要聞港聞、頭條新聞及專題報道。',
    );
    expect(entity.link).toBe('https://www.hk01.com/zone/1/港聞');
    expect(entity.items!.length).toBeGreaterThan(0);

    expect(entity.items![0].id).toBe(
      sha256(
        'https://www.hk01.com/社會新聞/1017530/直播-觀塘線太子至何文田站7-28停服務-九巴兩免費路線接載乘客',
      ),
    );
    expect(entity.items![0].title).toBe(
      '直播｜觀塘線太子至何文田站7.28停服務　九巴兩免費路線接載乘客',
    );
    expect(entity.items![0].link).toBe(
      'https://www.hk01.com/社會新聞/1017530/直播-觀塘線太子至何文田站7-28停服務-九巴兩免費路線接載乘客',
    );
    expect(entity.items![0].description).toBe(
      '港鐵去年宣布鐵路設施更新及保養維修開支，未來五年將增加兩成至逾650億元。消息指，港鐵正計劃更新及維修觀塘線設備，特定日子，列車將不停部份車',
    );

    const publishedAt = entity.items![0].publishedAt as Date;
    expect(publishedAt.getTime()).toBe(1715148982000);
    expect(entity.items![0].category).toBe(NewsCategory.LOCAL);
    expect(entity.items![0].image).toBe(
      'https://cdn.hk01.com/di/media/images/dw/20240508/864886305547358208296814.jpeg/nfHHALbVI_gdOVbjEC24D1BkrGQLEopvqdS--qnUvvo',
    );
    expect(entity.items![0].keywords).toEqual(['港鐵', '觀塘', '01 Video', '我主場']);
  });
});
