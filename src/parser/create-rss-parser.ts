import { ParserException } from './exception/parser.exception';
import { XMLParser } from 'fast-xml-parser';
import RSS2Parser from './rss2.parser';
import AtomParser from './atom.parser';
import RSSParser from './rss.parser';

export function createRSSParser(responseData: any): RSSParser {
  const xmlParser: XMLParser = new XMLParser({
    attributeNamePrefix: '',
    textNodeName: '$text',
    ignoreAttributes: false,
  });

  const xml = xmlParser.parse(responseData);

  if (xml && xml.rss && xml.rss['version']) {
    const version = xml.rss['version'];
    if (version === '2.0') {
      return new RSS2Parser(xml);
    }
  }

  if (xml && xml.feed) {
    return new AtomParser(xml);
  }

  throw new ParserException('Unsupported rss');
}
