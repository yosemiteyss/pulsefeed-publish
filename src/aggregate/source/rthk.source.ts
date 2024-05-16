import RSSFeed from '../../parser/model/rss-feed';
import { RSSNewsSource } from './rss-news.source';
import { SourceEntity } from '@common/db/entity';
import { NewsCategory } from '@common/model';
import { DeepPartial } from 'typeorm';

export class RTHKSource extends RSSNewsSource {
  protected override buildSourceEntity(): DeepPartial<SourceEntity> {
    return {
      title: 'RTHK 香港電台',
      link: 'https://www.rthk.hk/',
      image:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Radio_Television_Hong_Kong_Logo.svg/1200px-Radio_Television_Hong_Kong_Logo.svg.png',
    };
  }

  override getBaseURL(): string {
    return 'https://rthk.hk/rthk/news/rss';
  }

  protected override getFeedLink(feed: RSSFeed, feedUrl: string): string | undefined {
    return feedUrl;
  }

  override getCategoryPaths(): Partial<Record<NewsCategory, string[]>> {
    return {
      [NewsCategory.LOCAL]: ['/c_expressnews_clocal.xml'],
      [NewsCategory.CHINA]: ['/c_expressnews_greaterchina.xml'],
      [NewsCategory.WORLD]: ['/c_expressnews_cinternational.xml'],
      [NewsCategory.FINANCE]: ['/c_expressnews_cfinance.xml'],
      [NewsCategory.SPORTS]: ['/c_expressnews_csport.xml'],
    };
  }
}
