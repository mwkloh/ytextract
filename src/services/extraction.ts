import { App, Notice } from 'obsidian';
import { YouTubeService } from './youtube';
import { LLMService } from './llm';
import { TemplateService } from './template';
import { YTExtractSettings } from '../models/types';
import { StatusBarManager } from '../ui/status-bar';

export class ExtractionService {
  private youtubeService: YouTubeService;
  private llmService: LLMService;
  private templateService: TemplateService;

  constructor(
    private app: App,
    private settings: YTExtractSettings,
    private statusBar: StatusBarManager
  ) {
    this.youtubeService = new YouTubeService();
    this.llmService = new LLMService(settings);
    this.templateService = new TemplateService(app, settings);
  }

  /**
   * Main extraction pipeline
   * Orchestrates YouTube data fetching, LLM processing, template generation, and file saving
   */
  async extract(url: string): Promise<void> {
    try {
      // Validate URL first
      if (!this.youtubeService.isValidYouTubeUrl(url)) {
        throw new Error('Invalid YouTube URL');
      }

      // Step 1: Fetch YouTube data
      this.statusBar.show('Fetching transcript...');
      let youtubeData;
      try {
        youtubeData = await this.youtubeService.extractVideoWithRetry(url);
      } catch (error) {
        youtubeData = await this.handleYouTubeError(error as Error, url);
      }

      // Step 2: Generate LLM summary
      let llmResponse;
      try {
        this.statusBar.update('Generating summary...');
        // Truncate very long transcripts for LLM processing (keep full for note)
        const maxLLMLength = 15000; // ~15K characters
        const truncatedTranscript = youtubeData.transcript.length > maxLLMLength
          ? youtubeData.transcript.substring(0, maxLLMLength) + '\n\n[Transcript truncated for LLM processing]'
          : youtubeData.transcript;

        if (youtubeData.transcript.length > maxLLMLength) {
          console.log(`Transcript truncated from ${youtubeData.transcript.length} to ${maxLLMLength} chars for LLM`);
        }

        llmResponse = await this.llmService.generateSummary(truncatedTranscript);
      } catch (error) {
        llmResponse = await this.handleLLMError(error as Error);
      }

      // Step 3: Process template
      this.statusBar.update('Saving note...');
      const templateData = this.templateService.buildTemplateData(youtubeData, llmResponse);

      let content;
      try {
        content = await this.templateService.processTemplate(templateData);
      } catch (error) {
        content = await this.handleTemplateError(error as Error, templateData);
      }

      // Step 4: Save file
      const filename = this.templateService.generateFilename(templateData);
      const filepath = this.templateService.getFilePath(filename);
      const finalPath = await this.templateService.resolveFileNameConflict(filepath);

      await this.saveFile(finalPath, content);

      // Success
      this.statusBar.showSuccess('Note created successfully');
      new Notice(`Created: ${finalPath}`);

    } catch (error) {
      this.handleError(error as Error);
    }
  }

  /**
   * Handle YouTube extraction errors based on settings
   */
  private async handleYouTubeError(error: Error, url: string): Promise<any> {
    const behavior = this.settings.errorBehavior;

    if (behavior === 'stop') {
      throw error;
    }

    // Extract video ID for partial data
    const videoId = this.youtubeService.extractVideoId(url);

    if (behavior === 'partial' || behavior === 'skip') {
      new Notice(`Warning: ${error.message}. Creating partial note.`);
      return {
        metadata: {
          title: 'Unknown Video',
          url: url,
          videoId: videoId || '',
          channel: 'Unknown'
        },
        transcript: behavior === 'skip' ? 'Transcript unavailable' : '',
        timestampedTranscript: []
      };
    }

    throw error;
  }

  /**
   * Handle LLM errors based on settings
   * Returns empty response structure to allow pipeline to continue
   */
  private async handleLLMError(error: Error): Promise<any> {
    const behavior = this.settings.errorBehavior;

    // Log detailed error for debugging
    console.error('LLM Error Details:', {
      message: error.message,
      stack: error.stack,
      provider: this.settings.llmProvider,
      endpoint: this.settings.llmEndpoint,
      model: this.settings.llmModel
    });

    if (behavior === 'stop') {
      throw new Error(`LLM generation failed: ${error.message}`);
    }

    if (behavior === 'partial' || behavior === 'skip') {
      new Notice(`Warning: LLM error - ${error.message}. Creating note without summary.`);
      return {
        summary: behavior === 'skip' ? 'LLM unavailable' : '',
        keyPoints: [],
        tags: [],
        questions: []
      };
    }

    return {
      summary: '',
      keyPoints: [],
      tags: [],
      questions: []
    };
  }

  /**
   * Handle template processing errors
   * Returns simple fallback content
   */
  private async handleTemplateError(error: Error, templateData: any): Promise<string> {
    new Notice('Warning: Template error, using fallback');

    // Create simple fallback content
    return `# ${templateData.title}

URL: ${templateData.url}
Channel: ${templateData.channel}

## Transcript
${templateData.transcript}`;
  }

  /**
   * Save file to vault with folder creation
   */
  private async saveFile(path: string, content: string): Promise<void> {
    const folderPath = path.substring(0, path.lastIndexOf('/'));

    if (folderPath && !this.app.vault.getAbstractFileByPath(folderPath)) {
      await this.app.vault.createFolder(folderPath);
    }

    await this.app.vault.create(path, content);
  }

  /**
   * Handle extraction errors
   * Central error handler for the entire pipeline
   */
  private handleError(error: Error) {
    console.error('Extraction error:', error);
    this.statusBar.showError('Extraction failed');
    new Notice(`Error: ${error.message}`);
  }
}
