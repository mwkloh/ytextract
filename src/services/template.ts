import { App, TFile } from 'obsidian';
import { TemplateData, YouTubeData, LLMResponse, YTExtractSettings } from '../models/types';
import { YouTubeService } from './youtube';

export class TemplateService {
  private youtubeService: YouTubeService;

  constructor(
    private app: App,
    private settings: YTExtractSettings
  ) {
    this.youtubeService = new YouTubeService();
  }

  /**
   * Build template data from YouTube data and LLM response
   */
  buildTemplateData(
    youtubeData: YouTubeData,
    llmResponse: LLMResponse
  ): TemplateData {
    const { metadata, transcript, timestampedTranscript } = youtubeData;

    return {
      // Video metadata
      title: metadata.title,
      url: metadata.url,
      channel: metadata.channel,
      upload_date: this.settings.includeUploadDate ? (metadata.uploadDate || '') : '',
      duration: this.settings.includeDuration ? (metadata.duration || '') : '',
      view_count: this.settings.includeViewCount ? String(metadata.viewCount || '') : '',
      description: this.settings.includeDescription ? (metadata.description || '') : '',
      channel_url: this.settings.includeChannelUrl ? (metadata.channelUrl || '') : '',
      thumbnail_url: this.settings.includeThumbnailUrl ? (metadata.thumbnailUrl || '') : '',

      // LLM outputs
      llm_summary: llmResponse.summary || '',
      llm_key_points: this.formatKeyPoints(llmResponse.keyPoints),
      generated_tags: this.formatTagsYAML(llmResponse.tags),
      generated_tags_hashtags: this.formatTagsHashtags(llmResponse.tags),
      llm_questions: this.formatQuestions(llmResponse.questions),

      // Transcript
      transcript: transcript,
      transcript_timestamped: timestampedTranscript
        ? this.youtubeService.formatTimestampedTranscript(timestampedTranscript)
        : '',

      // Other
      extraction_date: new Date().toISOString().split('T')[0]
    };
  }

  /**
   * Process template with data
   */
  async processTemplate(data: TemplateData): Promise<string> {
    let template: string;

    if (this.settings.templatePath) {
      template = await this.loadCustomTemplate();
    } else {
      template = await this.loadDefaultTemplate();
    }

    return this.replaceVariables(template, data);
  }

  /**
   * Load custom template from vault
   */
  private async loadCustomTemplate(): Promise<string> {
    const file = this.app.vault.getAbstractFileByPath(this.settings.templatePath);

    if (!file || !(file instanceof TFile)) {
      throw new Error('Custom template file not found');
    }

    return await this.app.vault.read(file);
  }

  /**
   * Load default template
   */
  private async loadDefaultTemplate(): Promise<string> {
    return `---
title: {{title}}
url: {{url}}
channel: {{channel}}
date: {{upload_date}}
duration: {{duration}}
tags: {{generated_tags_hashtags}}
---

# {{title}}

## Summary
{{llm_summary}}

---

## Key Points
{{llm_key_points}}

---

## Personal Notes

---

## Transcript
{{transcript}}
`;
  }

  /**
   * Replace template variables with actual data
   */
  private replaceVariables(template: string, data: TemplateData): string {
    let result = template;

    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value);
    }

    return result;
  }

  /**
   * Format key points as bullet list
   */
  private formatKeyPoints(points: string[] | undefined): string {
    if (!points || points.length === 0) return '';
    return points.map(point => `- ${point}`).join('\n');
  }

  /**
   * Format tags for YAML frontmatter (array format)
   */
  private formatTagsYAML(tags: string[] | undefined): string {
    if (!tags || tags.length === 0) return '';

    const formattedTags = tags
      .map(tag => {
        // Remove special characters and convert to single word
        return tag
          .toLowerCase()
          .replace(/[^\w\s-]/g, '') // Remove special chars except spaces and hyphens
          .replace(/\s+/g, '-')      // Replace spaces with hyphens
          .replace(/^-+|-+$/g, '');  // Remove leading/trailing hyphens
      })
      .filter(tag => tag.length > 0);

    // Format as YAML array for frontmatter
    return '\n' + formattedTags.map(tag => `  - ${tag}`).join('\n');
  }

  /**
   * Format tags with # prefix for document body
   */
  private formatTagsHashtags(tags: string[] | undefined): string {
    if (!tags || tags.length === 0) return '';

    return tags
      .map(tag => {
        // Remove special characters and convert to single word
        const singleWord = tag
          .toLowerCase()
          .replace(/[^\w\s-]/g, '') // Remove special chars except spaces and hyphens
          .replace(/\s+/g, '-')      // Replace spaces with hyphens
          .replace(/^-+|-+$/g, '');  // Remove leading/trailing hyphens

        return `#${singleWord}`;
      })
      .join(' ');
  }

  /**
   * Format questions as numbered list
   */
  private formatQuestions(questions: string[] | undefined): string {
    if (!questions || questions.length === 0) return '';
    return questions.map((q, i) => `${i + 1}. ${q}`).join('\n');
  }

  /**
   * Generate filename from template
   */
  generateFilename(data: TemplateData): string {
    let filename = this.settings.namingPattern;

    filename = filename.replace('{date}', data.extraction_date);
    filename = filename.replace('{title}', this.sanitizeFilename(data.title));
    filename = filename.replace('{channel}', this.sanitizeFilename(data.channel));
    filename = filename.replace('{id}', data.url.split('v=')[1] || '');

    return `${filename}.md`;
  }

  /**
   * Sanitize filename by removing invalid characters
   */
  private sanitizeFilename(name: string): string {
    return name.replace(/[\\/:*?"<>|]/g, '-').substring(0, 100);
  }

  /**
   * Get full file path with folder
   */
  getFilePath(filename: string): string {
    const folder = this.settings.defaultFolder;
    return folder ? `${folder}/${filename}` : filename;
  }

  /**
   * Handle file name conflicts
   */
  async resolveFileNameConflict(path: string): Promise<string> {
    const file = this.app.vault.getAbstractFileByPath(path);

    if (!file) {
      return path;
    }

    if (this.settings.fileExistsBehavior === 'append') {
      let counter = 1;
      let newPath = path;

      while (this.app.vault.getAbstractFileByPath(newPath)) {
        const pathWithoutExt = path.replace('.md', '');
        newPath = `${pathWithoutExt} ${counter}.md`;
        counter++;
      }

      return newPath;
    }

    return path;
  }
}
