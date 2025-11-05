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
   * Parse LLM response based on Template Generator settings
   */
  protected parseLLMOutput(rawResponse: string): LLMResponse {
    const response: LLMResponse = {};

    if (this.settings.templateGeneratorSections.includeSummary) {
      response.summary = this.extractSection(rawResponse, 'summary');
    }

    if (this.settings.templateGeneratorSections.includeKeyPoints) {
      response.keyPoints = this.extractListItems(rawResponse, 'key points');
    }

    if (this.settings.templateGeneratorSections.includeTags) {
      response.tags = this.extractListItems(rawResponse, 'tags');
    }

    if (this.settings.templateGeneratorSections.includeQuestions) {
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

    const content = match[1].trim();

    // Check if content is comma-separated (inline tags)
    if (content.includes(',') && !content.includes('\n')) {
      return content
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);
    }

    // Otherwise treat as bullet list (one per line)
    return content
      .split('\n')
      .map(line => line.replace(/^[-*•]\s*/, '').trim())
      .filter(line => line.length > 0);
  }
}

export class OllamaProvider extends BaseLLMProvider {
  name = 'Ollama';
  defaultEndpoint = 'http://localhost:11434/api/generate';

  async testConnection(): Promise<boolean> {
    try {
      const endpoint = this.settings.llmEndpoint || this.defaultEndpoint;
      const baseUrl = endpoint.replace('/api/generate', '');
      const response = await this.fetchWithTimeout(
        `${baseUrl}/api/tags`,
        { method: 'GET' },
        5000
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  async generateSummary(transcript: string, prompt: string): Promise<LLMResponse> {
    const endpoint = this.settings.autoDetectEndpoint
      ? this.defaultEndpoint
      : this.settings.llmEndpoint;

    const requestBody = {
      model: this.settings.llmModel,
      prompt: this.buildPrompt(transcript, prompt),
      stream: false
    };

    try {
      const response = await this.fetchWithTimeout(
        endpoint,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        },
        this.settings.requestTimeout
      );

      if (!response.ok) {
        throw new Error(`Ollama request failed: ${response.statusText}`);
      }

      const data = await response.json();
      return this.parseLLMOutput(data.response);
    } catch (error) {
      throw new Error(`Ollama generation failed: ${error.message}`);
    }
  }

  private buildPrompt(transcript: string, systemPrompt: string): string {
    let prompt = `${systemPrompt}\n\nTranscript:\n${transcript}\n\n`;

    const outputs = [];
    if (this.settings.templateGeneratorSections.includeSummary) outputs.push('summary');
    if (this.settings.templateGeneratorSections.includeKeyPoints) outputs.push('key points');
    if (this.settings.templateGeneratorSections.includeTags) outputs.push('tags');
    if (this.settings.templateGeneratorSections.includeQuestions) outputs.push('questions');

    prompt += `Please provide: ${outputs.join(', ')}`;
    return prompt;
  }
}

export class LMStudioProvider extends BaseLLMProvider {
  name = 'LM Studio';
  defaultEndpoint = 'http://localhost:1234/v1/chat/completions';

  async testConnection(): Promise<boolean> {
    try {
      const endpoint = this.settings.llmEndpoint || this.defaultEndpoint;
      // Handle both /v1/chat/completions and /v1 endpoints
      let baseUrl = endpoint;
      if (endpoint.includes('/v1/chat/completions')) {
        baseUrl = endpoint.replace('/v1/chat/completions', '');
      } else if (endpoint.endsWith('/v1')) {
        baseUrl = endpoint.replace('/v1', '');
      }

      const response = await this.fetchWithTimeout(
        `${baseUrl}/v1/models`,
        { method: 'GET' },
        5000
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  async generateSummary(transcript: string, prompt: string): Promise<LLMResponse> {
    let endpoint = this.settings.autoDetectEndpoint
      ? this.defaultEndpoint
      : this.settings.llmEndpoint;

    // If endpoint is just /v1, append /chat/completions
    if (endpoint && endpoint.endsWith('/v1')) {
      endpoint = `${endpoint}/chat/completions`;
    }

    const requestBody = {
      model: this.settings.llmModel,
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: this.buildUserPrompt(transcript) }
      ],
      temperature: 0.7
    };

    try {
      const response = await this.fetchWithTimeout(
        endpoint,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        },
        this.settings.requestTimeout
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`LM Studio request failed (${response.status}): ${response.statusText}. Details: ${errorText}`);
      }

      const data = await response.json();

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error(`LM Studio returned invalid response structure: ${JSON.stringify(data)}`);
      }

      const content = data.choices[0].message.content;
      return this.parseLLMOutput(content);
    } catch (error) {
      console.error('LM Studio detailed error:', {
        endpoint,
        model: this.settings.llmModel,
        error: error.message,
        stack: error.stack
      });
      throw new Error(`LM Studio generation failed: ${error.message}`);
    }
  }

