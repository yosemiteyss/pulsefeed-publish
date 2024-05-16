import { SanitizeService } from '../../service/sanitize.service';
import { YahooNewsHKSource } from '../yahoo-news-hk.source';
import { LoggerService } from '@common/logger';
import { NewsCategory } from '@common/model';
import { Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';

describe('yahoo-news-hk', () => {
  it('should convert feed entity', async () => {
    const file = fs.readFileSync(path.resolve(__dirname, './assets/yahoo_news_hk.xml'), {
      encoding: 'utf8',
    });

    const source = new YahooNewsHKSource(new LoggerService(new Logger()), new SanitizeService());
    const entity = await source.getFeedEntity(
      file,
      NewsCategory.LOCAL,
      'https://hk.news.yahoo.com/hong-kong',
    );

    expect(entity.id).toBe('2973326ab0dfbe78062939969406feab0e47cf310ed2f35888fd90da1957bf6f');
    expect(entity.title).toBe('港聞新聞 - Yahoo 新聞');
    expect(entity.description).toBe(
      '瀏覽 Yahoo 新聞上的最新港聞新聞。查閱最新報道，包括相關的分析與評論。',
    );
    expect(entity.link).toBe('https://hk.news.yahoo.com/hong-kong/');
    expect(entity.items!.length).toBeGreaterThan(0);

    expect(entity.items![0].id).toBe(
      '04d9b583ab332699b3d767894aa3b9434ac4a12087e44c980952ac2bb8e2f7e1',
    );
    expect(entity.items![0].title).toBe('丘應樺：政府一直支援中小企渡過難關');
    expect(entity.items![0].link).toBe(
      'https://hk.news.yahoo.com/%E4%B8%98%E6%87%89%E6%A8%BA-%E6%94%BF%E5%BA%9C-%E7%9B%B4%E6%94%AF%E6%8F%B4%E4%B8%AD%E5%B0%8F%E4%BC%81%E6%B8%A1%E9%81%8E%E9%9B%A3%E9%97%9C-090509464.html',
    );
    expect(entity.items![0].description).toBe(
      '【Now新聞台】商務及經濟發展局局長丘應樺稱，政府需要支援中小企渡過難關，令經濟全面復甦。 丘應樺及金管局總裁余偉文，出席經民聯舉辦的發展經濟及支援中小企論壇。丘應樺致辭時稱，疫情後政府一直支援中小企，包括提供融資擔保計劃，令他們增強競爭力。商務及經濟發展局局長丘應樺：「這個計劃在過去數年發揮明顯的功效，紓緩了很多中小企的資金流動問題。截至2024年3月底，計劃合共批出超過2700多億元貸款，惠及接近6萬2千間企業，以及78萬名員工，減輕疫情下的結業潮和遣散問題。」#要聞',
    );

    const publishedAt = entity.items![0].publishedAt as Date;
    expect(publishedAt.getTime()).toBe(
      new Date(Date.parse('Mon, 06 May 2024 09:05:09 +0800')).getTime(),
    );
    expect(entity.items![0].category).toBe(NewsCategory.LOCAL);
    expect(entity.items![6].image).toBe(
      'https://media.zenfs.com/ko/afp.com.hk/b39687caf487ae415e18472a4203197a',
    );
    expect(entity.items![0].keywords).toBeUndefined();
  });
});
