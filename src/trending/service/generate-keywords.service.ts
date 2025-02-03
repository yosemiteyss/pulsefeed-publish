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
    this.logger.log(
      `Start generating keywords, articles size: ${articles.length}`,
      GenerateKeywordsService.name,
    );

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

    const jsonString = this.extractJsonResponse(response);
    const keywordsList = this.parseJsonToKeywordsByTitle(jsonString);

    this.logger.log(
      `Finished generating keywords, keywords list size: ${keywordsList.size}`,
      keywordsList,
    );

    const results: ArticleKeywords[] = [];
    for (const article of articles) {
      const keywords = keywordsList.get(article.title);
      if (!keywords) {
        this.logger.log(
          `No keywords found for article: ${article.title}`,
          GenerateKeywordsService.name,
        );
        continue;
      }

      const cleanedKeywords = this.cleanupKeywords(keywords);
      results.push({
        articleId: article.id,
        keywords: cleanedKeywords,
      });

      this.logger.log(`'${article.title}': [${cleanedKeywords}]`, GenerateKeywordsService.name);
    }

    return results;
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
   * Validate JSON string, extract and convert it to a Map<string, string[]>,
   * where each key is an article title and each value is an array of keywords.
   * @param json JSON content as a string.
   * @returns A Map<string, string[]> where each key is an article title and the value is its corresponding keywords.
   * @throws JsonParseException if the JSON is invalid or not in the expected format.
   * @private
   */
  private parseJsonToKeywordsByTitle(json: string): Map<string, string[]> {
    let parsedJson: any;
    try {
      parsedJson = JSON.parse(json);
    } catch (err) {
      throw new JsonParseException(`Failed to parse JSON response: ${json}`);
    }

    // Check if the parsed result is an object
    if (typeof parsedJson !== 'object' || parsedJson === null) {
      throw new JsonParseException(`JSON response is not an object: ${JSON.stringify(parsedJson)}`);
    }

    const result = new Map<string, string[]>();

    // Ensure each key is a string (title) and each value is an array of strings (keywords)
    for (const title in parsedJson) {
      if (parsedJson.hasOwnProperty(title)) {
        const keywords = parsedJson[title];

        if (!Array.isArray(keywords)) {
          throw new JsonParseException(
            `Keywords for title "${title}" should be an array: ${JSON.stringify(keywords)}`,
          );
        }

        if (!keywords.every((keyword) => typeof keyword === 'string')) {
          throw new JsonParseException(
            `Keywords for title "${title}" contain invalid data types: ${JSON.stringify(keywords)}`,
          );
        }

        result.set(title, keywords);
      }
    }

    return result;
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
