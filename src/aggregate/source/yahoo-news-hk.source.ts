import RSSItem from '../../parser/model/rss-item';
import { RSSNewsSource } from './rss-news.source';
import { SourceEntity } from '@common/db/entity';
import { NewsCategory } from '@common/model';
import { DeepPartial } from 'typeorm';

export class YahooNewsHKSource extends RSSNewsSource {
  override getBaseURL(): string {
    return 'https://hk.news.yahoo.com/rss';
  }

  override getCategoryPaths(): Partial<Record<NewsCategory, string[]>> {
    return {
      [NewsCategory.TOP]: ['/'],
      [NewsCategory.LOCAL]: ['/hong-kong', '/topic', '/supplement'],
      [NewsCategory.FINANCE]: ['/business'],
      [NewsCategory.ENTERTAINMENT]: ['/entertainment'],
      [NewsCategory.SPORTS]: ['/sports'],
      [NewsCategory.WORLD]: ['/world'],
      [NewsCategory.HEALTH]: ['/health'],
    };
  }

  protected override buildSourceEntity(): DeepPartial<SourceEntity> {
    return {
      title: 'Yahoo 新聞',
      link: 'https://hk.news.yahoo.com',
      image: 'https://asset.brandfetch.io/idgoJtPkpl/idGA9wfHeu.svg',
    };
  }

  protected override getItemImage(item: RSSItem): string | undefined {
    return item.content;
  }
}
