# YouTube Transcription Plugin Design

**Created:** 2025-11-04
**Status:** Design Complete

## Overview

An Obsidian plugin that extracts YouTube video transcripts, generates AI summaries using local LLMs, and saves formatted notes to the vault using customizable templates.

## Core Requirements

- Extract YouTube video transcripts without API keys
- Fetch video metadata (title, channel, date, etc.)
- Generate summaries and tags using local LLM
- Support multiple LLM providers (Ollama, LM Studio, llama.cpp)
- Use customizable templates with variable substitution
- Multiple UI entry points (command palette, ribbon, context menu)
- Configurable file naming and folder location
- Status bar progress feedback

## Architecture

### Core Components

1. **UI Layer** - Multiple entry points (command palette, ribbon icon, context menu) that all trigger the same modal dialog for URL input

2. **YouTube Service** - Handles fetching video metadata and transcript using a library like `youtube-transcript` (extracts existing captions)

3. **LLM Service** - Manages connections to multiple local LLM providers (Ollama, LM Studio, llama.cpp) with a unified interface

4. **Template Engine** - Processes user-defined templates with video data, transcript, LLM-generated content, and empty notes section for user input

### Data Flow

User triggers extraction → Modal collects URL → YouTube Service fetches metadata + transcript → LLM Service generates summary/tags → Template Engine populates template with empty notes section → File saved to configured location with status bar updates throughout

### Settings Storage

All configuration (LLM endpoints, template paths, file naming patterns, metadata fields to include, error behavior) stored in Obsidian's plugin data system

## Settings Configuration

### Settings Tab Structure

**1. File Management**
- Default folder path (with folder suggester)
- Naming pattern: `{date} - {title}` (supports variables: `{date}`, `{title}`, `{channel}`, `{id}`)
- Template file path (defaults to built-in template if not specified)
- File exists behavior: append number or prompt for overwrite

**2. Video Metadata Fields** (checkboxes for template inclusion)
- Title, URL, Channel Name (always included)
- Optional: Upload Date, Duration, View Count, Description, Channel URL, Thumbnail URL

**3. LLM Configuration**
- Provider dropdown: Ollama / LM Studio / llama.cpp / Custom
- Auto-detect endpoints (toggleable)
- Manual endpoint URL (shown when needed)
- Model name field
- Custom system prompt (with default: "Summarize the following transcript concisely and suggest relevant tags")
- Output options (checkboxes): Summary, Key Points, Tags, Questions
- Request timeout (default: 30 seconds)

