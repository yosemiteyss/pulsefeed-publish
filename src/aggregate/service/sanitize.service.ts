import { sanitizeUrl } from '@braintree/sanitize-url';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SanitizeService {
  sanitizeURL(link: string | undefined): string | undefined {
    if (!link) return link;

    if (!this.isValidURL(link)) return undefined;
    if (!this.isHttpURL(link)) return undefined;

    link = sanitizeUrl(link);
    link = this.removeUtmParams(link);
    link = this.replaceWithHttps(link);

    return link;
  }

  sanitizeContent(content: string | undefined): string | undefined {
    if (!content) return content;

    content = this.removeNewlines(content);
    content = this.decodeUnicodeHex(content);

    return content;
  }

  private isValidURL(link: string): boolean {
    // Remove blank url.
    if (link.trim() === '') return false;

    try {
      new URL(link);
      return true;
    } catch (error) {
      return false;
    }
  }

  private isHttpURL(link: string): boolean {
    return link.startsWith('http://') || link.startsWith('https://');
  }

  private removeUtmParams(link: string): string {
    return link.replace(/[?&]utm_\w*=[^&]*/gi, '');
  }

  private replaceWithHttps(link: string): string {
    return link.replace(/^http:\/\//, 'https://');
  }

  private removeNewlines(input: string): string {
    return input.replace(/\r?\n|\r/g, '');
  }

  private decodeUnicodeHex(input: string): string {
    return input.replace(/&#x([0-9A-Fa-f]+);/g, (match, hexCode) => {
      return String.fromCharCode(parseInt(hexCode, 16));
    });
  }
}
