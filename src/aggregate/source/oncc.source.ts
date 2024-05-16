import { FeedEntity, NewsEntity, SourceEntity } from '@common/db';
import { NewsCategory } from '@common/model';
import { NewsSource } from './news.source';
import { DeepPartial } from 'typeorm';
import * as moment from 'moment';

export class OnccSource extends NewsSource {
  protected override buildSourceEntity(): DeepPartial<SourceEntity> {
    return {
      title: 'on.cc 東網',
      link: 'https://hk.on.cc/',
      image: 'https://on.cc/img/oncc_logo_v2.png',
    };
  }

  override getBaseURL(): string {
    return 'https://hk.on.cc/hk/bkn';
  }

  override getCategoryPaths(): Partial<Record<NewsCategory, string[]>> {
    return {
      [NewsCategory.LOCAL]: ['/js/totop_news.js'],
      [NewsCategory.CHINA]: ['/js/totop_cnnews.js'],
      [NewsCategory.WORLD]: ['/js/totop_intnews.js'],
      [NewsCategory.FINANCE]: ['/js/totop_finance.js'],
      [NewsCategory.SPORTS]: ['/js/totop_sport.js'],
    };
  }

  protected override async buildFeedEntity(
    responseData: any,
    category: NewsCategory,
    url: string,
  ): Promise<DeepPartial<FeedEntity>> {
    const data: any = responseData[0];
    const focusNews: any[] = data['focusNews'];
    const items = focusNews.map((item) => this.buildItemEntity(item, category));

    return {
      title: data['sectCode'],
      link: url,
      items,
    };
  }

  private buildItemEntity(item: any, category: NewsCategory): DeepPartial<NewsEntity> {
    const link = this.getBaseURL() + item['link'];

    return {
      title: item['title'],
      link,
      category,
      description: item['content'],
      image: this.getBaseURL() + item['thumbnail'],
      publishedAt: moment(item['pubDate'], 'YYYY-MM-DD HH:mm:ss').toDate(),
    };
  }
}
