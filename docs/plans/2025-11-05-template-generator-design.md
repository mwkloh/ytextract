# Template Generator Feature Design

**Created:** 2025-11-05
**Status:** Design Complete

## Overview

Add a template generator feature that creates custom YouTube transcription templates based on user's metadata and LLM output preferences.

## User Story

As a user, I want to generate custom templates that include only the sections I need, so that my extracted YouTube notes don't have empty sections and match my preferred structure.

## Feature Location

**Settings Tab → Video Metadata Fields Section → New "Template Generator" Subsection**

Add below the metadata field toggles with a note: "If you don't generate a custom template, a default template will be used."

## UI Components

### Template Generator Section

**1. Template Name Input**
- Label: "Template filename"
- Text input field
- Placeholder: "youtube-template"
- Description: "Enter template filename (without .md)"

**2. Section Inclusion Checkboxes**
- Include Summary section
- Include Key Points section
- Include Tags section
- Include Questions section
- Include Personal Notes section (checked by default)
- Include Transcript section (checked by default)

**3. Generate Button**
- Button text: "Generate Custom Template"
- Primary styling (mod-cta class)
- Generates template based on selections

## Template Structure

### Frontmatter (Always Included)
```yaml
---
title: {{title}}
url: {{url}}
channel: {{channel}}
date: {{upload_date}}        # if includeUploadDate
duration: {{duration}}        # if includeDuration
view_count: {{view_count}}   # if includeViewCount
description: {{description}}  # if includeDescription
channel_url: {{channel_url}}  # if includeChannelUrl
thumbnail_url: {{thumbnail_url}}  # if includeThumbnailUrl
tags: {{generated_tags}}      # if includeTags
---
```

### Body Sections (Based on Checkboxes)

**Title (Always Included)**
```markdown
# {{title}}
```

**Summary (If Checked)**
```markdown
## Summary
{{llm_summary}}

---
```

**Key Points (If Checked)**
```markdown
## Key Points
{{llm_key_points}}

---
```

**Personal Notes (If Checked)**
```markdown
## Personal Notes

---
```

**Questions (If Checked)**
```markdown
## Questions
{{llm_questions}}

---
```

**Transcript (If Checked)**
```markdown
## Transcript
{{transcript}}
```

## State Management

### New Settings Properties

Add to `YTExtractSettings` interface:

```typescript
templateGeneratorSections: {
  includeSummary: boolean;
  includeKeyPoints: boolean;
  includeTags: boolean;
  includeQuestions: boolean;
  includePersonalNotes: boolean;
  includeTranscript: boolean;
}
```

### Default Values

```typescript
templateGeneratorSections: {
  includeSummary: true,      // sync with outputSummary initially
  includeKeyPoints: true,    // sync with outputKeyPoints initially
  includeTags: true,         // sync with outputTags initially
  includeQuestions: false,   // sync with outputQuestions initially
  includePersonalNotes: true,
  includeTranscript: true
}
```

## Implementation Logic

### 1. Filename Validation
- Check template name is not empty → show error notice
- Sanitize filename: remove special characters, spaces to hyphens
- Smart extension handling:
  - If ends with `.md` → use as-is
  - Otherwise → append `.md`

### 2. Template Generation
```typescript
async generateCustomTemplate(filename: string) {
  // Build frontmatter with enabled metadata fields
  // Add body sections based on checkbox states
  // Return complete template string
}
```

### 3. File Creation
- Get Obsidian's templates folder from vault config
- Fallback to vault root if no templates folder configured
- Full path: `{templates-folder}/{filename}.md`
- Check if file exists:
  - If exists → confirm overwrite with modal
  - If confirmed or new → create file

### 4. Settings Update
```typescript
// Auto-populate template path
this.plugin.settings.templatePath = `{relative-path}/{filename}.md`;

// Save section preferences
this.plugin.settings.templateGeneratorSections = {
  includeSummary: summaryCheckbox.checked,
  includeKeyPoints: keyPointsCheckbox.checked,
  // ... etc
};

await this.plugin.saveSettings();
```

### 5. User Feedback
```typescript
new Notice(`Template created at ${fullPath}. Now using this template for extractions.`);
```

## Error Handling

### Validation Errors
- **Empty filename:** "Please enter a template name"
- **Invalid characters:** Sanitize automatically, show what was changed
- **No sections selected:** "Please select at least one section to include"

### File System Errors
- **Templates folder doesn't exist:** Create it automatically
- **Write permission denied:** "Cannot create template file. Check folder permissions."
- **File exists:** Show confirmation modal with options:
  - "Overwrite" - replace existing
  - "Rename" - append number to filename
  - "Cancel" - abort operation

### Success Messages
- **File created:** "Template created at {path}. Now using this template for extractions."
- **File overwritten:** "Template {filename} updated successfully."

## User Workflow

1. User opens plugin settings
2. Navigates to Video Metadata Fields section
3. Sees "Template Generator" subsection with note about default template
4. Toggles metadata fields they want in template
5. Toggles LLM output sections they want
6. Checks/unchecks section inclusion boxes
7. Enters template filename (e.g., "my-youtube-notes")
8. Clicks "Generate Custom Template"
9. System creates template file
10. Template path auto-populates in File Management section
11. User sees success notice
12. Next video extraction uses the new template

## Benefits

- **No empty sections:** Only includes selected content
- **No manual editing:** Automatically generates correct template
- **Preserves preferences:** Remembers checkbox states for next generation
- **Instant activation:** Auto-populates template path setting
- **Fully editable:** Generated templates can be manually edited afterward
- **Multiple templates:** User can generate different templates for different use cases

## Technical Notes

- Template generation happens in settings tab (no new files needed)
- Uses existing Obsidian vault API for file operations
- Integrates seamlessly with current template system
- No changes needed to extraction pipeline
- Backward compatible: existing templates still work

## Future Enhancements (Out of Scope)

- Section reordering (drag-and-drop)
- Section renaming (custom headers)
- Multiple template profiles
- Template preview before saving
- Import/export template configurations
