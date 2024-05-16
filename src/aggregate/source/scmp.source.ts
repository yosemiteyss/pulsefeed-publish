import { RSSNewsSource } from './rss-news.source';
import { SourceEntity } from '@common/db/entity';
import { NewsCategory } from '@common/model';
import { DeepPartial } from 'typeorm';

export class SCMPSource extends RSSNewsSource {
  override getBaseURL(): string {
    return 'https://www.scmp.com/rss';
  }

  override getCategoryPaths(): Partial<Record<NewsCategory, string[]>> {
    return {
      [NewsCategory.TOP]: ['/91/feed'],
      [NewsCategory.LOCAL]: ['/2/feed'],
      [NewsCategory.CHINA]: ['/4/feed'],
      [NewsCategory.WORLD]: ['/3/feed', '/5/feed'],
      [NewsCategory.FINANCE]: ['/92/feed', '/96/feed'],
      [NewsCategory.TECHNOLOGY]: ['/36/feed'],
      [NewsCategory.LIFESTYLE]: ['/94/feed', '/72/feed'],
      [NewsCategory.CULTURE]: ['/322296/feed'],
      [NewsCategory.SPORTS]: ['/95/feed'],
    };
  }

  protected override buildSourceEntity(): DeepPartial<SourceEntity> {
    return {
      title: 'South China Morning Post',
      link: 'https://www.scmp.com',
      image: 'https://asset.brandfetch.io/idqyZMY8gD/id6JAKj5mM.jpeg',
    };
  }
}
