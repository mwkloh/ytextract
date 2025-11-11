import { Plugin } from 'obsidian';
import { YTExtractSettings, DEFAULT_SETTINGS } from './models/types';
import { YTExtractSettingTab } from './ui/settings-tab';
import { URLInputModal } from './ui/url-modal';
import { StatusBarManager } from './ui/status-bar';
import { ExtractionService } from './services/extraction';

export default class YTExtractPlugin extends Plugin {
  settings: YTExtractSettings;
  statusBar: StatusBarManager;

  async onload() {
    console.debug('Loading YouTube Transcript Extractor plugin');

    await this.loadSettings();

    // Initialize status bar
    this.statusBar = new StatusBarManager(this);

    // Add command palette command
    this.addCommand({
      id: 'extract-youtube-video',
      name: 'Extract YouTube video',
      callback: () => this.openURLModal()
    });

    // Add ribbon icon
    this.addRibbonIcon('youtube', 'Extract YouTube video', () => {
      this.openURLModal();
    });

    // Add editor context menu
    this.registerEvent(
      this.app.workspace.on('editor-menu', (menu, editor) => {
        const selection = editor.getSelection();
        if (this.looksLikeYouTubeURL(selection)) {
          menu.addItem((item) => {
            item
              .setTitle('Extract YouTube video')
              .setIcon('youtube')
              .onClick(() => {
                this.openURLModal(selection);
              });
          });
        }
      })
    );

    // Add settings tab
    this.addSettingTab(new YTExtractSettingTab(this.app, this));
  }

  looksLikeYouTubeURL(text: string): boolean {
    if (!text || text.trim().length === 0) {
      return false;
    }
    const trimmed = text.trim();
    return (
      trimmed.includes('youtube.com') ||
      trimmed.includes('youtu.be') ||
      /^[a-zA-Z0-9_-]{11}$/.test(trimmed)
    );
  }

  openURLModal(prefilledUrl?: string) {
    new URLInputModal(this.app, async (url: string) => {
      const extractionService = new ExtractionService(
        this.app,
        this.settings,
        this.statusBar
      );
      await extractionService.extract(url);
    }, prefilledUrl).open();
  }

  onunload() {
    console.debug('Unloading YouTube Transcript Extractor plugin');
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
