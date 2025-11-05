import { LLMProvider, LLMResponse, YTExtractSettings } from '../models/types';
import {
  OllamaProvider,
  LMStudioProvider,
  LlamaCppProvider,
  OpenAIProvider,
  AnthropicProvider,
  OpenRouterProvider
} from '../models/providers';

export class LLMService {
  private provider: LLMProvider;

  constructor(private settings: YTExtractSettings) {
    this.provider = this.createProvider();
  }

  /**
   * Create provider instance based on settings
   */
  private createProvider(): LLMProvider {
    switch (this.settings.llmProvider) {
      case 'ollama':
        return new OllamaProvider(this.settings);
      case 'lmstudio':
        return new LMStudioProvider(this.settings);
      case 'llamacpp':
        return new LlamaCppProvider(this.settings);
      case 'openai':
        return new OpenAIProvider(this.settings);
      case 'anthropic':
        return new AnthropicProvider(this.settings);
      case 'openrouter':
        return new OpenRouterProvider(this.settings);
      default:
        return new OllamaProvider(this.settings);
    }
  }

  /**
   * Auto-detect available LLM provider
   * Tries all providers in order: Ollama, LM Studio, llama.cpp
   * Returns first available provider or null if none found
   */
  async autoDetect(): Promise<LLMProvider | null> {
    const providers = [
      new OllamaProvider(this.settings),
      new LMStudioProvider(this.settings),
      new LlamaCppProvider(this.settings)
    ];

    for (const provider of providers) {
      try {
        const isAvailable = await provider.testConnection();
        if (isAvailable) {
          return provider;
        }
      } catch {
        continue;
      }
    }

    return null;
  }

  /**
   * Test current provider connection
   */
  async testConnection(): Promise<boolean> {
    try {
      return await this.provider.testConnection();
    } catch {
      return false;
    }
  }

  /**
   * Generate summary and other outputs
   * Auto-detects provider if auto-detect is enabled AND provider is set to 'custom'
   */
  async generateSummary(transcript: string): Promise<LLMResponse> {
    // Only auto-detect if explicitly requested (custom provider)
    // Otherwise use the user's selected provider
    if (this.settings.autoDetectEndpoint && this.settings.llmProvider === 'custom') {
      const detectedProvider = await this.autoDetect();
      if (detectedProvider) {
        this.provider = detectedProvider;
      }
    }

    return await this.provider.generateSummary(
      transcript,
      this.settings.customSystemPrompt
    );
  }
}
