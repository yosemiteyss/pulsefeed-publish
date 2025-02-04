import { GenerateKeywordsService, TrendingKeywordsService } from '../../trending';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { PublishArticleKeywordsDto } from '../../publish-feed';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { RmqContext } from '@nestjs/microservices';
import { ArticleRepository } from '../../shared';
import OpenAI from 'openai';

@Injectable()
export class PublishKeywordsService {
  constructor(
    private readonly articleRepository: ArticleRepository,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
    private readonly trendingKeywordsService: TrendingKeywordsService,
    private readonly generateKeywordsService: GenerateKeywordsService,
  ) {}

  /**
   * Handle publish keywords events.
   * @param event the publish keywords event.
   * @param context the rmq context.
   */
  async publishKeywords(event: PublishArticleKeywordsDto, context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMessage = context.getMessage();

    try {
      // Get article by id.
      const article = await this.articleRepository.getArticle(event.id);
      if (!article) {
        this.logger.warn(
          `Article does not exist, article id: ${event.id}`,
          PublishKeywordsService.name,
        );
        channel.nack(originalMessage, false, false);
        return;
      }

      // Generate keywords.
      const articleKeywords = await this.generateKeywordsService.generateArticleKeywords(article);

      // Save keywords to db.
      await this.articleRepository.updateKeywords(
        articleKeywords.articleId,
        articleKeywords.keywords,
      );

      // Increment ranking of each keyword in cache.
      for (const language of article.languages) {
        for (const keyword of articleKeywords.keywords) {
          await this.trendingKeywordsService.incrementKeyword(keyword, language, article.category);
        }
      }

      channel.ack(originalMessage);
    } catch (error) {
      if (error instanceof OpenAI.APIError && error.status === 429) {
        this.logger.log(
          'Requeue event due to too many request error.',
          PublishKeywordsService.name,
        );
        channel.nack(originalMessage, false, true);
      } else {
        this.logger.error(`Publish keywords failed:`, error.stack, PublishKeywordsService.name);
        channel.nack(originalMessage, false, false);
      }
    }
  }
}
