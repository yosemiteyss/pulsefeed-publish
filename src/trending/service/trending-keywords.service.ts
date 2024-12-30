import { CacheKeyBuilder, CacheService, KeyValue } from '@pulsefeed/common';
import { PublishCacheKey } from '../../shared';
import { Injectable } from '@nestjs/common';
import { TrendingKeyword } from '../model';

@Injectable()
export class TrendingKeywordsService {
  constructor(private readonly cacheService: CacheService) {}

  /**
   * Maximum number of cacheable keywords per language.
   * @private
   */
  private readonly KEYWORD_CACHE_LIMIT_PER_LANG = 500;

  /**
   * Minimum trending score.
   * @private
   */
  private readonly KEYWORD_TRENDING_MIN_SCORE = 2;

  /**
   * Returns the trending keywords for the given language.
   * @param languageKey the language key.
   * @param size number of keywords.
   * @returns array of keywords.
   */
  async getTrendingKeywordsForLang(
    languageKey: string,
    size: number = 10,
  ): Promise<TrendingKeyword[]> {
    return this.getTrendingKeywords(languageKey, undefined, size);
  }

  /**
   * Returns the trending keywords for the given category.
   * @param languageKey the language key.
   * @param categoryKey the category key.
   * @param size number of keywords.
   * @returns array of keywords.
   */
  async getTrendingKeywordsForCategory(
    languageKey: string,
    categoryKey: string,
    size: number = 10,
  ): Promise<TrendingKeyword[]> {
    return this.getTrendingKeywords(languageKey, categoryKey, size);
  }

  /**
   * Returns the trending keywords.
   * @param languageKey the language key.
   * @param categoryKey the category key.
   * @param size number of keywords.
   * @returns array of keywords.
   * @private
   */
  private async getTrendingKeywords(
    languageKey: string,
    categoryKey?: string,
    size: number = 10,
  ): Promise<TrendingKeyword[]> {
    const prefix = CacheKeyBuilder.buildKeyWithParams(PublishCacheKey.TRENDING_KEYWORD.prefix, {
      languageKey: languageKey,
      categoryKey: categoryKey,
    });
    const keywordItems = await this.cacheService.getByPrefix(prefix);
    const trendingKeywords = keywordItems.map((item) => item.value as TrendingKeyword);

    // Filter out keywords below min scores
    let sortedKeywords = trendingKeywords.filter(
      (keyword) => keyword.score >= this.KEYWORD_TRENDING_MIN_SCORE,
    );

    // Sort keywords by score descending.
    sortedKeywords = sortedKeywords.sort((a, b) => b.score - a.score);

    // Return leading keywords with the given size.
    return sortedKeywords.slice(0, size);
  }

  /**
   * Increment keyword scores.
   */
  async incrementKeyword(keyword: string, languageKey: string, categoryKey: string) {
    const cacheKey = CacheKeyBuilder.buildKeyWithParams(PublishCacheKey.TRENDING_KEYWORD.prefix, {
      languageKey: languageKey,
      categoryKey: categoryKey,
      keyword: keyword,
    });

    // Calculate and set new score of the keyword.
    const cachedKeyword = await this.cacheService.get<TrendingKeyword>(cacheKey);
    const currentScore = cachedKeyword?.score;
    const newScore = currentScore ? currentScore + 1 : 1;

    const trendingKeyword: TrendingKeyword = {
      keyword: keyword,
      score: newScore,
      lastUpdated: new Date(),
    };
    await this.cacheService.set(cacheKey, trendingKeyword, PublishCacheKey.TRENDING_KEYWORD.ttl);

    // If the number of stored keywords per language exceeds the limit, evict the least important one.
    const prefix = CacheKeyBuilder.buildKeyWithParams(PublishCacheKey.TRENDING_KEYWORD.prefix, {
      languageKey: languageKey,
    });
    const keywordItems = await this.cacheService.getByPrefix(prefix);
    if (keywordItems.length > this.KEYWORD_CACHE_LIMIT_PER_LANG) {
      const lowestScoreKeyword = this.getLowestScoreKeyword(keywordItems);
      if (lowestScoreKeyword) {
        await this.cacheService.delete(lowestScoreKeyword.key);
      }
    }
  }

  /**
   * Returns the keyword with the lowest score and the oldest update time.
   * @param keywordItems
   * @private
   */
  private getLowestScoreKeyword(keywordItems: KeyValue[]): KeyValue | undefined {
    let lowestScoreKeyword: KeyValue | undefined = undefined;
    let lowestScore: number = Infinity;
    let oldestDate: Date | undefined = undefined;

    for (const item of keywordItems) {
      const keyword = item.value as TrendingKeyword;
      if (
        keyword.score < lowestScore ||
        (keyword.score === lowestScore && (!oldestDate || keyword.lastUpdated < oldestDate))
      ) {
        lowestScore = keyword.score;
        lowestScoreKeyword = item;
        oldestDate = keyword.lastUpdated;
      }
    }

    return lowestScoreKeyword;
  }
}
