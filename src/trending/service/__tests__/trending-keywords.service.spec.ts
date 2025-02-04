// noinspection DuplicatedCode

import {
  ArticleCategoryEnum,
  CacheItem,
  LanguageEnum,
  TrendingKeyword,
  TrendingKeywordsRepository,
} from '@pulsefeed/common';
import { TrendingKeywordsService } from '../trending-keywords.service';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { Test, TestingModule } from '@nestjs/testing';

describe('TrendingKeywordsService', () => {
  let trendingKeywordsService: TrendingKeywordsService;
  let trendingKeywordsRepository: DeepMockProxy<TrendingKeywordsRepository>;

  beforeEach(async () => {
    trendingKeywordsRepository = mockDeep<TrendingKeywordsRepository>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrendingKeywordsService,
        {
          provide: TrendingKeywordsRepository,
          useValue: trendingKeywordsRepository,
        },
      ],
    }).compile();

    trendingKeywordsService = module.get<TrendingKeywordsService>(TrendingKeywordsService);
  });

  describe('getTrendingKeywords', () => {
    it('should get filtered and sorted keywords from repository', async () => {
      const languageKey = LanguageEnum.en_us;
      const categoryKey = ArticleCategoryEnum.HEALTH;
      const size = 2;

      const keywordItems: CacheItem<TrendingKeyword>[] = [
        { key: 'key-1', value: { keyword: 'keyword-1', score: 1, lastUpdated: new Date() } },
        { key: 'key-2', value: { keyword: 'keyword-2', score: 2, lastUpdated: new Date() } },
        { key: 'key-3', value: { keyword: 'keyword-3', score: 3, lastUpdated: new Date() } },
        { key: 'key-4', value: { keyword: 'keyword-4', score: 4, lastUpdated: new Date() } },
      ];

      trendingKeywordsRepository.getKeywords.mockResolvedValue(keywordItems);

      const result = await trendingKeywordsService.getTrendingKeywords(
        languageKey,
        categoryKey,
        size,
      );

      expect(trendingKeywordsRepository.getKeywords).toHaveBeenCalledWith(languageKey, categoryKey);
      expect(result.length).toBe(size);
      expect(result[0]).toEqual(keywordItems[3].value);
      expect(result[1]).toEqual(keywordItems[2].value);
    });
  });

  describe('incrementKeyword', () => {
    it('should increment keyword score and not evict any keyword if the limit is not exceeded', async () => {
      const keyword: TrendingKeyword = {
        keyword: 'keyword-1',
        score: 1,
        lastUpdated: new Date(),
      };
      const languageKey = LanguageEnum.en_us;
      const categoryKey = ArticleCategoryEnum.HEALTH;
      const keywordItems: CacheItem<TrendingKeyword>[] = [];

      trendingKeywordsRepository.getKeyword.mockResolvedValue(keyword);
      trendingKeywordsRepository.getKeywords.mockResolvedValue(keywordItems);

      await trendingKeywordsService.incrementKeyword(keyword.keyword, languageKey, categoryKey);

      expect(trendingKeywordsRepository.getKeyword).toHaveBeenCalledWith(
        keyword.keyword,
        languageKey,
        categoryKey,
      );
      expect(trendingKeywordsRepository.getKeywords).toHaveBeenCalledWith(languageKey);

      const updatedKeyword: TrendingKeyword = {
        keyword: keyword.keyword,
        score: keyword.score + 1,
        lastUpdated: expect.any(Date),
      };
      expect(trendingKeywordsRepository.updateKeyword).toHaveBeenCalledWith(
        languageKey,
        categoryKey,
        updatedKeyword,
      );

      expect(trendingKeywordsRepository.deleteKeyword).not.toHaveBeenCalled();
    });

    it('should increment keyword score and evict the least important one if the limit is exceeded', async () => {
      const keyword: TrendingKeyword = {
        keyword: 'keyword-1',
        score: 1,
        lastUpdated: new Date(),
      };
      const keywordItems: CacheItem<TrendingKeyword>[] = Array.from(
        { length: Object.keys(ArticleCategoryEnum).length * 200 + 1 },
        (_, i) => ({
          key: `key-${i + 1}`,
          value: {
            keyword: `keyword-${i + 1}`,
            score: i + 1,
            lastUpdated: new Date('2024-01-01T00:00:00Z'),
          },
        }),
      );
      const languageKey = LanguageEnum.en_us;
      const categoryKey = ArticleCategoryEnum.HEALTH;

      trendingKeywordsRepository.getKeyword.mockResolvedValue(keyword);
      trendingKeywordsRepository.getKeywords.mockResolvedValue(keywordItems);

      await trendingKeywordsService.incrementKeyword(keyword.keyword, languageKey, categoryKey);

      expect(trendingKeywordsRepository.getKeyword).toHaveBeenCalledWith(
        keyword.keyword,
        languageKey,
        categoryKey,
      );
      expect(trendingKeywordsRepository.getKeywords).toHaveBeenCalledWith(languageKey);

      const updatedKeyword: TrendingKeyword = {
        ...keyword,
        score: keyword.score + 1,
        lastUpdated: expect.any(Date),
      };
      expect(trendingKeywordsRepository.updateKeyword).toHaveBeenCalledWith(
        languageKey,
        categoryKey,
        updatedKeyword,
      );

      expect(trendingKeywordsRepository.deleteKeyword).toHaveBeenCalledWith(keywordItems[0]);
    });
  });
});
