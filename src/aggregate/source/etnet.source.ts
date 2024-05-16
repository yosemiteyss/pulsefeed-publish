import RSSFeed from '../../parser/model/rss-feed';
import { RSSNewsSource } from './rss-news.source';
import { NewsCategory } from '@common/model';
import { SourceEntity } from '@common/db';
import { DeepPartial } from 'typeorm';

export class EtnetSource extends RSSNewsSource {
  protected override buildSourceEntity(): DeepPartial<SourceEntity> {
    return {
      title: 'etnet 經濟通',
      link: 'http://www.etnet.com.hk',
      image: 'https://asset.brandfetch.io/idcLmZqp-J/idw-8XLR4G.jpeg',
    };
  }

  override getBaseURL(): string {
    return 'https://www.etnet.com.hk/www/tc/news/rss.php';
  }

  override getCategoryPaths(): Partial<Record<NewsCategory, string[]>> {
    return {
      [NewsCategory.FINANCE]: [
        '?section=editor',
        '?section=special',
        //'?section=rumour',
        //'?section=commentary',
      ],
    };
  }

  protected override getFeedLink(feed: RSSFeed, feedUrl: string): string | undefined {
    return feedUrl;
  }
}
