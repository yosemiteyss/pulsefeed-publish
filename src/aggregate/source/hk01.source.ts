import { FeedEntity, NewsEntity, SourceEntity } from '@common/db/entity';
import { NewsCategory } from '@common/model';
import { NewsSource } from './news.source';
import { DeepPartial } from 'typeorm';

export class HK01Source extends NewsSource {
  override getBaseURL(): string {
    return 'https://web-data.api.hk01.com/v2/page';
  }

  override getCategoryPaths(): Partial<Record<NewsCategory, string[]>> {
    return {
      [NewsCategory.LOCAL]: ['/zone/1', '/zone/10'],
      [NewsCategory.ENTERTAINMENT]: ['/zone/2', '/zone/19'],
      [NewsCategory.SPORTS]: ['/zone/3'],
      [NewsCategory.WORLD]: ['/zone/4'],
      [NewsCategory.CHINA]: ['/zone/5'],
      [NewsCategory.LIFESTYLE]: ['/zone/6', '/zone/8', '/zone/9', '/zone/13', '/zone/20'],
      [NewsCategory.TOP]: ['/zone/7'],
      [NewsCategory.TECHNOLOGY]: ['/zone/11'],
      [NewsCategory.POLITICS]: ['/zone/12'],
      [NewsCategory.FINANCE]: ['/zone/14'],
      [NewsCategory.EDUCATION]: ['/zone/23'],
      [NewsCategory.HEALTH]: ['/zone/24'],
    };
  }

  protected override buildSourceEntity(): DeepPartial<SourceEntity> {
    return {
      title: 'HK01',
      link: 'https://www.hk01.com/',
      image: 'https://asset.brandfetch.io/iduOmR6IDK/id5ixqiq8-.jpeg',
    };
  }

  protected override getRequestParams(): object | undefined {
    return {
      bucketId: '00000',
    };
  }

  protected override async buildFeedEntity(
    responseData: any,
    category: NewsCategory,
    url: string,
  ): Promise<DeepPartial<FeedEntity>> {
    const meta = responseData['meta'];
    const sections = responseData['sections'];

    const sectionItems: any[] = sections.map((section: any) => section['items']).flat();
    const items = sectionItems.map((item) => this.buildItemEntity(item, category));

    return {
      title: meta['ogTitle'],
      description: meta['ogDesc'],
      link: meta['canonicalUrl'],
      items,
    };
  }

  private buildItemEntity(item: any, category: NewsCategory): DeepPartial<NewsEntity> {
    return {
      title: item['data']['title'],
      link: item['data']['canonicalUrl'],
      category: category,
      description: item['data']['description'],
      image: item['data']['mainImage']['cdnUrl'],
      publishedAt: new Date(item['data']['publishTime'] * 1000),
      keywords: item['data']['tags']?.map((tag: any) => tag['tagName']),
    };
  }
}
