import { createRSSParser } from '../../parser/create-rss-parser';
import { FeedEntity, NewsEntity } from '@common/db/entity';
import RSSFeed from '../../parser/model/rss-feed';
import RSSItem from '../../parser/model/rss-item';
import { NewsCategory } from '@common/model';
import { NewsSource } from './news.source';
import { DeepPartial } from 'typeorm';

export abstract class RSSNewsSource extends NewsSource {
  protected getItemImage(item: RSSItem): string | undefined {
    return item?.image;
  }

  protected getItemDesc(description?: string): string | undefined {
    // Replace double newline
    return description?.replace(/\n\n/g, '\n');
  }

  protected getFeedLink(feed: RSSFeed, feedUrl: string): string | undefined {
    return feed.link || feed.docs;
  }

  protected override async buildFeedEntity(
    responseData: any,
    category: NewsCategory,
    url: string,
  ): Promise<DeepPartial<FeedEntity>> {
    const parser = createRSSParser(responseData);
    const rssFeed = parser.parse();

    const feedLink = this.getFeedLink(rssFeed, url);

    const items = rssFeed.items.map((item) => this.buildItemEntity(item, category));

    return {
      title: rssFeed.title,
      description: rssFeed.description,
      link: feedLink,
      items,
    };
  }

  private buildItemEntity(item: RSSItem, category: NewsCategory): DeepPartial<NewsEntity> {
    return {
      title: item.title,
      link: item.link,
      category: category,
      description: this.getItemDesc(item.description),
      image: this.getItemImage(item),
      publishedAt: item.published ?? new Date(),
      keywords: item.category,
    };
  }
}