  private buildUserPrompt(transcript: string): string {
    const outputs = [];
    if (this.settings.templateGeneratorSections.includeSummary) outputs.push('summary');
    if (this.settings.templateGeneratorSections.includeKeyPoints) outputs.push('key points');
    if (this.settings.templateGeneratorSections.includeTags) outputs.push('tags');
    if (this.settings.templateGeneratorSections.includeQuestions) outputs.push('questions');

    return `Transcript:\n${transcript}\n\nPlease provide: ${outputs.join(', ')}`;
  }
}

export class LlamaCppProvider extends BaseLLMProvider {
  name = 'llama.cpp';
  defaultEndpoint = 'http://localhost:8080/completion';

  async testConnection(): Promise<boolean> {
    try {
      const endpoint = this.settings.llmEndpoint || this.defaultEndpoint;
      const baseUrl = endpoint.replace('/completion', '');
      const response = await this.fetchWithTimeout(
        `${baseUrl}/health`,
        { method: 'GET' },
        5000
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  async generateSummary(transcript: string, prompt: string): Promise<LLMResponse> {
    const endpoint = this.settings.autoDetectEndpoint
      ? this.defaultEndpoint
      : this.settings.llmEndpoint;

    const requestBody = {
      prompt: this.buildPrompt(transcript, prompt),
      n_predict: 512,
      temperature: 0.7,
      stop: ['</s>', '\n\n\n']
    };

    try {
      const response = await this.fetchWithTimeout(
        endpoint,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        },
        this.settings.requestTimeout
      );

      if (!response.ok) {
        throw new Error(`llama.cpp request failed: ${response.statusText}`);
      }

      const data = await response.json();
      return this.parseLLMOutput(data.content);
    } catch (error) {
      throw new Error(`llama.cpp generation failed: ${error.message}`);
    }
  }

  private buildPrompt(transcript: string, systemPrompt: string): string {
    const outputs = [];
    if (this.settings.templateGeneratorSections.includeSummary) outputs.push('summary');
    if (this.settings.templateGeneratorSections.includeKeyPoints) outputs.push('key points');
    if (this.settings.templateGeneratorSections.includeTags) outputs.push('tags');
    if (this.settings.templateGeneratorSections.includeQuestions) outputs.push('questions');

    return `${systemPrompt}\n\nTranscript:\n${transcript}\n\nPlease provide: ${outputs.join(', ')}`;
  }
}

export class OpenAIProvider extends BaseLLMProvider {
  name = 'OpenAI';
  defaultEndpoint = 'https://api.openai.com/v1/chat/completions';

  async testConnection(): Promise<boolean> {
    try {
      if (!this.settings.llmApiKey) {
        throw new Error('API key is required');
      }

      const response = await this.fetchWithTimeout(
        'https://api.openai.com/v1/models',
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.settings.llmApiKey}`
          }
        },
        5000
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  async generateSummary(transcript: string, prompt: string): Promise<LLMResponse> {
    if (!this.settings.llmApiKey) {
      throw new Error('OpenAI API key is required');
    }

    const endpoint = this.settings.llmEndpoint || this.defaultEndpoint;

    const requestBody = {
      model: this.settings.llmModel || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: this.buildUserPrompt(transcript) }
      ],
      temperature: 0.7
    };

    try {
      const response = await this.fetchWithTimeout(
        endpoint,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.settings.llmApiKey}`
          },
          body: JSON.stringify(requestBody)
        },
        this.settings.requestTimeout
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI request failed (${response.status}): ${response.statusText}. Details: ${errorText}`);
      }

      const data = await response.json();

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error(`OpenAI returned invalid response structure: ${JSON.stringify(data)}`);
      }

      const content = data.choices[0].message.content;
      return this.parseLLMOutput(content);
    } catch (error) {
      throw new Error(`OpenAI generation failed: ${error.message}`);
    }
  }

  private buildUserPrompt(transcript: string): string {
    const outputs = [];
    if (this.settings.templateGeneratorSections.includeSummary) outputs.push('summary');
    if (this.settings.templateGeneratorSections.includeKeyPoints) outputs.push('key points');
    if (this.settings.templateGeneratorSections.includeTags) outputs.push('tags');
    if (this.settings.templateGeneratorSections.includeQuestions) outputs.push('questions');

    return `Transcript:\n${transcript}\n\nPlease provide: ${outputs.join(', ')}`;
  }
}

export class AnthropicProvider extends BaseLLMProvider {
  name = 'Anthropic';
  defaultEndpoint = 'https://api.anthropic.com/v1/messages';

  async testConnection(): Promise<boolean> {
    try {
      if (!this.settings.llmApiKey) {
        throw new Error('API key is required');
      }

      // Anthropic doesn't have a simple health check endpoint
      // We'll just validate that the API key is present
      return this.settings.llmApiKey.startsWith('sk-ant-');
    } catch {
      return false;
    }
  }

  async generateSummary(transcript: string, prompt: string): Promise<LLMResponse> {
    if (!this.settings.llmApiKey) {
      throw new Error('Anthropic API key is required');
    }

    const endpoint = this.settings.llmEndpoint || this.defaultEndpoint;

    const requestBody = {
      model: this.settings.llmModel || 'claude-3-5-haiku-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `${prompt}\n\n${this.buildUserPrompt(transcript)}`
        }
      ]
    };

    try {
      const response = await this.fetchWithTimeout(
        endpoint,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.settings.llmApiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify(requestBody)
        },
        this.settings.requestTimeout
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Anthropic request failed (${response.status}): ${response.statusText}. Details: ${errorText}`);
      }

