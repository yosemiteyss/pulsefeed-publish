import { FeedEntity, NewsEntity, SourceEntity } from '@common/db';
import { parseRelativeDate } from '../../utils/date.utils';
import { NewsCategory } from '@common/model';
import { NewsSource } from './news.source';
import { DeepPartial } from 'typeorm';
import * as cheerio from 'cheerio';

export class NowNewsSource extends NewsSource {
  override getBaseURL(): string {
    return 'https://news.now.com';
  }

  protected override buildSourceEntity(): DeepPartial<SourceEntity> {
    return {
      title: 'Now 新聞',
      link: 'https://news.now.com',
      image: 'https://news.now.com/revamp2014/images/logo.png',
    };
  }

  override getCategoryPaths(): Partial<Record<NewsCategory, string[]>> {
    return {
      [NewsCategory.LOCAL]: ['/mobile/local'],
      [NewsCategory.WORLD]: ['/mobile/international'],
      [NewsCategory.ENTERTAINMENT]: ['/mobile/entertainment'],
      [NewsCategory.LIFESTYLE]: ['/mobile/life'],
      [NewsCategory.TECHNOLOGY]: ['/mobile/technology'],
      [NewsCategory.FINANCE]: ['/mobile/finance'],
      [NewsCategory.SPORTS]: ['/mobile/sports'],
    };
  }

  protected getRequestHeaders(): object {
    const headers = super.getRequestHeaders();
    headers['User-Agent'] =
      'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36';
    return headers;
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

    $root('ul.newsList > li.newsWrap').each((index, element) => {
      const $element = $root(element);
      items.push(this.buildItemEntity($element, category));
    });

    return { title, description, link, items };
  }

  private buildItemEntity(
    $element: cheerio.Cheerio,
    category: NewsCategory,
  ): DeepPartial<NewsEntity> {
    const title = $element.find('.newsTitle').text().trim();
    const image = $element.find('.newsImgWrap img')?.attr('src');
    const link = this.getBaseURL() + $element.find('a').attr('href');
    const publishedAt = parseRelativeDate($element.find('.newsTime').text().trim());

    return {
      title,
      link,
      category,
      image,
      publishedAt,
    };
  }
}
