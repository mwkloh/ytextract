export interface YTExtractSettings {
  // File Management
  defaultFolder: string;
  namingPattern: string;
  templatePath: string;
  fileExistsBehavior: 'append' | 'prompt';

  // Metadata Fields
  includeUploadDate: boolean;
  includeDuration: boolean;
  includeViewCount: boolean;
  includeDescription: boolean;
  includeChannelUrl: boolean;
  includeThumbnailUrl: boolean;

  // LLM Configuration
  llmProvider: 'ollama' | 'lmstudio' | 'llamacpp' | 'custom';
  autoDetectEndpoint: boolean;
  llmEndpoint: string;
  llmModel: string;
  customSystemPrompt: string;
  requestTimeout: number;

  // Error Handling
  errorBehavior: 'stop' | 'partial' | 'skip';

  // Template Generator
  templateGeneratorSections: {
    includeSummary: boolean;
    includeKeyPoints: boolean;
    includeTags: boolean;
    includeQuestions: boolean;
    includePersonalNotes: boolean;
    includeTranscript: boolean;
  };
}

export const DEFAULT_SETTINGS: YTExtractSettings = {
  defaultFolder: '',
  namingPattern: '{date} - {title}',
  templatePath: '',
  fileExistsBehavior: 'append',

  includeUploadDate: true,
  includeDuration: true,
  includeViewCount: false,
  includeDescription: false,
  includeChannelUrl: false,
  includeThumbnailUrl: false,

  llmProvider: 'ollama',
  autoDetectEndpoint: true,
  llmEndpoint: 'http://localhost:11434/api/generate',
  llmModel: 'llama2',
  customSystemPrompt: 'Summarize the following transcript concisely and suggest relevant tags',
  requestTimeout: 30000,

  errorBehavior: 'skip',

  templateGeneratorSections: {
    includeSummary: true,
    includeKeyPoints: true,
    includeTags: true,
    includeQuestions: false,
    includePersonalNotes: true,
    includeTranscript: true
  }
};

export interface VideoMetadata {
  title: string;
  url: string;
  videoId: string;
  channel: string;
  uploadDate?: string;
  duration?: string;
  viewCount?: number;
  description?: string;
  channelUrl?: string;
  thumbnailUrl?: string;
}

export interface TranscriptSegment {
  text: string;
  offset: number;
  duration: number;
}

export interface YouTubeData {
  metadata: VideoMetadata;
  transcript: string;
  timestampedTranscript?: TranscriptSegment[];
}

export interface LLMResponse {
  summary?: string;
  keyPoints?: string[];
  tags?: string[];
  questions?: string[];
}

export interface LLMProvider {
  name: string;
  defaultEndpoint: string;
  testConnection(): Promise<boolean>;
  generateSummary(transcript: string, prompt: string): Promise<LLMResponse>;
}

export interface TemplateData {
  // Video metadata
  title: string;
  url: string;
  channel: string;
  upload_date: string;
  duration: string;
  view_count: string;
  description: string;
  channel_url: string;
  thumbnail_url: string;

  // LLM outputs
  llm_summary: string;
  llm_key_points: string;
  generated_tags: string; // YAML array format for frontmatter
  generated_tags_hashtags: string; // Hashtag format for document body
  llm_questions: string;

  // Transcript
  transcript: string;
  transcript_timestamped: string;

  // Other
  extraction_date: string;
}
