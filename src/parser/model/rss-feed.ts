import RSSItem from './rss-item';

export default interface RSSFeed {
  readonly title: string;
  readonly description?: string;
  readonly link?: string;
  readonly docs?: string;
  readonly image?: string;
  readonly items: RSSItem[];
}
