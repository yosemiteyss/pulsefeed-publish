import {
  ArticleCategoryEnum,
  CacheItem,
  TrendingKeyword,
  TrendingKeywordsRepository,
} from '@pulsefeed/common';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TrendingKeywordsService {
  constructor(private readonly trendingKeywordsRepository: TrendingKeywordsRepository) {}

  /**
   * Maximum number of cacheable keywords per language.
   * @private
   */
  private readonly KEYWORD_CACHE_LIMIT_PER_LANG = Object.keys(ArticleCategoryEnum).length * 200;

  /**
   * Minimum trending score.
   * @private
   */
  private readonly KEYWORD_TRENDING_MIN_SCORE = 2;

  /**
   * Returns filtered and ordered trending keywords.
   * If category key is not provided, return keywords from all categories for
   * the given language.
   *
   * @param languageKey the language key.
   * @param categoryKey the category key.
   * @param size the number of keywords.
   * @returns array of keywords.
   */
  async getTrendingKeywords(
    languageKey: string,
    categoryKey?: string,
    size: number = 10,
  ): Promise<TrendingKeyword[]> {
    const keywordItems = await this.trendingKeywordsRepository.getKeywords(
      languageKey,
      categoryKey,
    );
    const keywords = keywordItems.map((item) => item.value);

    // Filter out keywords below min scores.
    let sortedKeywords = keywords.filter(
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
    const cachedKeyword = await this.trendingKeywordsRepository.getKeyword(
      keyword,
      languageKey,
      categoryKey,
    );

    // Calculate and set new score of the keyword.
    const currentScore = cachedKeyword?.score;
    const newScore = currentScore ? currentScore + 1 : 1;

    const updatedKeyword: TrendingKeyword = {
      keyword: keyword,
      score: newScore,
      lastUpdated: new Date(),
    };

    await this.trendingKeywordsRepository.updateKeyword(languageKey, categoryKey, updatedKeyword);

    // If the number of stored keywords per language exceeds the limit, evict the least important one.
    const keywordItems = await this.trendingKeywordsRepository.getKeywords(languageKey);
    if (keywordItems.length > this.KEYWORD_CACHE_LIMIT_PER_LANG) {
      const lowestScoreKeyword = this.getLowestScoreKeyword(keywordItems);
      if (lowestScoreKeyword) {
        await this.trendingKeywordsRepository.deleteKeyword(lowestScoreKeyword);
      }
    }
  }

  /**
   * Returns the keyword with the lowest score and the oldest update time.
   * @param keywordItems
   * @private
   */
  private getLowestScoreKeyword(
    keywordItems: CacheItem<TrendingKeyword>[],
  ): CacheItem<TrendingKeyword> | undefined {
    let lowestScoreKeyword: CacheItem<TrendingKeyword> | undefined = undefined;
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
