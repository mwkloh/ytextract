import { TranscriptSegment, VideoMetadata, YouTubeData } from '../models/types';
import { requestUrl } from 'obsidian';

// Custom implementation using Obsidian's requestUrl API to avoid CORS issues
// Both ytdl-core and youtube-transcript libraries don't work in Obsidian's sandboxed environment

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
   * Fetch transcript for a video using Obsidian's requestUrl (CORS-safe)
   */
  async fetchTranscript(videoId: string): Promise<{
    plain: string;
    timestamped: TranscriptSegment[]
  }> {
    try {
      // First, get the video page to find the caption tracks
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      const response = await requestUrl({ url: videoUrl });
      const html = response.text;

      // Extract caption tracks URL from the page
      // Need to find the full captionTracks array with proper bracket matching
      const captionTracksStart = html.indexOf('"captionTracks":[');
      if (captionTracksStart === -1) {
        throw new Error('No captions available for this video');
      }

      // Find the matching closing bracket
      let bracketCount = 0;
      let i = captionTracksStart + '"captionTracks":'.length;
      const startIdx = i;

      for (; i < html.length; i++) {
        if (html[i] === '[') bracketCount++;
        if (html[i] === ']') bracketCount--;
        if (bracketCount === 0) break;
      }

      const captionTracksJson = html.substring(startIdx, i + 1);
      console.log('Caption tracks JSON length:', captionTracksJson.length);

      const captionTracks = JSON.parse(captionTracksJson);

      // Find English captions (or first available)
      let captionTrack = captionTracks.find((track: any) =>
        track.languageCode === 'en' || track.languageCode.startsWith('en')
      );

      if (!captionTrack) {
        captionTrack = captionTracks[0]; // Use first available if no English
      }

      if (!captionTrack || !captionTrack.baseUrl) {
        throw new Error('No valid caption track found');
      }

      // Fetch the actual transcript in JSON format
      // Use fmt=json3 to get structured JSON response with segments
      let transcriptUrl = captionTrack.baseUrl;

      // Add &fmt=json3 to get JSON format instead of XML
      if (!transcriptUrl.includes('fmt=')) {
        transcriptUrl += '&fmt=json3';
      }

      const transcriptResponse = await requestUrl({ url: transcriptUrl });
      const transcriptData = JSON.parse(transcriptResponse.text);

      // Parse JSON3 format which contains events array with segment data
      const timestamped = this.parseTranscriptJson(transcriptData);
      const plain = timestamped.map(item => item.text).join(' ');

      return { plain, timestamped };
    } catch (error) {
      throw new Error(`Failed to fetch transcript: ${error.message}`);
    }
  }

  /**
   * Parse YouTube transcript JSON3 format
   */
  private parseTranscriptJson(data: any): TranscriptSegment[] {
    const segments: TranscriptSegment[] = [];

    if (!data.events) {
      return segments;
    }

    for (const event of data.events) {
      // Skip events without segments (timing markers, etc.)
      if (!event.segs) {
        continue;
      }

      const startTime = event.tStartMs || 0;
      const duration = event.dDurationMs || 0;

      // Combine all segment texts
      const text = event.segs
        .map((seg: any) => seg.utf8 || '')
        .join('')
        .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width spaces
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();

      if (text) {
        segments.push({
          text,
          offset: startTime,
          duration
        });
      }
    }

    return segments;
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
   * Fetch video metadata using Obsidian's requestUrl (CORS-safe)
   * Parses YouTube page HTML to extract video information
   */
  async fetchMetadata(videoId: string): Promise<VideoMetadata> {
    try {
      const url = `https://www.youtube.com/watch?v=${videoId}`;

      // Use Obsidian's requestUrl which bypasses CORS
      const response = await requestUrl({ url });
      const html = response.text;

      // Parse metadata from YouTube page HTML using regex
      const title = this.extractFromHTML(html, /"title":"([^"]+)"/) || `Video ${videoId}`;
      const channel = this.extractFromHTML(html, /"author":"([^"]+)"/) || 'Unknown Channel';
      const lengthSeconds = this.extractFromHTML(html, /"lengthSeconds":"(\d+)"/) || '0';
      const viewCount = this.extractFromHTML(html, /"viewCount":"(\d+)"/) || '0';
      const publishDate = this.extractFromHTML(html, /"publishDate":"([^"]+)"/) || new Date().toISOString().split('T')[0];
      const description = this.extractFromHTML(html, /"shortDescription":"([^"]+)"/) || '';

      return {
        title: this.decodeHTML(title),
        url: url,
        videoId: videoId,
        channel: this.decodeHTML(channel),
        uploadDate: publishDate,
        duration: this.formatDuration(parseInt(lengthSeconds)),
        viewCount: parseInt(viewCount),
        description: this.decodeHTML(description),
        channelUrl: `https://www.youtube.com/channel/${videoId}`,
        thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`
      };
    } catch (error) {
      // Fallback to minimal metadata if parsing fails
      const url = `https://www.youtube.com/watch?v=${videoId}`;
      return {
        title: `Video ${videoId}`,
        url: url,
        videoId: videoId,
        channel: 'Unknown',
        uploadDate: new Date().toISOString().split('T')[0],
        duration: '0:00',
        viewCount: 0,
        description: '',
        channelUrl: '',
        thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`
      };
    }
  }

  /**
   * Extract data from HTML using regex
   */
  private extractFromHTML(html: string, regex: RegExp): string | null {
    const match = html.match(regex);
    return match ? match[1] : null;
  }

  /**
   * Decode HTML entities
   */
  private decodeHTML(text: string): string {
    const entities: Record<string, string> = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '\\u0026': '&',
      '\\n': '\n'
    };

    let decoded = text;
    for (const [entity, char] of Object.entries(entities)) {
      decoded = decoded.replace(new RegExp(entity, 'g'), char);
    }

    return decoded;
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
