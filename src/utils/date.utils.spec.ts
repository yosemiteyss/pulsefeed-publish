import { parseRelativeDate } from './date.utils';

describe('date.utils', () => {
  it('should parse 5秒前', () => {
    const result = parseRelativeDate('5 秒前');
    const now = new Date();
    now.setSeconds(now.getSeconds() - 5);

    // Compare year, month, date, hours, minutes, and seconds parts only
    expect(Math.floor(result.getTime() / 1000)).toBe(Math.floor(now.getTime() / 1000));
  });

  it('should parse 5分鐘前', () => {
    const result = parseRelativeDate('5 分鐘前');
    const now = new Date();
    now.setMinutes(now.getMinutes() - 5);

    // Compare year, month, date, hours, minutes, and seconds parts only
    expect(Math.floor(result.getTime() / 1000)).toBe(Math.floor(now.getTime() / 1000));
  });

  it('should parse 5小時前', () => {
    const result = parseRelativeDate('5 小時前');
    const now = new Date();
    now.setHours(now.getHours() - 5);

    // Compare year, month, date, hours, minutes, and seconds parts only
    expect(Math.floor(result.getTime() / 1000)).toBe(Math.floor(now.getTime() / 1000));
  });

  it('should parse 5日前', () => {
    const result = parseRelativeDate('5 日前');
    const now = new Date();
    now.setUTCDate(now.getUTCDate() - 5);

    // Compare year, month, date, hours, minutes, and seconds parts only
    expect(Math.floor(result.getTime() / 1000)).toBe(Math.floor(now.getTime() / 1000));
  });

  it('should parse chinese date format', () => {
    const dateStr = '2024年5月11日 17:19';
    const result = parseRelativeDate(dateStr);
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(4);
    expect(result.getUTCDate()).toBe(11);
    expect(result.getHours()).toBe(17);
    expect(result.getMinutes()).toBe(19);
  });
});
