import { TranscriptSegment, VideoMetadata, YouTubeData } from '../models/types';
import { YoutubeTranscript } from 'youtube-transcript';
import ytdl from '@distube/ytdl-core';

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

  /**
   * Fetch video metadata
   */
  async fetchMetadata(videoId: string): Promise<VideoMetadata> {
    try {
      const url = `https://www.youtube.com/watch?v=${videoId}`;
      const info = await ytdl.getInfo(url);

      const videoDetails = info.videoDetails;

      return {
        title: videoDetails.title,
        url: url,
        videoId: videoId,
        channel: videoDetails.author.name,
        uploadDate: videoDetails.publishDate,
        duration: this.formatDuration(parseInt(videoDetails.lengthSeconds)),
        viewCount: parseInt(videoDetails.viewCount),
        description: videoDetails.description || '',
        channelUrl: videoDetails.author.channel_url,
        thumbnailUrl: videoDetails.thumbnails[0]?.url || ''
      };
    } catch (error) {
      throw new Error(`Failed to fetch metadata: ${error.message}`);
    }
  }

  /**
   * Format duration from seconds to readable format
   */
  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  /**
   * Extract all data for a YouTube video
   */
  async extractVideo(url: string): Promise<YouTubeData> {
    const videoId = this.extractVideoId(url);

    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    const [metadata, { plain, timestamped }] = await Promise.all([
      this.fetchMetadata(videoId),
      this.fetchTranscript(videoId)
    ]);

    return {
      metadata,
      transcript: plain,
      timestampedTranscript: timestamped
    };
  }

  /**
   * Extract with retry logic
   */
  async extractVideoWithRetry(url: string, maxRetries = 3): Promise<YouTubeData> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.extractVideo(url);
      } catch (error) {
        lastError = error as Error;

        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Failed to extract video after retries');
  }
}
