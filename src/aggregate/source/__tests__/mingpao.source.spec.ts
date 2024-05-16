import { SanitizeService } from '../../service/sanitize.service';
import { MingpaoSource } from '../mingpao.source';
import { LoggerService } from '@common/logger';
import { NewsCategory } from '@common/model';
import { Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';

describe('mingpao', () => {
  it('should convert feed entity', async () => {
    const file = fs.readFileSync(path.resolve(__dirname, './assets/mingpao.xml'), {
      encoding: 'utf8',
    });

    const source = new MingpaoSource(new LoggerService(new Logger()), new SanitizeService());
    const entity = await source.getFeedEntity(
      file,
      NewsCategory.TOP,
      'https://web-data.api.hk01.com/v2/page/zone/1?bucketId=00000',
    );

    expect(entity.id).toBe('7f27af215fc99215bfa53a3625116055c8314ca71bc8087ea68d3e5c5ce84b28');
    expect(entity.title).toBe('明報新聞網-每日明報 RSS 要聞');
    expect(entity.description).toBe('明報新聞網-每日明報 RSS');
    expect(entity.link).toBe('https://news.mingpao.com/rss/pns/s00001.xml');
    expect(entity.items!.length).toBeGreaterThan(0);

    expect(entity.items![0].id).toBe(
      '2fed1fee05fa5c4a083a39ebf69297d1b10ad6b061a986540aeda9defcc85b34',
    );
    expect(entity.items![0].title).toBe(
      '泄密查冊網承辦商 開發屢壞康體通 議員促「停賽」 資科辦：全政府檢視保安一周內匯報',
    );
    expect(entity.items![0].link).toBe(
      'https://news.mingpao.com/pns/%e8%a6%81%e8%81%9e/article/20240505/s00001/1714848075237/%e6%b3%84%e5%af%86%e6%9f%a5%e5%86%8a%e7%b6%b2%e6%89%bf%e8%be%a6%e5%95%86-%e9%96%8b%e7%99%bc%e5%b1%a2%e5%a3%9e%e5%ba%b7%e9%ab%94%e9%80%9a-%e8%ad%b0%e5%93%a1%e4%bf%83%e3%80%8c%e5%81%9c%e8%b3%bd%e3%80%8d-%e8%b3%87%e7%a7%91%e8%be%a6-%e5%85%a8%e6%94%bf%e5%ba%9c%e6%aa%a2%e8%a6%96%e4%bf%9d%e5%ae%89%e4%b8%80%e5%91%a8%e5%85%a7%e5%8c%af%e5%a0%b1',
    );
    expect(entity.items![0].description).toBe(
      '【明報專訊】公司註冊處電子服務網站現資料外泄風險，事隔兩周公布調查發現約11萬人受影響。翻查資料，內地央企「航天科工集團」子公司「​​航天信息股份有限公司」2018年以6.22億元中標開發該系統。公司註冊處回覆本報查詢確認該公司為系統承辦商，檢視合約條款後會考慮採取跟進行動，又稱截至昨日未收到任何人報告資料外泄。翻查資料，涉事公司亦為康文署供應SmartPLAY康體通訂場系統，曾現「塞車」及重複訂場等問題。選委界議員吳傑莊認為應暫停涉事承辦商投標新政府合約，檢視其專業水平及研究有否追究條款。',
    );

    const publishedAt = entity.items![0].publishedAt as Date;
    expect(publishedAt.getTime()).toBe(
      new Date(Date.parse('Sat, 04 May 2024 20:30:00 GMT')).getTime(),
    );
    expect(entity.items![0].category).toBe(NewsCategory.TOP);
    expect(entity.items![0].image).toBe(
      'https://fs.mingpao.com/pns/20240505/s00006/63593e96f82c4dbdafb11be92ffc68b7.jpg',
    );
    expect(entity.items![0].keywords).toEqual([
      '私隱專員公署',
      '私隱條例',
      '資科辦',
      '航天信息股份有限公司',
      '資料外泄',
      '公司註冊處',
    ]);
  });
});
