import { App, Modal, Notice, Setting } from 'obsidian';
import { YouTubeService } from '../services/youtube';

export class URLInputModal extends Modal {
  private url: string = '';
  private onSubmit: (url: string) => void;
  private youtubeService: YouTubeService;

  constructor(app: App, onSubmit: (url: string) => void, initialUrl?: string) {
    super(app);
    this.onSubmit = onSubmit;
    this.youtubeService = new YouTubeService();
    if (initialUrl) {
      this.url = initialUrl;
    }
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl('h2', { text: 'Extract YouTube video' });

    new Setting(contentEl)
      .setName('YouTube URL')
      .setDesc('Enter the YouTube video URL')
      .addText(text => {
        text
          .setPlaceholder('https://www.youtube.com/watch?v=...')
          .setValue(this.url)
          .onChange(value => {
            this.url = value;
          });

        // Auto-focus and select text
        setTimeout(() => {
          text.inputEl.focus();
          text.inputEl.select();
        }, 10);

        // Handle Enter key
        text.inputEl.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            this.handleSubmit();
          }
        });
      });

    const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });

    buttonContainer.createEl('button', { text: 'Cancel' }, (btn) => {
      btn.addEventListener('click', () => this.close());
    });

    buttonContainer.createEl('button', {
      text: 'Extract',
      cls: 'mod-cta'
    }, (btn) => {
      btn.addEventListener('click', () => this.handleSubmit());
    });
  }

  private handleSubmit() {
    if (!this.url.trim()) {
      new Notice('Please enter a YouTube URL');
      return;
    }

    if (!this.youtubeService.isValidYouTubeUrl(this.url)) {
      new Notice('Invalid YouTube URL');
      return;
    }

    this.close();
    this.onSubmit(this.url);
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
