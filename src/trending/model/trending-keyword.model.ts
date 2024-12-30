export interface TrendingKeyword {
  /**
   * Keyword.
   */
  readonly keyword: string;

  /**
   * Score of the keyword.
   */
  readonly score: number;

  /**
   * Last updated time.
   */
  readonly lastUpdated: Date;
}