      const data = await response.json();

      if (!data.content || !data.content[0] || !data.content[0].text) {
        throw new Error(`Anthropic returned invalid response structure: ${JSON.stringify(data)}`);
      }

      const content = data.content[0].text;
      return this.parseLLMOutput(content);
    } catch (error) {
      throw new Error(`Anthropic generation failed: ${error.message}`);
    }
  }

  private buildUserPrompt(transcript: string): string {
    const outputs = [];
    if (this.settings.templateGeneratorSections.includeSummary) outputs.push('summary');
    if (this.settings.templateGeneratorSections.includeKeyPoints) outputs.push('key points');
    if (this.settings.templateGeneratorSections.includeTags) outputs.push('tags');
    if (this.settings.templateGeneratorSections.includeQuestions) outputs.push('questions');

    return `Transcript:\n${transcript}\n\nPlease provide: ${outputs.join(', ')}`;
  }
}

export class OpenRouterProvider extends BaseLLMProvider {
  name = 'OpenRouter';
  defaultEndpoint = 'https://openrouter.ai/api/v1/chat/completions';

  async testConnection(): Promise<boolean> {
    try {
      if (!this.settings.llmApiKey) {
        throw new Error('API key is required');
      }

      const response = await this.fetchWithTimeout(
        'https://openrouter.ai/api/v1/models',
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.settings.llmApiKey}`
          }
        },
        5000
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  async generateSummary(transcript: string, prompt: string): Promise<LLMResponse> {
    if (!this.settings.llmApiKey) {
      throw new Error('OpenRouter API key is required');
    }

    const endpoint = this.settings.llmEndpoint || this.defaultEndpoint;

    const requestBody = {
      model: this.settings.llmModel || 'anthropic/claude-3.5-haiku',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: this.buildUserPrompt(transcript) }
      ],
      temperature: 0.7
    };

    try {
      const response = await this.fetchWithTimeout(
        endpoint,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.settings.llmApiKey}`,
            'HTTP-Referer': 'https://github.com/mwkloh/ytextract',
            'X-Title': 'YTextract'
          },
          body: JSON.stringify(requestBody)
        },
        this.settings.requestTimeout
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter request failed (${response.status}): ${response.statusText}. Details: ${errorText}`);
      }

      const data = await response.json();

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error(`OpenRouter returned invalid response structure: ${JSON.stringify(data)}`);
      }

      const content = data.choices[0].message.content;
      return this.parseLLMOutput(content);
    } catch (error) {
      throw new Error(`OpenRouter generation failed: ${error.message}`);
    }
  }

  private buildUserPrompt(transcript: string): string {
    const outputs = [];
    if (this.settings.templateGeneratorSections.includeSummary) outputs.push('summary');
    if (this.settings.templateGeneratorSections.includeKeyPoints) outputs.push('key points');
    if (this.settings.templateGeneratorSections.includeTags) outputs.push('tags');
    if (this.settings.templateGeneratorSections.includeQuestions) outputs.push('questions');

    return `Transcript:\n${transcript}\n\nPlease provide: ${outputs.join(', ')}`;
  }
}
