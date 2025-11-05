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
   * Fetch transcript using Innertube API (YouTube's internal API)
   * This works for auto-generated (ASR) captions when timedtext API fails
   */
  private async fetchTranscriptViaInnertube(videoId: string): Promise<{
    plain: string;
    timestamped: TranscriptSegment[];
  }> {
    console.log('Trying Innertube API for ASR captions...');

    // Get initial player response with API key
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const pageResponse = await requestUrl({ url: videoUrl });
    const html = pageResponse.text;

    // Extract INNERTUBE_API_KEY
    const apiKeyMatch = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/);
    if (!apiKeyMatch) {
      throw new Error('Could not find Innertube API key');
    }
    const apiKey = apiKeyMatch[1];
    console.log('Found Innertube API key');

    // Call YouTube's internal API
    const innertubeUrl = `https://www.youtube.com/youtubei/v1/player?key=${apiKey}`;
    const requestBody = {
      context: {
        client: {
          clientName: 'WEB',
          clientVersion: '2.20231219.01.00'
        }
      },
      videoId: videoId
    };

    const playerResponse = await requestUrl({
      url: innertubeUrl,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const playerData = JSON.parse(playerResponse.text);

    // Extract captions from player response
    const captionTracks = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    if (!captionTracks || captionTracks.length === 0) {
      throw new Error('No captions found in Innertube response');
    }

    console.log('Innertube caption tracks:', captionTracks.length);

    // Find English captions
    let captionTrack = captionTracks.find((track: any) =>
      track.languageCode === 'en' || track.languageCode.startsWith('en')
    );

    if (!captionTrack) {
      captionTrack = captionTracks[0];
    }

    console.log('Selected Innertube track:', captionTrack.languageCode);

    // Fetch transcript XML from baseUrl
    const transcriptUrl = captionTrack.baseUrl;
    const transcriptResponse = await requestUrl({ url: transcriptUrl });
    const transcriptXml = transcriptResponse.text;

    console.log('Innertube transcript length:', transcriptXml.length);

    if (transcriptXml.length === 0) {
      throw new Error('Empty transcript from Innertube API');
    }

    // Parse XML
    const timestamped = this.parseTranscriptXml(transcriptXml);
    const plain = timestamped.map(item => item.text).join(' ');

    console.log('Innertube parsed segments:', timestamped.length);

    return { plain, timestamped };
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

      console.log('Total caption tracks:', captionTracks.length);
      console.log('Caption tracks:', captionTracks.map((t: any) => ({
        lang: t.languageCode,
        name: t.name?.simpleText,
        kind: t.kind
      })));

      // Prioritize manual captions over auto-generated (ASR)
      // Manual captions don't have kind=asr and work reliably
      const manualTracks = captionTracks.filter((track: any) => track.kind !== 'asr');
      const asrTracks = captionTracks.filter((track: any) => track.kind === 'asr');

      console.log('Manual tracks:', manualTracks.length);
      console.log('ASR tracks:', asrTracks.length);

      // Try manual English first, then manual any language, then ASR English, then ASR any
      let captionTrack = manualTracks.find((track: any) =>
        track.languageCode === 'en' || track.languageCode.startsWith('en')
      );

      if (!captionTrack && manualTracks.length > 0) {
        captionTrack = manualTracks[0];
        console.log('Using first manual track:', captionTrack.languageCode);
      }

      if (!captionTrack) {
        captionTrack = asrTracks.find((track: any) =>
          track.languageCode === 'en' || track.languageCode.startsWith('en')
        );
        console.log('Falling back to ASR English');
      }

      if (!captionTrack && asrTracks.length > 0) {
        captionTrack = asrTracks[0];
        console.log('Using first ASR track:', captionTrack.languageCode);
      }

      if (!captionTrack || !captionTrack.baseUrl) {
        throw new Error('No valid caption track found');
      }

      console.log('Selected track:', {
        lang: captionTrack.languageCode,
        kind: captionTrack.kind,
        hasBaseUrl: !!captionTrack.baseUrl
      });

      // Use the exact baseUrl from YouTube WITHOUT modifications
      // The URL already has the correct format parameter and cryptographic signature
      // Adding any parameters will invalidate the signature and return empty response
      const transcriptUrl = captionTrack.baseUrl;

      console.log('Caption track baseUrl:', transcriptUrl);
      console.log('Has fmt parameter?', transcriptUrl.includes('fmt='));
      console.log('Fetching transcript from:', transcriptUrl.substring(0, 150) + '...');

      const transcriptResponse = await requestUrl({ url: transcriptUrl });

      console.log('Response status:', transcriptResponse.status);
      console.log('Response length:', transcriptResponse.text.length);
      console.log('First 200 chars:', transcriptResponse.text.substring(0, 200));

      if (transcriptResponse.text.length === 0) {
        console.log('Timedtext API returned empty, trying Innertube API...');
        // Fall back to Innertube API for ASR captions
        return await this.fetchTranscriptViaInnertube(videoId);
      }

      let timestamped: TranscriptSegment[];

      // Try to detect format and parse accordingly
      const responseText = transcriptResponse.text.trim();
      if (responseText.startsWith('{') || responseText.startsWith('[')) {
        // JSON format
        console.log('Detected JSON format');
        try {
          const transcriptData = JSON.parse(responseText);
          timestamped = this.parseTranscriptJson(transcriptData);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          throw new Error(`Invalid JSON response: ${parseError.message}`);
        }
      } else if (responseText.startsWith('<')) {
        // XML format
        console.log('Detected XML format');
        timestamped = this.parseTranscriptXml(responseText);
      } else {
        console.error('Unknown format, first 50 chars:', responseText.substring(0, 50));
        throw new Error('Unknown transcript format from YouTube');
      }

      const plain = timestamped.map(item => item.text).join(' ');

      console.log('Parsed segments:', timestamped.length);
      console.log('Plain text length:', plain.length);

      return { plain, timestamped };
    } catch (error) {
      console.error('Full error:', error);
      throw new Error(`Failed to fetch transcript: ${error.message}`);
    }
  }

  /**
   * Parse YouTube transcript XML format
   */
  private parseTranscriptXml(xml: string): TranscriptSegment[] {
    const segments: TranscriptSegment[] = [];
    const textRegex = /<text start="([^"]+)" dur="([^"]+)"[^>]*>([^<]*)<\/text>/g;
    let match;

    while ((match = textRegex.exec(xml)) !== null) {
      const offset = parseFloat(match[1]) * 1000; // Convert to milliseconds
      const duration = parseFloat(match[2]) * 1000;
      const text = this.decodeXMLEntities(match[3]);

      segments.push({
        text: text.trim(),
        offset: Math.round(offset),
        duration: Math.round(duration)
      });
    }

    return segments;
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
   * Decode XML entities in transcript text
   */
  private decodeXMLEntities(text: string): string {
    const entities: Record<string, string> = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&apos;': "'"
    };

    let decoded = text;
    for (const [entity, char] of Object.entries(entities)) {
      decoded = decoded.replace(new RegExp(entity, 'g'), char);
    }

    return decoded;
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
