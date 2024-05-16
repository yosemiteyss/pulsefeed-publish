import { SanitizeService } from '../sanitize.service';

describe('SanitizeService', () => {
  let sanitizeService: SanitizeService;

  beforeAll(() => {
    sanitizeService = new SanitizeService();
  });

  describe('sanitizeURL', () => {
    it('should filter invalid url', () => {
      const url = 'akla93ekaldasdf';
      const result = sanitizeService.sanitizeURL(url);
      expect(result).toBeUndefined();
    });

    it('should filter non-http url', () => {
      const url = 'ftp://user@host/foo/bar.txt';
      const result = sanitizeService.sanitizeURL(url);
      expect(result).toBeUndefined();
    });

    it('should replace http:// with https://', () => {
      const url = 'http://example.com/';
      const result = sanitizeService.sanitizeURL(url);
      expect(result).toBe('https://example.com/');
    });

    it('should remove utm params (without /)', () => {
      const url =
        'https://example.com?utm_source=newsletter&utm_medium=email&utm_campaign=spring_sale&utm_content=cta_button';
      const result = sanitizeService.sanitizeURL(url);
      expect(result).toBe('https://example.com');
    });

    it('should remove utm params (with /)', () => {
      const url =
        'https://example.com/?utm_source=newsletter&utm_medium=email&utm_campaign=spring_sale&utm_content=cta_button';
      const result = sanitizeService.sanitizeURL(url);
      expect(result).toBe('https://example.com/');
    });
  });

  describe('sanitizeContent', () => {
    it('should remove newline char', () => {
      const content = 'asdfasf\n\nasdfla;sd\naslda';
      const result = sanitizeService.sanitizeContent(content);
      expect(result).toBe('asdfasfasdfla;sdaslda');
    });

    it('should decode unicode hex', () => {
      const content =
        '&#x2018;The late, great Hannibal Lecter is a wonderful man,&#x2019; former US President Donald Trump said at a rally, referencing the fictional cannibal from 1991 film Silence of the Lambs.';
      const result = sanitizeService.sanitizeContent(content);
      expect(result).toBe(
        '‘The late, great Hannibal Lecter is a wonderful man,’ former US President Donald Trump said at a rally, referencing the fictional cannibal from 1991 film Silence of the Lambs.',
      );
    });
  });
});
