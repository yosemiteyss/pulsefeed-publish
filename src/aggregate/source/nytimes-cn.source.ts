import { FeedEntity, NewsEntity, SourceEntity } from '@common/db';
import { NewsCategory } from '@common/model';
import { NewsSource } from './news.source';
import { DeepPartial } from 'typeorm';
import * as cheerio from 'cheerio';

export class NytimesCnSource extends NewsSource {
  protected override buildSourceEntity(): DeepPartial<SourceEntity> {
    return {
      title: '紐約時報中文網',
      link: 'https://m.cn.nytimes.com/',
      image: 'https://asset.brandfetch.io/ida5pjO05F/idVD16ua83.png',
    };
  }

  override getBaseURL(): string {
    return 'https://m.cn.nytimes.com';
  }

  override getCategoryPaths(): Partial<Record<NewsCategory, string[]>> {
    return {
      [NewsCategory.WORLD]: ['/world'],
      [NewsCategory.CHINA]: ['/china'],
      [NewsCategory.FINANCE]: ['/business', '/real-estate'],
      [NewsCategory.TECHNOLOGY]: ['/technology'],
      [NewsCategory.SCIENCE]: ['/science'],
      [NewsCategory.HEALTH]: ['/health'],
      [NewsCategory.EDUCATION]: ['/education'],
      [NewsCategory.CULTURE]: ['/culture'],
      [NewsCategory.LIFESTYLE]: ['/style'],
      [NewsCategory.TRAVEL]: ['/travel'],
      [NewsCategory.OPINION]: ['/opinion'],
    };
  }

  protected override async buildFeedEntity(
    responseData: any,
    category: NewsCategory,
    url: string,
  ): Promise<DeepPartial<FeedEntity>> {
    const $root = cheerio.load(responseData);

    const title = $root('title').text().trim();
    const description = $root('meta[name="description"]').attr('content');
    const link = url;

    const items: DeepPartial<NewsEntity>[] = [];

    $root('ol.article-list > li.regular-item').each((index, element) => {
      const $element = $root(element);
      items.push(this.buildItemEntity($element, category));
    });

    return { title, description, link, items };
  }

  private buildItemEntity(
    $element: cheerio.Cheerio,
    category: NewsCategory,
  ): DeepPartial<NewsEntity> {
    const title = $element.find('h2 span').text().trim();
    const description = $element.find('.summary')?.text()?.trim();
    const image = $element.find('.thumbnail img')?.attr('src');
    const link = $element.find('a')?.attr('href');

    return {
      title,
      description,
      image,
      link,
      category,
    };
  }
}
