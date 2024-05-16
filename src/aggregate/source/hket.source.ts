import RSSItem from '../../parser/model/rss-item';
import RSSFeed from '../../parser/model/rss-feed';
import { RSSNewsSource } from './rss-news.source';
import { NewsCategory } from '@common/model';
import { SourceEntity } from '@common/db';
import { DeepPartial } from 'typeorm';

export class HKETSource extends RSSNewsSource {
  protected override buildSourceEntity(): DeepPartial<SourceEntity> {
    return {
      title: 'HKET經濟日報',
      link: 'https://www.hket.com/',
      image: 'https://asset.brandfetch.io/iddIq3P2DT/idvOKPuUMC.png',
    };
  }

  override getBaseURL(): string {
    return 'https://www.hket.com/rss';
  }

  override getCategoryPaths(): Partial<Record<NewsCategory, string[]>> {
    return {
      [NewsCategory.LOCAL]: ['/hongkong'],
      [NewsCategory.FINANCE]: ['/finance'],
      [NewsCategory.CHINA]: ['/china'],
      [NewsCategory.WORLD]: ['/world'],
      [NewsCategory.LIFESTYLE]: ['/lifestyle'],
      [NewsCategory.TECHNOLOGY]: ['/technology'],
      [NewsCategory.ENTERTAINMENT]: ['/entertainment'],
    };
  }

  protected override getItemImage(item: RSSItem): string | undefined {
    if (item.image) {
      return (
        item.image
          // Replace subdomain
          .replace(/\/\/[^\/]*\.hket\.com/, '//static04.hket.com')
          // Replace image size
          .replace(/(_)\d+(?=\.(jpg|png|gif))/, '_1024')
      );
    }

    return item.image;
  }

  protected override getFeedLink(feed: RSSFeed, feedUrl: string): string | undefined {
    return feed.docs;
  }
}
