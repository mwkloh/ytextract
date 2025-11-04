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
    console.log('Loading YouTube Transcript Extractor plugin');

    await this.loadSettings();

    // Initialize status bar
    this.statusBar = new StatusBarManager(this.addStatusBarItem());

    // Add command palette command
    this.addCommand({
      id: 'extract-youtube-video',
      name: 'Extract YouTube Video',
      callback: () => this.openURLModal()
    });

    // Add ribbon icon
    this.addRibbonIcon('youtube', 'Extract YouTube Video', () => {
      this.openURLModal();
    });

    // Add settings tab
    this.addSettingTab(new YTExtractSettingTab(this.app, this));
  }

  openURLModal(prefilledUrl?: string) {
    new URLInputModal(this.app, async (url: string) => {
      const extractionService = new ExtractionService(
        this.app,
        this.settings,
        this.statusBar
      );
      await extractionService.extractVideo(url);
    }, prefilledUrl).open();
  }

  async onunload() {
    console.log('Unloading YouTube Transcript Extractor plugin');
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
