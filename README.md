# YouTube Transcript Extractor

An Obsidian plugin that extracts YouTube video transcripts, generates AI-powered summaries using local or cloud LLMs, and saves formatted notes to your vault.

## Features

- Extract YouTube transcripts without API keys
- Generate summaries using local LLMs (Ollama, LM Studio, llama.cpp) or cloud providers (OpenAI, Anthropic, OpenRouter)
- **Mobile-compatible** with cloud LLM providers
- Customizable templates with variable substitution
- Flexible settings for metadata, naming, and error handling
- Multiple entry points: command palette, ribbon icon, context menu
- Status bar progress feedback

## Installation

### From Obsidian Community Plugins (Recommended)

1. Open Settings > Community Plugins
2. Disable Safe Mode
3. Browse and search for "YouTube Transcript Extractor"
4. Install and enable the plugin

### Manual Installation

1. Download the latest release from GitHub
2. Extract files to `.obsidian/plugins/ytextract/` in your vault
3. Reload Obsidian
4. Enable plugin in Settings > Community Plugins

## Usage

### Extract a Video

**Command Palette:**
1. Press `Ctrl/Cmd + P`
2. Type "Extract YouTube Video"
3. Paste YouTube URL
4. Click Extract

**Ribbon Icon:**
1. Click YouTube icon in left sidebar
2. Paste URL and extract

**Context Menu:**
1. Select YouTube URL in editor
2. Right-click > "Extract YouTube Video"

## Configuration

### File Management

- **Default folder**: Where to save extracted videos (e.g., "YouTube")
- **Naming pattern**: File naming with variables: `{date}`, `{title}`, `{channel}`, `{id}`
  - Example: `{date} - {title}` creates "2025-11-05 - Video Title.md"
- **Template file path**: Path to custom template file (leave empty for default)
- **File exists behavior**: What to do when file already exists
  - Append number to filename
  - Prompt for overwrite

### Video Metadata Fields

Control which metadata fields are included in your notes:

- **Include upload date**: Video upload date
- **Include duration**: Video duration
- **Include view count**: Number of views
- **Include description**: Full video description
- **Include channel URL**: Link to the channel
- **Include thumbnail URL**: Video thumbnail image URL

### LLM Configuration

**Provider Selection:**
- **LLM Provider**: Choose from:
  - **Local Providers**: Ollama, LM Studio, llama.cpp (desktop only)
  - **Cloud Providers**: OpenAI, Anthropic, OpenRouter (works on mobile!)
  - **Custom**: Configure your own endpoint
- **Auto-detect endpoint**: Automatically find available local LLM server (local providers only)
- **API Key**: Secure password-masked input for cloud providers
- **LLM Endpoint**: API endpoint URL (auto-configured for cloud providers)
- **Model name**: Model to use (e.g., "llama2", "gpt-4o-mini", "claude-3-5-haiku-20241022")

**Cloud Provider Models:**
- **OpenAI**: gpt-4o-mini (default), gpt-4o, gpt-3.5-turbo
- **Anthropic**: claude-3-5-haiku-20241022 (default), claude-3-5-sonnet-20241022
- **OpenRouter**: anthropic/claude-3.5-haiku (default), access to 100+ models

**System Prompt:**
- **Custom system prompt**: Customize the prompt sent to the LLM
  - Default: "Summarize the following transcript concisely and suggest relevant tags"

**Output Options:**
- **Generate summary**: Create a text summary
- **Generate key points**: Extract main points as bullet list
- **Generate tags**: Suggest relevant tags
- **Generate questions**: Generate discussion questions

**Advanced:**
- **Request timeout (ms)**: Timeout for LLM requests in milliseconds (default: 30000)

### Error Handling

**Error behavior**: How to handle errors during extraction
- **Stop on error**: Don't create file if any step fails
- **Save partial data**: Save note with whatever data was successfully retrieved
- **Skip failed steps with warning**: Continue extraction, skip failed parts with warning

## Template Variables

Available variables for custom templates:

### Video Metadata

- `{{title}}` - Video title
- `{{url}}` - Full YouTube URL
- `{{channel}}` - Channel name
- `{{upload_date}}` - Upload date (if enabled)
- `{{duration}}` - Video duration (if enabled)
- `{{view_count}}` - View count (if enabled)
- `{{description}}` - Video description (if enabled)
- `{{channel_url}}` - Channel URL (if enabled)
- `{{thumbnail_url}}` - Thumbnail URL (if enabled)

### LLM Outputs

- `{{llm_summary}}` - AI-generated summary
- `{{llm_key_points}}` - Key points as bullet list
- `{{generated_tags}}` - Suggested tags (YAML array format for frontmatter)
- `{{generated_tags_hashtags}}` - Suggested tags with # prefix (for document body)
- `{{llm_questions}}` - Generated questions

**Note on Tags:** Use `{{generated_tags}}` in YAML frontmatter to avoid "Type mismatch" errors. Use `{{generated_tags_hashtags}}` in the document body if you want hashtag-style tags like `#machine-learning #ai-development`.

### Transcript

- `{{transcript}}` - Plain text transcript
- `{{transcript_timestamped}}` - Transcript with timestamps

### Other

- `{{extraction_date}}` - Date when transcript was extracted (YYYY-MM-DD format)

### Default Template

If no custom template is specified, the plugin uses this default:

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

---

## Key Points
{{llm_key_points}}

---

## Personal Notes

---

## Transcript
{{transcript}}
```

## Requirements

- Obsidian v0.15.0 or higher
- For AI summaries, choose one:
  - **Cloud LLMs** (works on mobile!): API key from OpenAI, Anthropic, or OpenRouter
  - **Local LLMs** (desktop only):
    - [Ollama](https://ollama.ai/)
    - [LM Studio](https://lmstudio.ai/)
    - [llama.cpp](https://github.com/ggerganov/llama.cpp)

## Mobile Usage

The plugin works on mobile devices using cloud LLM providers:

1. Install the plugin on your mobile vault
2. Open Settings > YouTube Transcript Extractor
3. Select a cloud provider (OpenAI, Anthropic, or OpenRouter)
4. Enter your API key
5. Extract videos normally via the command palette or ribbon icon

**Note**: Local LLM providers (Ollama, LM Studio, llama.cpp) are only available on desktop.

## Support

- Report issues: [GitHub Issues](https://github.com/mwkloh/ytextract/issues)
- Author: Michael Loh
- Website: [https://www.e-maginaryarts.com](https://www.e-maginaryarts.com)

## License

MIT
