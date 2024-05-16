import RSSFeed from './model/rss-feed';
import RSSItem from './model/rss-item';

export default abstract class RSSParser {
  constructor(private readonly xml: any) {}

  parse(): RSSFeed {
    return this.parseFeed(this.xml);
  }

  protected parseFeed(xml: any): RSSFeed {
    const feedObj = this.getFeed(xml);
    const itemsObj = this.getItems(feedObj);

    const feed = this.buildFeed(feedObj);
    const items = itemsObj.map((obj) => this.buildItem(obj));
    feed.items.push(...items);

    return feed;
  }

  protected buildFeed(feed: any): RSSFeed {
    return {
      title: this.getFeedTitle(feed),
      description: this.getFeedDesc(feed),
      link: this.getFeedLink(feed),
      docs: this.getFeedDocs(feed),
      image: this.getFeedImage(feed),
      items: [],
    };
  }

  protected buildItem(item: any): RSSItem {
    return {
      title: this.getItemTitle(item),
      description: this.getItemDesc(item),
      link: this.getItemLink(item),
      published: this.getItemPubDate(item),
      category: this.getItemCategory(item),
      image: this.getItemImage(item),
      content: this.getItemContent(item),
    };
  }

  protected abstract getFeed(xml: any): any;

  protected abstract getItems(feed: any): any[];

  protected abstract getFeedTitle(feed: any): string;

  protected abstract getFeedDesc(feed: any): string | undefined;

  protected abstract getFeedLink(feed: any): string | undefined;

  protected abstract getFeedDocs(feed: any): string | undefined;

  protected abstract getFeedImage(feed: any): string | undefined;

  protected abstract getItemTitle(item: any): string;

  protected abstract getItemDesc(item: any): string | undefined;

  protected abstract getItemPubDate(item: any): Date;

  protected abstract getItemImage(item: any): string | undefined;

  protected abstract getItemCategory(item: any): string[] | undefined;

  protected abstract getItemLink(item: any): string | undefined;

  protected abstract getItemContent(item: any): string | undefined;
}
