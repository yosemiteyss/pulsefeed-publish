import { SourceEntity } from '@common/db/entity/source.entity';
import { RSSNewsSource } from './rss-news.source';
import { NewsCategory } from '@common/model';
import { DeepPartial } from 'typeorm';

export class BBCCNSource extends RSSNewsSource {
  override getBaseURL(): string {
    return 'https://www.bbc.co.uk/zhongwen/trad';
  }

  override getCategoryPaths(): Partial<Record<NewsCategory, string[]>> {
    return {
      [NewsCategory.TOP]: ['/index.xml'],
    };
  }

  protected override buildSourceEntity(): DeepPartial<SourceEntity> {
    return {
      title: 'BBC News 中文',
      link: 'https://www.bbc.co.uk/zhongwen',
      image: 'https://asset.brandfetch.io/idtEghWGp4/idDlTthx3l.png',
    };
  }
}