**4. Error Handling**
- Radio buttons:
  - Stop on error (don't create file)
  - Save partial data (create file with available data)
  - Skip failed steps with warning (create file, mark missing sections)

## YouTube Service Implementation

### Transcript Extraction

Use the `youtube-transcript` npm package (or similar) to extract existing captions without API keys.

**Features:**
- Parse YouTube URLs (support multiple formats: youtube.com/watch?v=, youtu.be/, embed URLs)
- Extract video ID from URL
- Fetch available transcripts (prefer manual captions over auto-generated)
- Handle language selection (default to English, fallback to available languages)
- Return transcript as timestamped segments or plain text (configurable)

### Metadata Fetching

Use a lightweight library like `ytdl-core` or parse the YouTube page HTML to extract:
- Video title
- Channel name
- Upload date
- Duration
- View count (approximate)
- Video description
- Thumbnail URLs

### Error Handling

- No captions available → return error or empty transcript based on user settings
- Private/deleted video → clear error message
- Network failures → retry logic with timeout (3 retries with exponential backoff)
- Invalid URL → validation before processing

## LLM Service Implementation

### Provider Abstraction

Create a unified `LLMProvider` interface:

```typescript
interface LLMProvider {
  name: string;
  defaultEndpoint: string;
  testConnection(): Promise<boolean>;
  generateSummary(transcript: string, prompt: string): Promise<LLMResponse>;
}
```

### Supported Providers

1. **Ollama** - `http://localhost:11434/api/generate`
2. **LM Studio** - `http://localhost:1234/v1/chat/completions` (OpenAI-compatible)
3. **llama.cpp** - `http://localhost:8080/completion`
4. **Custom** - user-defined endpoint with configurable request format

### Auto-detection Flow

- Try each preset endpoint in order with a lightweight test request
- Use first successful connection
- Cache successful endpoint for session
- Fall back to manual configuration if all fail

### Request Handling

- Build prompts based on user's custom template and selected outputs (summary, tags, key points, questions)
- Parse LLM responses (handle JSON or plain text depending on provider)
- Implement timeout and retry logic
- Respect user's error handling preference (fail, skip, or warn)

## Template Engine & File Creation

### Default Template Structure

```markdown
---
title: {{title}}
url: {{url}}
channel: {{channel}}
date: {{upload_date}}
duration: {{duration}}
tags: {{generated_tags}}
---

# {{title}}

## Summary
{{llm_summary}}

## Key Points
{{llm_key_points}}

## Personal Notes


## Transcript
{{transcript}}
```

### Template Variables

The engine supports these placeholders:

**Video Metadata:**
- `{{title}}` - Video title
- `{{url}}` - Video URL
- `{{channel}}` - Channel name
- `{{upload_date}}` - Upload date
- `{{duration}}` - Video duration
- `{{view_count}}` - View count
- `{{description}}` - Video description
- `{{channel_url}}` - Channel URL
- `{{thumbnail_url}}` - Thumbnail URL

**LLM Outputs:**
- `{{llm_summary}}` - Generated summary
- `{{llm_key_points}}` - Key points list
- `{{llm_tags}}` / `{{generated_tags}}` - Generated tags
- `{{llm_questions}}` - Generated questions

**Transcript:**
- `{{transcript}}` - Plain text transcript
- `{{transcript_timestamped}}` - Transcript with timestamps

**Other:**
- `{{extraction_date}}` - When note was created

### Custom Templates

Users can create their own template file and specify its path in settings. The engine will:
- Read the template file
- Replace all variables with actual data
- Skip missing variables (leave empty or omit section based on template structure)
- Create file with configured naming pattern in configured folder

## User Interface Components

### 1. URL Input Modal

- Simple modal with single text input field
- "Extract YouTube Video" title
- Validates URL format before proceeding
- Cancel/Extract buttons
- Shows brief error if URL is invalid

### 2. Status Bar Progress Indicator

- Shows in bottom status bar during processing
- Updates through stages: "Fetching transcript..." → "Generating summary..." → "Saving note..." → "✓ Complete"
- Clickable to cancel operation
- Auto-clears after completion or shows error state

### 3. Command Palette Integration

- Command: "Extract YouTube Video"
- Opens URL input modal

### 4. Ribbon Icon

- YouTube-style icon in left sidebar
- Tooltip: "Extract YouTube Video"
- Opens URL input modal

### 5. Context Menu

- Right-click on selected text containing YouTube URL
- Menu item: "Extract YouTube Video"
- Auto-populates modal with selected URL

## Error Handling & Edge Cases

### Error Scenarios & Behaviors

Based on user's configured error handling preference:

**1. No Captions Available**
- Stop: Show error notice, don't create file
- Partial: Create file with metadata only, note in transcript section
- Skip: Create file, mark transcript as unavailable

**2. LLM Server Unavailable**
- Stop: Show error, don't create file
- Partial: Create file without LLM sections
- Skip: Create file with placeholder text for summary/tags

**3. Network/YouTube Failures**
- Retry up to 3 times with exponential backoff
- Then follow user's error preference
- Show specific error messages (video private, deleted, etc.)

**4. Template File Missing**
- Fall back to built-in default template
- Show warning in notice

**5. File Already Exists**
- Append number to filename: `2024-01-15 - Video Title 1.md`
- Or show overwrite prompt (configurable in settings)

**6. Invalid Template Variables**
- Gracefully skip unknown variables
- Log warning to console

### Validation

- URL validation before processing starts
- Folder path validation in settings
- Model name validation when testing LLM connection

## Technical Implementation

### Dependencies

- `youtube-transcript` - Extract captions without API
- `ytdl-core` or similar - Fetch video metadata
- Standard Obsidian API - No additional UI frameworks needed

### File Structure

```
src/
├── main.ts              # Plugin entry point
├── services/
│   ├── youtube.ts       # YouTube data fetching
│   ├── llm.ts          # LLM provider abstraction
│   └── template.ts     # Template processing
├── ui/
│   ├── url-modal.ts    # URL input modal
│   └── settings-tab.ts # Settings configuration
├── models/
│   ├── types.ts        # TypeScript interfaces
│   └── providers.ts    # LLM provider implementations
└── templates/
    └── default.md      # Built-in template
```

### Key Design Patterns

- Service layer for business logic (YouTube, LLM, Template)
- Strategy pattern for LLM providers (easy to add new ones)
- Template method pattern for processing pipeline
- Settings-driven behavior (no hardcoded values)

### Testing Strategy

- Mock YouTube API responses for offline testing
- Mock LLM responses for predictable testing
- Test template variable replacement independently
- Validate all error paths

### Performance Considerations

- Status bar updates don't block UI
- Large transcripts handled efficiently
- LLM requests timeout after 30 seconds (configurable)
- Asynchronous processing throughout

## Implementation Phases

### Phase 1: Core Infrastructure
- Plugin setup and configuration
- Settings tab with all options
- Basic file structure

### Phase 2: YouTube Service
- URL parsing and validation
- Transcript extraction
- Metadata fetching
- Error handling

### Phase 3: Template Engine
- Variable substitution
- Custom template loading
- File naming and creation
- Default template

### Phase 4: LLM Integration
- Provider abstraction layer
- Ollama implementation
- LM Studio implementation
- llama.cpp implementation
- Auto-detection logic

### Phase 5: UI Components
- URL input modal
- Command palette command
- Ribbon icon
- Context menu integration
- Status bar indicator

### Phase 6: Error Handling & Polish
- Comprehensive error scenarios
- User-configurable error behavior
- Testing and bug fixes
- Documentation

## Future Enhancements (Out of Scope)

- Batch processing multiple videos
- Auto-tagging based on vault tags
- Video chapter extraction
- Subtitle language selection UI
- Export to other formats
- Cloud LLM support (OpenAI, Anthropic)
