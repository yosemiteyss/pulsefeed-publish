export default interface RSSItem {
  readonly title: string;
  readonly description?: string;
  readonly link?: string;
  readonly published?: Date;
  readonly category?: string[];
  readonly image?: string;
  readonly content?: string;
}
