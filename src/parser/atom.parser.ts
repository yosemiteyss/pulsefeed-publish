import { ParserException } from './exception/parser.exception';
import RSS2Parser from './rss2.parser';

export default class AtomParser extends RSS2Parser {
  protected override getFeed(xml: any): any {
    let feed = xml['feed'];
    if (!feed) {
      throw new ParserException('Required feed element not found');
    }

    if (Array.isArray(feed)) feed = feed[0];

    return feed;
  }

  protected override getItems(feed: any): any[] {
    let entries = feed['entry'] || [];
    if (entries && !Array.isArray(entries)) entries = [entries];

    return entries;
  }

  protected override getFeedImage(feed: any): string | undefined {
    if (feed['logo']) return feed['logo'];

    return super.getFeedImage(feed);
  }

  protected override getFeedDesc(feed: any): string | undefined {
    if (feed['subtitle'] && feed['subtitle']['$text']) return feed['subtitle']['$text'];
    if (feed['subtitle']) return feed['subtitle'];

    return super.getFeedDesc(feed);
  }

  protected override getItemDesc(item: any): string | undefined {
    if (item['summary'] && item['summary']['$text']) return item['summary']['$text'];
    if (item['summary']) return item['summary'];

    return super.getItemDesc(item);
  }

  protected override getItemPubDate(item: any): Date {
    if (item['published']) return new Date(Date.parse(item['published']));

    return super.getItemPubDate(item);
  }

  protected override getItemImage(item: any): string | undefined {
    // Extract first link
    let link = item['link'];
    if (item['link'] && Array.isArray(item['link'])) link = item['link'][0];

    // Extract first media:thumbnail url
    if (link['media:content'] && link['media:content']['media:thumbnail']) {
      let thumbnail = link['media:content']['media:thumbnail'];
      if (Array.isArray(link['media:content']['media:thumbnail'])) {
        thumbnail = link['media:content']['media:thumbnail'][0];
      }
      return thumbnail['url'];
    }

    return super.getItemImage(item);
  }

  protected override getItemLink(item: any): any {
    let link = item['link'];
    if (item['link'] && Array.isArray(item['link'])) link = item['link'][0];
    if (link && link['href']) return link['href'];

    return link;
  }

  protected override getItemCategory(item: any): string[] | undefined {
    if (item['dc:subject']) {
      return item['dc:subject'].split(/[，,]/);
    }

    return undefined;
  }
}
