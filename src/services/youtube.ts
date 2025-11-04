import { TranscriptSegment, VideoMetadata, YouTubeData } from '../models/types';
import { YoutubeTranscript } from 'youtube-transcript';

export class YouTubeService {
  /**
   * Extract video ID from various YouTube URL formats
   */
  extractVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Validate if string is a valid YouTube URL
   */
  isValidYouTubeUrl(url: string): boolean {
    return this.extractVideoId(url) !== null;
  }

  /**
   * Fetch transcript for a video
   */
  async fetchTranscript(videoId: string): Promise<{
    plain: string;
    timestamped: TranscriptSegment[]
  }> {
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(videoId);

      const timestamped: TranscriptSegment[] = transcript.map(item => ({
        text: item.text,
        offset: item.offset,
        duration: item.duration
      }));

      const plain = transcript.map(item => item.text).join(' ');

      return { plain, timestamped };
    } catch (error) {
      throw new Error(`Failed to fetch transcript: ${error.message}`);
    }
  }

  /**
   * Format timestamped transcript for display
   */
  formatTimestampedTranscript(segments: TranscriptSegment[]): string {
    return segments.map(segment => {
      const timestamp = this.formatTimestamp(segment.offset);
      return `[${timestamp}] ${segment.text}`;
    }).join('\n');
  }

  /**
   * Convert milliseconds to MM:SS or HH:MM:SS format
   */
  private formatTimestamp(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    const sec = String(seconds % 60).padStart(2, '0');
    const min = String(minutes % 60).padStart(2, '0');

    if (hours > 0) {
      const hr = String(hours).padStart(2, '0');
      return `${hr}:${min}:${sec}`;
    }

    return `${min}:${sec}`;
  }
}
