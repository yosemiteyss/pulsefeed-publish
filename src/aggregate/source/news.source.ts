import { SanitizeService } from '../service/sanitize.service';
import { FeedEntity, SourceEntity } from '@common/db/entity';
import { LoggerService } from '@common/logger';
import { NewsCategory } from '@common/model';
import axios, { AxiosInstance } from 'axios';
import { sha256 } from '@common/utils';
import { DeepPartial } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as R from 'ramda';

export abstract class NewsSource {
  constructor(
    protected readonly logger: LoggerService,
    protected readonly sanitizeService: SanitizeService,
  ) {}

  private readonly axiosInstance: AxiosInstance = axios.create({
    timeout: this.getRequestTimeout(),
    headers: this.getRequestHeaders(),
    params: this.getRequestParams(),
  });

  abstract getBaseURL(): string;

  abstract getCategoryPaths(): Partial<Record<NewsCategory, string[]>>;

  protected abstract buildSourceEntity(): DeepPartial<SourceEntity>;

  protected abstract buildFeedEntity(
    responseData: any,
    category: NewsCategory,
    url: string,
  ): Promise<DeepPartial<FeedEntity>>;

  getSourceEntity(): DeepPartial<SourceEntity> {
    const entity = this.buildSourceEntity();

    // Use link as unique identifier.
    if (!entity.id) {
      entity.id = this.hashId(entity.link);
    }

    return entity;
  }

  async getFeedEntity(
    responseData: any,
    category: NewsCategory,
    url: string,
  ): Promise<DeepPartial<FeedEntity>> {
    const feedEntity = await this.buildFeedEntity(responseData, category, url);

    // Apply source relation
    const sourceEntity = this.getSourceEntity();
    feedEntity.source = sourceEntity;

    if (feedEntity.items) {
      for (const item of feedEntity.items) {
        item.source = sourceEntity;
      }
    }

    // Use link as unique identifier.
    if (!feedEntity.id) {
      feedEntity.id = this.hashId(feedEntity.link);
    }

    if (feedEntity.items) {
      for (const item of feedEntity.items) {
        if (!item.id) {
          item.id = this.hashId(item.link);
        }
      }
    }

    // Filter out duplicated items.
    if (feedEntity.items) {
      feedEntity.items = R.uniqBy(R.prop('id'), feedEntity.items);
      feedEntity.items = R.uniqBy(R.prop('title'), feedEntity.items);
    }

    // Sanitize url and contents.
    feedEntity.title = this.sanitizeService.sanitizeContent(feedEntity.title);
    feedEntity.description = this.sanitizeService.sanitizeContent(feedEntity.description);
    feedEntity.link = this.sanitizeService.sanitizeURL(feedEntity.link);

    if (feedEntity.items) {
      for (const item of feedEntity.items) {
        item.title = this.sanitizeService.sanitizeContent(item.title);
        item.description = this.sanitizeService.sanitizeContent(item.description);
        item.link = this.sanitizeService.sanitizeURL(item.link);
        item.image = this.sanitizeService.sanitizeURL(item.image);
      }
    }

    return feedEntity;
  }

  getFetchFeedsPromises(): Promise<DeepPartial<FeedEntity> | Error>[] {
    const promises: Promise<DeepPartial<FeedEntity> | Error>[] = [];
    const categoryPaths = this.getCategoryPaths();

    for (const [key, paths] of Object.entries(categoryPaths)) {
      for (const path of paths) {
        const promise = this.fetchFeed(key as NewsCategory, path);
        promises.push(promise);
      }
    }

    return promises;
  }

  private async fetchFeed(
    category: NewsCategory,
    path: string,
  ): Promise<DeepPartial<FeedEntity> | Error> {
    const url = this.getBaseURL() + path;

    // Get response
    let responseData: any;
    try {
      this.logger.log(NewsSource.name, `start fetch news from ${url}`);

      responseData = await this.getResponseData(url);

      this.logger.log(NewsSource.name, `finish fetch news from ${url}`);
    } catch (err) {
      this.logger.error(NewsSource.name, `Failed to retrieve feed from ${url}`, err);
      return err;
    }

    // Convert response to feed.
    try {
      this.logger.log(NewsSource.name, `start convert news for ${url}`);

      const feedEntity = await this.getFeedEntity(responseData, category, url);

      this.logger.log(
        NewsSource.name,
        `finish convert news ${feedEntity.items?.length} news from ${url}`,
      );

      return feedEntity;
    } catch (err) {
      this.logger.error(NewsSource.name, `Failed to parse feed`, err);
      this.logger.error(NewsSource.name, `Failed feed`, responseData);

      return err;
    }
  }

  private hashId(key: string | undefined): string {
    key = key || uuidv4();
    return sha256(key);
  }

  protected getRequestHeaders(): object {
    return {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'en-US,en;q=0.5',
    };
  }

  protected getRequestTimeout(): number {
    // 10 seconds
    return 10000;
  }

  protected getRequestParams(): object | undefined {
    return undefined;
  }

  private async getResponseData(url: string): Promise<string> {
    const response = await this.axiosInstance.get(url);
    return response.data;
  }
}
