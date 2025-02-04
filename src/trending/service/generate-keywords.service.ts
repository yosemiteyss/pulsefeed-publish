import { GENERATE_ARTICLE_KEYWORDS_PROMPT, GENERATE_ARTICLE_KEYWORDS_SYS_MSG } from '../constants';
import { EmptyResponseException } from '@nestjs/microservices/errors/empty-response.exception';
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
    timeout: 15000,
    maxRetries: 2,
    // defaultHeaders: {
    //   Authorization: ``,
    // },
  });

  /**
   * Generate keywords for article.
   * @param article the article.
   * @returns array of generated keywords.
   */
  async generateArticleKeywords(article: Article): Promise<ArticleKeywords> {
    this.logger.log(
      `Start generating keywords, article id: ${article.id}`,
      GenerateKeywordsService.name,
    );

    const prompt = GENERATE_ARTICLE_KEYWORDS_PROMPT(article.title);

    const completion: OpenAI.Chat.ChatCompletion = await this.openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: GENERATE_ARTICLE_KEYWORDS_SYS_MSG,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'gpt-3.5-turbo',
    });

    const response = completion.choices[0].message.content;
    if (!response) {
      throw new EmptyResponseException('Response content is null');
    }

    const jsonString = this.extractJsonResponse(response);
    const keywords = this.parseJsonToKeywords(jsonString);

    const cleanedKeywords = this.cleanupKeywords(keywords);

    this.logger.log(
      `Finished generating keywords, article id: ${article.id}, keywords size: ${cleanedKeywords.length}`,
      GenerateKeywordsService.name,
    );

    this.logger.log(`'${article.title}': [${cleanedKeywords}]`, GenerateKeywordsService.name);

    return {
      articleId: article.id,
      keywords: cleanedKeywords,
    };
  }

  /**
   * Extract json response from markdown block.
   * If the response is not wrapped in a markdown block, return it.
   * ```json
   * [['123', '456']]
   * ```
   * @param response chat completion response.
   * @returns json content.
   * @private
   */
  private extractJsonResponse(response: string): string {
    const blockMatch = response.match(/```json([\s\S]*?)```/);
    const jsonString = blockMatch ? blockMatch[1] : response;
    return jsonString.trim();
  }

  /**
   * Validate JSON string, extract and convert it to a string array of keywords.
   * @param json JSON content as a string.
   * @returns A string array containing extracted keywords.
   * @throws JsonParseException if the JSON is invalid or not in the expected format.
   * @private
   */
  private parseJsonToKeywords(json: string): string[] {
    let parsedJson: any;
    try {
      parsedJson = JSON.parse(json);
    } catch (err) {
      throw new JsonParseException(`Failed to parse JSON response: ${json}`);
    }

    // Ensure the parsed result is an array of strings
    if (!Array.isArray(parsedJson)) {
      throw new JsonParseException(`JSON response is not an array: ${JSON.stringify(parsedJson)}`);
    }

    if (!parsedJson.every((keyword) => typeof keyword === 'string')) {
      throw new JsonParseException(
        `Keywords contain invalid data types: ${JSON.stringify(parsedJson)}`,
      );
    }

    return parsedJson;
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
