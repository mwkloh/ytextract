import { Plugin } from 'obsidian';
import { YTExtractSettings, DEFAULT_SETTINGS } from './models/types';
import { YTExtractSettingTab } from './ui/settings-tab';

export default class YTExtractPlugin extends Plugin {
  settings: YTExtractSettings;

  async onload() {
    console.log('Loading YouTube Transcript Extractor plugin');

    await this.loadSettings();

    // Add settings tab
    this.addSettingTab(new YTExtractSettingTab(this.app, this));
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
