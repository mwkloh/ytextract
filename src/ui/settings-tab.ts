import { App, Notice, PluginSettingTab, Setting, TFile } from 'obsidian';
import YTExtractPlugin from '../main';

export class YTExtractSettingTab extends PluginSettingTab {
  plugin: YTExtractPlugin;
  private templateFilename: string = '';

  constructor(app: App, plugin: YTExtractPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    this.addFileManagementSettings(containerEl);
    this.addMetadataSettings(containerEl);
    this.addLLMSettings(containerEl);
    this.addErrorHandlingSettings(containerEl);
  }

  private addFileManagementSettings(containerEl: HTMLElement): void {
    new Setting(containerEl).setName('File management').setHeading();

    new Setting(containerEl)
      .setName('Default folder')
      .setDesc('Default folder to save extracted videos')
      .addText(text => text
        .setPlaceholder('Example: YouTube')
        .setValue(this.plugin.settings.defaultFolder)
        .onChange(async (value) => {
          this.plugin.settings.defaultFolder = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Naming pattern')
      .setDesc('File naming pattern. Variables: {date}, {title}, {channel}, {id}')
      .addText(text => text
        .setPlaceholder('{date} - {title}')
        .setValue(this.plugin.settings.namingPattern)
        .onChange(async (value) => {
          this.plugin.settings.namingPattern = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Template file path')
      .setDesc('Path to custom template file (leave empty for default)')
      .addText(text => text
        .setPlaceholder('templates/youtube.md')
        .setValue(this.plugin.settings.templatePath)
        .onChange(async (value) => {
          this.plugin.settings.templatePath = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('File exists behavior')
      .setDesc('What to do when file already exists')
      .addDropdown(dropdown => dropdown
        .addOption('append', 'Append number to filename')
        .addOption('prompt', 'Prompt for overwrite')
        .setValue(this.plugin.settings.fileExistsBehavior)
        .onChange(async (value) => {
          this.plugin.settings.fileExistsBehavior = value as 'append' | 'prompt';
          await this.plugin.saveSettings();
        }));
  }

  private addMetadataSettings(containerEl: HTMLElement): void {
    new Setting(containerEl).setName('Video metadata fields').setHeading();

    new Setting(containerEl)
      .setName('Include upload date')
      .setDesc('Include video upload date in template')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.includeUploadDate)
        .onChange(async (value) => {
          this.plugin.settings.includeUploadDate = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Include duration')
      .setDesc('Include video duration in template')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.includeDuration)
        .onChange(async (value) => {
          this.plugin.settings.includeDuration = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Include view count')
      .setDesc('Include video view count in template')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.includeViewCount)
        .onChange(async (value) => {
          this.plugin.settings.includeViewCount = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Include description')
      .setDesc('Include video description in template')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.includeDescription)
        .onChange(async (value) => {
          this.plugin.settings.includeDescription = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Include channel URL')
      .setDesc('Include channel URL in template')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.includeChannelUrl)
        .onChange(async (value) => {
          this.plugin.settings.includeChannelUrl = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Include thumbnail URL')
      .setDesc('Include video thumbnail URL in template')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.includeThumbnailUrl)
        .onChange(async (value) => {
          this.plugin.settings.includeThumbnailUrl = value;
          await this.plugin.saveSettings();
        }));

    // Template Generator subsection
    new Setting(containerEl).setName('Template generator').setHeading();

    const desc = containerEl.createDiv({ cls: 'setting-item-description' });
    desc.setText('If you don\'t generate a custom template, a default template will be used.');

    new Setting(containerEl)
      .setName('Template filename')
      .setDesc('Enter template filename (without .md)')
      .addText(text => text
        .setPlaceholder('YouTube-template')
        .setValue(this.templateFilename)
        .onChange((value) => {
          this.templateFilename = value;
        })
      );

    new Setting(containerEl)
      .setName('Include summary section')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.templateGeneratorSections.includeSummary)
        .onChange(async (value) => {
          this.plugin.settings.templateGeneratorSections.includeSummary = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Include key points section')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.templateGeneratorSections.includeKeyPoints)
        .onChange(async (value) => {
          this.plugin.settings.templateGeneratorSections.includeKeyPoints = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Include tags section')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.templateGeneratorSections.includeTags)
        .onChange(async (value) => {
          this.plugin.settings.templateGeneratorSections.includeTags = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Include questions section')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.templateGeneratorSections.includeQuestions)
        .onChange(async (value) => {
          this.plugin.settings.templateGeneratorSections.includeQuestions = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Include personal notes section')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.templateGeneratorSections.includePersonalNotes)
        .onChange(async (value) => {
          this.plugin.settings.templateGeneratorSections.includePersonalNotes = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Include transcript section')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.templateGeneratorSections.includeTranscript)
        .onChange(async (value) => {
          this.plugin.settings.templateGeneratorSections.includeTranscript = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Generate custom template')
      .setDesc('Create a template file based on your selections')
      .addButton(button => button
        .setButtonText('Generate template')
        .setCta()
        .onClick(async () => {
          // Validate filename
          if (!this.validateFilename(this.templateFilename)) {
            return;
          }

          // Validate section selection
          if (!this.validateSectionSelection()) {
            return;
          }

          // Sanitize filename
          const sanitizedFilename = this.sanitizeFilename(this.templateFilename);

          // Generate template content
          const templateContent = this.generateTemplateContent();

          try {
            // Create template file
            const filePath = await this.createTemplateFile(sanitizedFilename, templateContent);

            // Update settings with new template path
            this.plugin.settings.templatePath = filePath;
            await this.plugin.saveSettings();

            // Refresh display to show updated template path
            this.display();

            // Show success message
            new Notice(`Template created at ${filePath}. Now using this template for extractions.`);
          } catch (error) {
            console.error('Failed to create template:', error);
            new Notice('Failed to create template file.');
          }
        }));
  }

  private addLLMSettings(containerEl: HTMLElement): void {
    new Setting(containerEl).setName('LLM configuration').setHeading();

    new Setting(containerEl)
      .setName('LLM provider')
      .setDesc('Select your LLM provider (cloud or local)')
      .addDropdown(dropdown => dropdown
        .addOption('ollama', 'Ollama (local)')
        .addOption('lmstudio', 'Lm studio (local)')
        .addOption('llamacpp', 'Llama.cpp (local)')
        .addOption('openai', 'OpenAI (cloud)')
        .addOption('anthropic', 'Anthropic (cloud)')
        .addOption('openrouter', 'OpenRouter (cloud)')
        .addOption('custom', 'Custom')
        .setValue(this.plugin.settings.llmProvider)
        .onChange(async (value) => {
          this.plugin.settings.llmProvider = value as 'ollama' | 'lmstudio' | 'llamacpp' | 'openai' | 'anthropic' | 'openrouter' | 'custom';

          // Update endpoint based on provider selection
          if (value === 'ollama') {
            this.plugin.settings.llmEndpoint = 'http://localhost:11434/api/generate';
            this.plugin.settings.llmModel = 'llama2';
          } else if (value === 'lmstudio') {
            this.plugin.settings.llmEndpoint = 'http://localhost:1234/v1/chat/completions';
            this.plugin.settings.llmModel = '';
          } else if (value === 'llamacpp') {
            this.plugin.settings.llmEndpoint = 'http://localhost:8080/completion';
            this.plugin.settings.llmModel = '';
          } else if (value === 'openai') {
            this.plugin.settings.llmEndpoint = 'https://api.openai.com/v1/chat/completions';
            this.plugin.settings.llmModel = 'gpt-4o-mini';
          } else if (value === 'anthropic') {
            this.plugin.settings.llmEndpoint = 'https://api.anthropic.com/v1/messages';
            this.plugin.settings.llmModel = 'claude-3-5-haiku-20241022';
          } else if (value === 'openrouter') {
            this.plugin.settings.llmEndpoint = 'https://openrouter.ai/api/v1/chat/completions';
            this.plugin.settings.llmModel = 'anthropic/claude-3.5-haiku';
          } else if (value === 'custom') {
            this.plugin.settings.llmEndpoint = '';
            this.plugin.settings.llmModel = '';
          }

          await this.plugin.saveSettings();
          this.display();
        }));

    // Show API key field for cloud providers
    const isCloudProvider = ['openai', 'anthropic', 'openrouter'].includes(this.plugin.settings.llmProvider);

    if (isCloudProvider) {
      new Setting(containerEl)
        .setName('API key')
        .setDesc('Your API key for the cloud provider')
        .addText(text => {
          text
            .setPlaceholder('Enter your API key')
            .setValue(this.plugin.settings.llmApiKey)
            .onChange(async (value) => {
              this.plugin.settings.llmApiKey = value;
              await this.plugin.saveSettings();
            });
          text.inputEl.type = 'password';
        });
    }

    // Only show auto-detect for local providers
    if (!isCloudProvider) {
      new Setting(containerEl)
        .setName('Auto-detect endpoint')
        .setDesc('Automatically detect LLM endpoint')
        .addToggle(toggle => toggle
          .setValue(this.plugin.settings.autoDetectEndpoint)
          .onChange(async (value) => {
            this.plugin.settings.autoDetectEndpoint = value;
            await this.plugin.saveSettings();
          }));
    }

    new Setting(containerEl)
      .setName('LLM endpoint')
      .setDesc(isCloudProvider ? 'API endpoint URL (usually default is fine)' : 'Custom endpoint URL for local LLM')
      .addText(text => text
        .setPlaceholder(
          this.plugin.settings.llmProvider === 'openai' ? 'https://api.openai.com/v1/chat/completions' :
          this.plugin.settings.llmProvider === 'anthropic' ? 'https://api.anthropic.com/v1/messages' :
          this.plugin.settings.llmProvider === 'openrouter' ? 'https://openrouter.ai/api/v1/chat/completions' :
          'http://localhost:11434/api/generate'
        )
        .setValue(this.plugin.settings.llmEndpoint)
        .onChange(async (value) => {
          this.plugin.settings.llmEndpoint = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Model name')
      .setDesc(isCloudProvider ? 'Model to use (e.g., gpt-4o-mini, claude-3-5-haiku-20241022)' : 'Local model name')
      .addText(text => text
        .setPlaceholder(
          this.plugin.settings.llmProvider === 'openai' ? 'gpt-4o-mini' :
          this.plugin.settings.llmProvider === 'anthropic' ? 'claude-3-5-haiku-20241022' :
          this.plugin.settings.llmProvider === 'openrouter' ? 'anthropic/claude-3.5-haiku' :
          'llama2'
        )
        .setValue(this.plugin.settings.llmModel)
        .onChange(async (value) => {
          this.plugin.settings.llmModel = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Test connection')
      .setDesc('Test connection to your LLM provider')
      .addButton(button => button
        .setButtonText('Test connection')
        .setCta()
        .onClick(async () => {
          button.setButtonText('Testing...');
          button.setDisabled(true);

          try {
            const llmService = new (await import('../services/llm')).LLMService(this.plugin.settings);
            const isConnected = await llmService.testConnection();

            if (isConnected) {
              new Notice('✅ successfully connected to LLM provider!');
            } else {
              new Notice('❌ failed to connect to LLM provider. Check your settings.');
            }
          } catch (error) {
            new Notice(`❌ Connection test failed: ${(error as Error).message}`);
            console.error('LLM connection test error:', error);
          } finally {
            button.setButtonText('Test connection');
            button.setDisabled(false);
          }
        }));

    new Setting(containerEl)
      .setName('Custom system prompt')
      .setDesc('Customize the prompt sent to the LLM')
      .addTextArea(text => text
        .setPlaceholder('Summarize the following transcript...')
        .setValue(this.plugin.settings.customSystemPrompt)
        .onChange(async (value) => {
          this.plugin.settings.customSystemPrompt = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Request timeout (ms)')
      .setDesc('Timeout for LLM requests in milliseconds')
      .addText(text => text
        .setPlaceholder('30000')
        .setValue(String(this.plugin.settings.requestTimeout))
        .onChange(async (value) => {
          const num = parseInt(value);
          if (!isNaN(num)) {
            this.plugin.settings.requestTimeout = num;
            await this.plugin.saveSettings();
          }
        }));
  }

  private addErrorHandlingSettings(containerEl: HTMLElement): void {
    new Setting(containerEl).setName('Error handling').setHeading();

    new Setting(containerEl)
      .setName('Error behavior')
      .setDesc('How to handle errors during extraction')
      .addDropdown(dropdown => dropdown
        .addOption('stop', 'Stop on error (don\'t create file)')
        .addOption('partial', 'Save partial data')
        .addOption('skip', 'Skip failed steps with warning')
        .setValue(this.plugin.settings.errorBehavior)
        .onChange(async (value) => {
          this.plugin.settings.errorBehavior = value as 'stop' | 'partial' | 'skip';
          await this.plugin.saveSettings();
        }));
  }

  private buildTemplateFrontmatter(): string {
    const settings = this.plugin.settings;
    let frontmatter = '---\n';

    // Always include core fields
    frontmatter += 'title: {{title}}\n';
    frontmatter += 'url: {{url}}\n';
    frontmatter += 'channel: {{channel}}\n';

    // Optional metadata fields
    if (settings.includeUploadDate) {
      frontmatter += 'date: {{upload_date}}\n';
    }
    if (settings.includeDuration) {
      frontmatter += 'duration: {{duration}}\n';
    }
    if (settings.includeViewCount) {
      frontmatter += 'view_count: {{view_count}}\n';
    }
    if (settings.includeDescription) {
      frontmatter += 'description: {{description}}\n';
    }
    if (settings.includeChannelUrl) {
      frontmatter += 'channel_url: {{channel_url}}\n';
    }
    if (settings.includeThumbnailUrl) {
      frontmatter += 'thumbnail_url: {{thumbnail_url}}\n';
    }
    if (settings.templateGeneratorSections.includeTags) {
      frontmatter += 'tags: {{generated_tags}}\n';
    }

    frontmatter += '---\n\n';
    return frontmatter;
  }

  private buildTemplateBody(): string {
    const sections = this.plugin.settings.templateGeneratorSections;
    let body = '# {{title}}\n\n';

    if (sections.includeSummary) {
      body += '## Summary\n{{llm_summary}}\n\n---\n\n';
    }

    if (sections.includeKeyPoints) {
      body += '## Key Points\n{{llm_key_points}}\n\n---\n\n';
    }

    if (sections.includePersonalNotes) {
      body += '## Personal Notes\n\n---\n\n';
    }

    if (sections.includeQuestions) {
      body += '## Questions\n{{llm_questions}}\n\n---\n\n';
    }

    if (sections.includeTranscript) {
      body += '## Transcript\n{{transcript}}';
    }

    return body;
  }

  private generateTemplateContent(): string {
    return this.buildTemplateFrontmatter() + this.buildTemplateBody();
  }

  private sanitizeFilename(filename: string): string {
    // Remove special characters, replace spaces with hyphens
    let sanitized = filename
      .replace(/[\\/:*?"<>|]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase();

    // Add .md extension if not present
    if (!sanitized.endsWith('.md')) {
      sanitized += '.md';
    }

    return sanitized;
  }

  private validateFilename(filename: string): boolean {
    if (!filename || filename.trim().length === 0) {
      new Notice('Please enter a template name');
      return false;
    }
    return true;
  }

  private validateSectionSelection(): boolean {
    const sections = this.plugin.settings.templateGeneratorSections;
    const hasSelection =
      sections.includeSummary ||
      sections.includeKeyPoints ||
      sections.includeTags ||
      sections.includeQuestions ||
      sections.includePersonalNotes ||
      sections.includeTranscript;

    if (!hasSelection) {
      new Notice('Please select at least one section to include in the template');
      return false;
    }

    return true;
  }

  private getTemplatesFolder(): string {
    // Try to get user's configured templates folder
    const config = (this.app.vault as { config?: { templatesFolder?: string } }).config;

    // Check if templates folder is configured
    if (config && config.templatesFolder) {
      return config.templatesFolder;
    }

    // Default to 'templates' folder in vault root
    return 'templates';
  }

  private async ensureFolderExists(folderPath: string): Promise<void> {
    const folder = this.app.vault.getAbstractFileByPath(folderPath);

    if (!folder) {
      await this.app.vault.createFolder(folderPath);
    }
  }

  private async createTemplateFile(filename: string, content: string): Promise<string> {
    const templatesFolder = this.getTemplatesFolder();
    await this.ensureFolderExists(templatesFolder);

    const filePath = `${templatesFolder}/${filename}`;
    const existingFile = this.app.vault.getAbstractFileByPath(filePath);

    if (existingFile) {
      // File exists - overwrite it
      if (existingFile instanceof TFile) {
        await this.app.vault.modify(existingFile, content);
      }
    } else {
      // Create new file
      await this.app.vault.create(filePath, content);
    }

    return filePath;
  }
}
