import { LLMProvider, LLMResponse, YTExtractSettings } from './types';

export abstract class BaseLLMProvider implements LLMProvider {
  abstract name: string;
  abstract defaultEndpoint: string;

  constructor(protected settings: YTExtractSettings) {}

  abstract testConnection(): Promise<boolean>;
  abstract generateSummary(transcript: string, prompt: string): Promise<LLMResponse>;

  /**
   * Make HTTP request with timeout
   */
  protected async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      throw error;
    }
  }

  /**
   * Parse LLM response based on requested outputs
   */
  protected parseLLMOutput(rawResponse: string): LLMResponse {
    const response: LLMResponse = {};

    if (this.settings.outputSummary) {
      response.summary = this.extractSection(rawResponse, 'summary');
    }

    if (this.settings.outputKeyPoints) {
      response.keyPoints = this.extractListItems(rawResponse, 'key points');
    }

    if (this.settings.outputTags) {
      response.tags = this.extractListItems(rawResponse, 'tags');
    }

    if (this.settings.outputQuestions) {
      response.questions = this.extractListItems(rawResponse, 'questions');
    }

    return response;
  }

  private extractSection(text: string, sectionName: string): string {
    const regex = new RegExp(`${sectionName}:?\\s*(.+?)(?=\\n\\n|$)`, 'is');
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  }

  private extractListItems(text: string, sectionName: string): string[] {
    const regex = new RegExp(`${sectionName}:?\\s*([\\s\\S]+?)(?=\\n\\n|$)`, 'i');
    const match = text.match(regex);

    if (!match) return [];

    return match[1]
      .split('\n')
      .map(line => line.replace(/^[-*•]\s*/, '').trim())
      .filter(line => line.length > 0);
  }
}
