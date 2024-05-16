import { ParserException } from './exception/parser.exception';
import RSSParser from './rss.parser';

export default class RSS2Parser extends RSSParser {
  protected override getFeed(xml: any): any {
    let channel = xml['rss'] && xml['rss']['channel'] ? xml['rss']['channel'] : undefined;
    if (!channel) {
      throw new ParserException('Required channel element not found');
    }

    if (Array.isArray(channel)) channel = channel[0];

    return channel;
  }

  protected override getItems(channel: any): any[] {
    let items = channel['item'] || [];
    if (items && !Array.isArray(items)) items = [items];

    return items;
  }

  protected override getFeedTitle(channel: any): string {
    if (channel['title'] && channel['title']['$text']) return channel['title']['$text'];
    if (channel['title']) return channel['title'];

    throw new ParserException('Required feed title not found');
  }

  protected override getFeedDesc(channel: any): string | undefined {
    if (channel['description'] && channel['description']['$text'])
      return channel['description']['$text'];

    return channel['description'];
  }

  protected override getFeedLink(channel: any): string | undefined {
    if (channel['link'] && channel['link']['href']) return channel['link']['href'];
    if (channel['link']) return channel['link'];

    return undefined;
  }

  protected override getFeedDocs(channel: any): string | undefined {
    if (channel['docs'] && channel['docs']['$text']) return channel['docs']['$text'];
    if (channel['docs']) return channel['docs'];

    return undefined;
  }

  protected override getFeedImage(channel: any): string | undefined {
    if (channel['image']?.['url']) return channel['image']['url'];
    if (channel['image']?.['link']) return channel['image']['link'];
    if (channel['itunes:image']) return channel['itunes:image']['href'];

    return undefined;
  }

  protected override getItemTitle(item: any): string {
    if (item['title'] && item['title']['$text']) return item['title']['$text'];
    if (item['title']) return item['title'];

    throw new ParserException('Required item title not found');
  }

  protected override getItemDesc(item: any): string | undefined {
    if (item['description'] && item['description']['$text']) return item['description']['$text'];
    return item['description'];
  }

  protected override getItemPubDate(item: any): Date {
    if (item['pubDate']) return new Date(Date.parse(item['pubDate']));

    return new Date();
  }

  protected override getItemImage(item: any): string | undefined {
    if (item['enclosure'] && item['enclosure']['type']) {
      if (item['enclosure']['type'].startsWith('image')) {
        return item['enclosure']['url'];
      }
    }

    if (item['media:group'] && item['media:group']['media:content']) {
      if (item['media:group']['media:content']?.['type']?.startsWith('image')) {
        return item['media:group']['media:content']?.['url'];
      }
    }

    return undefined;
  }

  protected override getItemCategory(item: any): string[] | undefined {
    if (item['category'] && Array.isArray(item['category'])) return item['category'];
    if (item['category']) return [item['category']];

    if (item['dc:subject']) {
      return item['dc:subject'].split(/[，,]/);
    }

    return undefined;
  }

  protected override getItemLink(item: any): string | undefined {
    if (item['link'] && item['link']['href']) return item['link']['href'];
    return item['link'];
  }

  protected override getItemContent(item: any): string | undefined {
    if (item['content:encoded'] && item['content:encoded']['$text'])
      return item['content:encoded']['$text'];

    return item['content:encoded'];
  }
}
