import RSSFeed from '../../parser/model/rss-feed';
import { RSSNewsSource } from './rss-news.source';
import { SourceEntity } from '@common/db/entity';
import { NewsCategory } from '@common/model';
import { DeepPartial } from 'typeorm';

export class MingpaoSource extends RSSNewsSource {
  protected override buildSourceEntity(): DeepPartial<SourceEntity> {
    return {
      title: '明報',
      link: 'https://www.mingpao.com',
      image: 'https://creative.mingpao.com/image/mplogos/mingpao.png',
    };
  }

  override getBaseURL(): string {
    return 'https://news.mingpao.com/rss';
  }

  override getCategoryPaths(): Partial<Record<NewsCategory, string[]>> {
    return {
      [NewsCategory.TOP]: ['/ins/s00024.xml', '/pns/s00001.xml'],
      [NewsCategory.LOCAL]: [
        '/ins/s00001.xml',
        '/ins/s00022.xml',
        '/pns/s00002.xml',
        '/pns/s00005.xml',
      ],
      [NewsCategory.POLITICS]: ['/pns/s00003.xml', '/pns/s00012.xml', '/pns/s00018.xml'],
      [NewsCategory.FINANCE]: ['/ins/s00002.xml', '/ins/s00003.xml', '/pns/s00004.xml'],
      [NewsCategory.ENTERTAINMENT]: ['/ins/s00007.xml', '/pns/s00016.xml'],
      [NewsCategory.CHINA]: ['/ins/s00004.xml', '/pns/s00013.xml'],
      [NewsCategory.WORLD]: ['/ins/s00005.xml', '/pns/s00014.xml', '/pns/s00017.xml'],
      [NewsCategory.EDUCATION]: ['/pns/s00011.xml'],
      [NewsCategory.SPORTS]: ['/ins/s00006.xml', '/pns/s00015.xml'],
    };
  }

  protected override getFeedLink(feed: RSSFeed, feedUrl: string): string | undefined {
    return feed.docs;
  }
}
