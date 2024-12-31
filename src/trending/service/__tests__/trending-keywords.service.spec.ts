// noinspection DuplicatedCode

import { CacheKeyBuilder, CacheService, KeyValue } from '@pulsefeed/common';
import { TrendingKeywordsService } from '../trending-keywords.service';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { Test, TestingModule } from '@nestjs/testing';
import { PublishCacheKey } from 'src/shared';

describe('TrendingKeywordsService', () => {
  let trendingKeywordsService: TrendingKeywordsService;
  let cacheService: DeepMockProxy<CacheService>;

  beforeEach(async () => {
    cacheService = mockDeep<CacheService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrendingKeywordsService,
        {
          provide: CacheService,
          useValue: cacheService,
        },
      ],
    }).compile();

    trendingKeywordsService = module.get<TrendingKeywordsService>(TrendingKeywordsService);
  });

  describe('getTrendingKeywordsForLang', () => {
    it('should return trending keywords for the given language', async () => {
      const mockKeywords: KeyValue[] = [
        { key: 'key1', value: { keyword: 'keyword1', score: 3, lastUpdated: new Date() } },
        { key: 'key2', value: { keyword: 'keyword2', score: 1, lastUpdated: new Date() } },
      ];
      cacheService.getByPrefix.mockResolvedValue(mockKeywords);

      const result = await trendingKeywordsService.getTrendingKeywordsForLang('en', 5);

      expect(cacheService.getByPrefix).toHaveBeenCalledWith(
        CacheKeyBuilder.buildKeyWithParams(PublishCacheKey.TRENDING_KEYWORD.prefix, {
          languageKey: 'en',
        }),
      );
      expect(result).toEqual([{ keyword: 'keyword1', score: 3, lastUpdated: expect.any(Date) }]);
    });
  });

  describe('incrementKeyword', () => {
    it('should increment keyword score and not evict any keyword if the limit is not exceeded', async () => {
      const mockKeyword = { keyword: 'test', score: 5, lastUpdated: new Date() };
      const mockKeywords: KeyValue[] = [
        { key: 'key1', value: { keyword: 'key1', score: 1, lastUpdated: new Date() } },
      ];

      cacheService.get.mockResolvedValue(mockKeyword);
      cacheService.getByPrefix.mockResolvedValue(mockKeywords);

      await trendingKeywordsService.incrementKeyword('test', 'en', 'category1');

      expect(cacheService.get).toHaveBeenCalledWith(
        CacheKeyBuilder.buildKeyWithParams(PublishCacheKey.TRENDING_KEYWORD.prefix, {
          languageKey: 'en',
          categoryKey: 'category1',
          keyword: 'test',
        }),
      );
      expect(cacheService.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ keyword: 'test', score: 6 }),
        PublishCacheKey.TRENDING_KEYWORD.ttl,
      );
      expect(cacheService.delete).not.toHaveBeenCalled();
    });

    it('should increment keyword score and evict the least important one if the limit is exceeded', async () => {
      const mockKeyword = { keyword: 'test', score: 5, lastUpdated: new Date() };
      const mockKeywords: KeyValue[] = Array.from({ length: 501 }, (_, i) => ({
        key: `key${i + 1}`,
        value: {
          keyword: `key${i + 1}`,
          score: i + 1,
          lastUpdated: new Date('2024-01-01T00:00:00Z'),
        },
      }));

      cacheService.get.mockResolvedValue(mockKeyword);
      cacheService.getByPrefix.mockResolvedValue(mockKeywords);

      await trendingKeywordsService.incrementKeyword('test', 'en', 'category1');

      expect(cacheService.get).toHaveBeenCalledWith(
        CacheKeyBuilder.buildKeyWithParams(PublishCacheKey.TRENDING_KEYWORD.prefix, {
          languageKey: 'en',
          categoryKey: 'category1',
          keyword: 'test',
        }),
      );
      expect(cacheService.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ keyword: 'test', score: 6 }),
        PublishCacheKey.TRENDING_KEYWORD.ttl,
      );
      expect(cacheService.delete).toHaveBeenCalledWith('key1');
    });
  });

  describe('getLowestScoreKeyword', () => {
    it('should return the keyword with the lowest score and oldest update time', () => {
      const mockKeywords: KeyValue[] = [
        {
          key: 'key1',
          value: { keyword: 'key1', score: 1, lastUpdated: new Date('2024-01-01') },
        },
        {
          key: 'key2',
          value: { keyword: 'key2', score: 2, lastUpdated: new Date('2024-01-02') },
        },
        {
          key: 'key3',
          value: { keyword: 'key3', score: 1, lastUpdated: new Date('2023-12-31') },
        },
      ];

      const result = trendingKeywordsService['getLowestScoreKeyword'](mockKeywords);
      expect(result).toEqual(mockKeywords[2]);
    });
  });
});
