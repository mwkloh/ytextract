import { Plugin } from 'obsidian';

export class StatusBarManager {
  private statusBarItem: HTMLElement;
  private currentMessage: string = '';

  constructor(private plugin: Plugin) {
    this.statusBarItem = this.plugin.addStatusBarItem();
  }

  /**
   * Show status message
   */
  show(message: string) {
    this.currentMessage = message;
    this.statusBarItem.setText(message);
    this.statusBarItem.style.display = 'inline-block';
  }

  /**
   * Update current message
   */
  update(message: string) {
    this.show(message);
  }

  /**
   * Clear status message
   */
  clear() {
    this.currentMessage = '';
    this.statusBarItem.setText('');
    this.statusBarItem.style.display = 'none';
  }

  /**
   * Show success message and auto-clear
   */
  showSuccess(message: string, duration: number = 3000) {
    this.show(`✓ ${message}`);
    setTimeout(() => this.clear(), duration);
  }

  /**
   * Show error message and auto-clear
   */
  showError(message: string, duration: number = 5000) {
    this.show(`✗ ${message}`);
    setTimeout(() => this.clear(), duration);
  }

  /**
   * Get current message
   */
  getCurrentMessage(): string {
    return this.currentMessage;
  }
}
