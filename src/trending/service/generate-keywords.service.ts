import { EmptyResponseException } from '@nestjs/microservices/errors/empty-response.exception';
import { GENERATE_KEYWORDS_PROMPT, GENERATE_KEYWORDS_SYS_MSG } from '../constants';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { JsonParseException } from '../exception';
import { ConfigService } from '@nestjs/config';
import { Article } from '@pulsefeed/common';
import { ArticleKeywords } from '../model';
import OpenAI from 'openai';

@Injectable()
export class GenerateKeywordsService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) protected readonly logger: LoggerService,
    private readonly configService: ConfigService,
  ) {}

  private readonly openai = new OpenAI({
    baseURL: this.configService.get('OPEN_API_BASE_URL'),
    apiKey: this.configService.get('OPEN_API_API_KEY'),
    timeout: 20000,
    maxRetries: 2,
  });

  /**
   * Generate keywords for articles.
   * @param articles the article list.
   * @returns array of generated keywords for each article.
   */
  async generateArticlesKeywords(articles: Article[]): Promise<ArticleKeywords[]> {
    const articleTitles = articles.map((article) => article.title);

    const inputs = articleTitles.map((title) => `- "${title}"`).join('\n');
    const updatedPrompt = GENERATE_KEYWORDS_PROMPT.replace('{inputs}', inputs);

    const completion: OpenAI.Chat.ChatCompletion = await this.openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: GENERATE_KEYWORDS_SYS_MSG,
        },
        {
          role: 'user',
          content: updatedPrompt,
        },
      ],
      model: 'gpt-3.5-turbo',
    });

    const response = completion.choices[0].message.content;
    if (!response) {
      throw new EmptyResponseException('Response content is null');
    }

    const jsonString = this.extractJsonContent(response);
    const keywordsList = this.jsonToStringArray(jsonString);

    // Check length mismatch.
    if (keywordsList.length !== articles.length) {
      throw new EmptyResponseException(
        `Keywords array length does not match with articles length, keywordsList: ${keywordsList.length}, articles: ${articles.length}`,
      );
    }

    const results: ArticleKeywords[] = [];
    for (const [index, article] of articles.entries()) {
      const updatedKeywords = this.cleanupKeywords(keywordsList[index]);
      results.push({
        articleId: article.id,
        keywords: updatedKeywords,
      });

      this.logger.log(
        `Article: '${article.title}', keywords: ${keywordsList[index]}`,
        GenerateKeywordsService.name,
      );
    }

    return results;
  }

  /**
   * Extract content from json format block.
   * ```json
   * [['123', '456']]
   * ```
   * @param response chat completion response.
   * @returns json content.
   * @private
   */
  private extractJsonContent(response: string): string {
    const jsonBlockMatch = response.match(/```json([\s\S]*?)```/);
    let jsonString: string;
    if (jsonBlockMatch) {
      jsonString = jsonBlockMatch[1].trim();
    } else {
      jsonString = response;
    }
    return jsonString.trim();
  }

  /**
   * Validate json string is valid, and convert to array.
   * @param json json content.
   * @returns json array.
   * @private
   */
  private jsonToStringArray(json: string): string[][] {
    let parsed: any[];
    try {
      parsed = JSON.parse(json);
    } catch (err) {
      throw new JsonParseException(`Failed to parse json response: ${json}`);
    }

    if (!Array.isArray(parsed)) {
      throw new JsonParseException(`Json response is not an array: ${parsed}`);
    }

    if (
      !parsed.every(
        (item) => Array.isArray(item) && item.every((subItem) => typeof subItem === 'string'),
      )
    ) {
      throw new JsonParseException(`Json array contains invalid data types: ${parsed}`);
    }

    return parsed;
  }

  /**
   * Clean up generated keywords list.
   * @private
   */
  private cleanupKeywords(keywords: string[]): string[] {
    const updatedKeywords: string[] = [];

    for (const keyword of keywords) {
      // Remove single word keyword.
      if (keywords.length <= 1) continue;

      updatedKeywords.push(keyword);
    }

    return updatedKeywords;
  }
}
