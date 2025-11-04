# Template Generator Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a template generator feature that creates custom YouTube transcription templates based on user's metadata and LLM output preferences.

**Architecture:** Add UI components in settings tab for template generation, extend settings interface for section preferences, implement template builder logic that generates markdown files based on user selections, auto-populate template path setting after generation.

**Tech Stack:** TypeScript, Obsidian API, existing plugin settings system

---

## Task 1: Update Types for Template Generator

**Files:**
- Modify: `src/models/types.ts`

**Step 1: Add template generator section preferences to YTExtractSettings**

Add after the `errorBehavior` property:

```typescript
// Template Generator
templateGeneratorSections: {
  includeSummary: boolean;
  includeKeyPoints: boolean;
  includeTags: boolean;
  includeQuestions: boolean;
  includePersonalNotes: boolean;
  includeTranscript: boolean;
};
```

**Step 2: Update DEFAULT_SETTINGS**

Add to `DEFAULT_SETTINGS` object after `errorBehavior`:

```typescript
templateGeneratorSections: {
  includeSummary: true,
  includeKeyPoints: true,
  includeTags: true,
  includeQuestions: false,
  includePersonalNotes: true,
  includeTranscript: true
}
```

**Step 3: Build and verify**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 4: Commit**

```bash
git add src/models/types.ts
git commit -m "feat: add template generator settings types"
```

---

## Task 2: Add Template Generator UI Components

**Files:**
- Modify: `src/ui/settings-tab.ts`

**Step 1: Add template generator section to addMetadataSettings method**

Add at the end of `addMetadataSettings()` method, before the closing brace:

```typescript
// Template Generator subsection
containerEl.createEl('h4', { text: 'Template Generator' });

containerEl.createEl('p', {
  text: 'If you don\'t generate a custom template, a default template will be used.',
  cls: 'setting-item-description'
});

new Setting(containerEl)
  .setName('Template filename')
  .setDesc('Enter template filename (without .md)')
  .addText(text => text
    .setPlaceholder('youtube-template')
    .setValue('')
  );
```

**Step 2: Add section inclusion checkboxes**

Add after the template filename setting:

```typescript
new Setting(containerEl)
  .setName('Include Summary section')
  .addToggle(toggle => toggle
    .setValue(this.plugin.settings.templateGeneratorSections.includeSummary)
    .onChange(async (value) => {
      this.plugin.settings.templateGeneratorSections.includeSummary = value;
      await this.plugin.saveSettings();
    }));

new Setting(containerEl)
  .setName('Include Key Points section')
  .addToggle(toggle => toggle
    .setValue(this.plugin.settings.templateGeneratorSections.includeKeyPoints)
    .onChange(async (value) => {
      this.plugin.settings.templateGeneratorSections.includeKeyPoints = value;
      await this.plugin.saveSettings();
    }));

new Setting(containerEl)
  .setName('Include Tags section')
  .addToggle(toggle => toggle
    .setValue(this.plugin.settings.templateGeneratorSections.includeTags)
    .onChange(async (value) => {
      this.plugin.settings.templateGeneratorSections.includeTags = value;
      await this.plugin.saveSettings();
    }));

new Setting(containerEl)
  .setName('Include Questions section')
  .addToggle(toggle => toggle
    .setValue(this.plugin.settings.templateGeneratorSections.includeQuestions)
    .onChange(async (value) => {
      this.plugin.settings.templateGeneratorSections.includeQuestions = value;
      await this.plugin.saveSettings();
    }));

new Setting(containerEl)
  .setName('Include Personal Notes section')
  .addToggle(toggle => toggle
    .setValue(this.plugin.settings.templateGeneratorSections.includePersonalNotes)
    .onChange(async (value) => {
      this.plugin.settings.templateGeneratorSections.includePersonalNotes = value;
      await this.plugin.saveSettings();
    }));

new Setting(containerEl)
  .setName('Include Transcript section')
  .addToggle(toggle => toggle
    .setValue(this.plugin.settings.templateGeneratorSections.includeTranscript)
    .onChange(async (value) => {
      this.plugin.settings.templateGeneratorSections.includeTranscript = value;
      await this.plugin.saveSettings();
    }));
```

**Step 3: Add generate button (placeholder)**

Add after the checkboxes:

```typescript
new Setting(containerEl)
  .setName('Generate Custom Template')
  .setDesc('Create a template file based on your selections')
  .addButton(button => button
    .setButtonText('Generate Template')
    .setCta()
    .onClick(async () => {
      // TODO: Implement template generation
      new Notice('Template generation coming soon');
    }));
```

**Step 4: Build and verify**

Run: `npm run build`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add src/ui/settings-tab.ts
git commit -m "feat: add template generator UI components"
```

---

## Task 3: Implement Template Builder Logic

**Files:**
- Modify: `src/ui/settings-tab.ts`

**Step 1: Add private method to build frontmatter**

Add as a private method in the `YTExtractSettingTab` class:

```typescript
private buildTemplateFrontmatter(): string {
  const settings = this.plugin.settings;
  let frontmatter = '---\n';

  // Always include core fields
  frontmatter += 'title: {{title}}\n';
  frontmatter += 'url: {{url}}\n';
  frontmatter += 'channel: {{channel}}\n';

  // Optional metadata fields
  if (settings.includeUploadDate) {
    frontmatter += 'date: {{upload_date}}\n';
  }
  if (settings.includeDuration) {
    frontmatter += 'duration: {{duration}}\n';
  }
  if (settings.includeViewCount) {
    frontmatter += 'view_count: {{view_count}}\n';
  }
  if (settings.includeDescription) {
    frontmatter += 'description: {{description}}\n';
  }
  if (settings.includeChannelUrl) {
    frontmatter += 'channel_url: {{channel_url}}\n';
  }
  if (settings.includeThumbnailUrl) {
    frontmatter += 'thumbnail_url: {{thumbnail_url}}\n';
  }
  if (settings.templateGeneratorSections.includeTags) {
    frontmatter += 'tags: {{generated_tags}}\n';
  }

  frontmatter += '---\n\n';
  return frontmatter;
}
```

**Step 2: Add private method to build template body**

Add as a private method:

```typescript
private buildTemplateBody(): string {
  const sections = this.plugin.settings.templateGeneratorSections;
  let body = '# {{title}}\n\n';

  if (sections.includeSummary) {
    body += '## Summary\n{{llm_summary}}\n\n---\n\n';
  }

  if (sections.includeKeyPoints) {
    body += '## Key Points\n{{llm_key_points}}\n\n---\n\n';
  }

  if (sections.includePersonalNotes) {
    body += '## Personal Notes\n\n---\n\n';
  }

  if (sections.includeQuestions) {
    body += '## Questions\n{{llm_questions}}\n\n---\n\n';
  }

  if (sections.includeTranscript) {
    body += '## Transcript\n{{transcript}}';
  }

  return body;
}
```

**Step 3: Add private method to generate complete template**

Add as a private method:

```typescript
private generateTemplateContent(): string {
  return this.buildTemplateFrontmatter() + this.buildTemplateBody();
}
```

**Step 4: Build and verify**

Run: `npm run build`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add src/ui/settings-tab.ts
git commit -m "feat: add template builder logic"
```

---

## Task 4: Implement Filename Validation and Sanitization

**Files:**
- Modify: `src/ui/settings-tab.ts`

**Step 1: Add private method to sanitize filename**

Add as a private method:

```typescript
private sanitizeFilename(filename: string): string {
  // Remove special characters, replace spaces with hyphens
  let sanitized = filename
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();

  // Add .md extension if not present
  if (!sanitized.endsWith('.md')) {
    sanitized += '.md';
  }

  return sanitized;
}
```

**Step 2: Add private method to validate filename**

Add as a private method:

```typescript
private validateFilename(filename: string): boolean {
  if (!filename || filename.trim().length === 0) {
    new Notice('Please enter a template name');
    return false;
  }
  return true;
}
```

**Step 3: Build and verify**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/ui/settings-tab.ts
git commit -m "feat: add filename validation and sanitization"
```

---

## Task 5: Implement File Creation Logic

**Files:**
- Modify: `src/ui/settings-tab.ts`

**Step 1: Add imports at top of file**

Add after existing imports:

```typescript
import { TFile, Notice, TFolder } from 'obsidian';
```

**Step 2: Add private method to get templates folder**

Add as a private method:

```typescript
private getTemplatesFolder(): string {
  // Try to get user's configured templates folder
  const adapter = this.app.vault.adapter;
  const config = (this.app.vault as any).config;

  // Check if templates folder is configured
  if (config && config.templatesFolder) {
    return config.templatesFolder;
  }

  // Default to 'templates' folder in vault root
  return 'templates';
}
```

**Step 3: Add private method to ensure folder exists**

Add as a private method:

```typescript
private async ensureFolderExists(folderPath: string): Promise<void> {
  const folder = this.app.vault.getAbstractFileByPath(folderPath);

  if (!folder) {
    await this.app.vault.createFolder(folderPath);
  }
}
```

**Step 4: Add private method to create template file**

Add as a private method:

```typescript
private async createTemplateFile(filename: string, content: string): Promise<string> {
  const templatesFolder = this.getTemplatesFolder();
  await this.ensureFolderExists(templatesFolder);

  const filePath = `${templatesFolder}/${filename}`;
  const existingFile = this.app.vault.getAbstractFileByPath(filePath);

  if (existingFile) {
    // File exists - overwrite it
    if (existingFile instanceof TFile) {
      await this.app.vault.modify(existingFile, content);
    }
  } else {
    // Create new file
    await this.app.vault.create(filePath, content);
  }

  return filePath;
}
```

**Step 5: Build and verify**

Run: `npm run build`
Expected: Build succeeds

**Step 6: Commit**

```bash
git add src/ui/settings-tab.ts
git commit -m "feat: add file creation logic for templates"
```

---

## Task 6: Wire Up Generate Button

**Files:**
- Modify: `src/ui/settings-tab.ts`

**Step 1: Store template filename in component state**

Add a private property at the top of the class:

```typescript
private templateFilename: string = '';
```

**Step 2: Update template filename input to store value**

Modify the template filename setting to capture the value:

```typescript
new Setting(containerEl)
  .setName('Template filename')
  .setDesc('Enter template filename (without .md)')
  .addText(text => text
    .setPlaceholder('youtube-template')
    .setValue(this.templateFilename)
    .onChange((value) => {
      this.templateFilename = value;
    })
  );
```

**Step 3: Implement generate button onClick handler**

Replace the TODO in the generate button with:

```typescript
.onClick(async () => {
  // Validate filename
  if (!this.validateFilename(this.templateFilename)) {
    return;
  }

  // Sanitize filename
  const sanitizedFilename = this.sanitizeFilename(this.templateFilename);

  // Generate template content
  const templateContent = this.generateTemplateContent();

  try {
    // Create template file
    const filePath = await this.createTemplateFile(sanitizedFilename, templateContent);

    // Update settings with new template path
    this.plugin.settings.templatePath = filePath;
    await this.plugin.saveSettings();

    // Refresh display to show updated template path
    this.display();

    // Show success message
    new Notice(`Template created at ${filePath}. Now using this template for extractions.`);
  } catch (error) {
    console.error('Failed to create template:', error);
    new Notice('Failed to create template file. Check console for details.');
  }
})
```

**Step 4: Build and verify**

Run: `npm run build`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add src/ui/settings-tab.ts
git commit -m "feat: wire up template generator button"
```

---

## Task 7: Add Validation for Section Selection

**Files:**
- Modify: `src/ui/settings-tab.ts`

**Step 1: Add private method to validate at least one section selected**

Add as a private method:

```typescript
private validateSectionSelection(): boolean {
  const sections = this.plugin.settings.templateGeneratorSections;
  const hasSelection =
    sections.includeSummary ||
    sections.includeKeyPoints ||
    sections.includeTags ||
    sections.includeQuestions ||
    sections.includePersonalNotes ||
    sections.includeTranscript;

  if (!hasSelection) {
    new Notice('Please select at least one section to include in the template');
    return false;
  }

  return true;
}
```

**Step 2: Add validation check in generate button**

Modify the onClick handler to include section validation after filename validation:

```typescript
.onClick(async () => {
  // Validate filename
  if (!this.validateFilename(this.templateFilename)) {
    return;
  }

  // Validate section selection
  if (!this.validateSectionSelection()) {
    return;
  }

  // ... rest of existing code
})
```

**Step 3: Build and verify**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/ui/settings-tab.ts
git commit -m "feat: add section selection validation"
```

---

## Task 8: Final Build and Testing

**Files:**
- All files

**Step 1: Run final production build**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 2: Verify main.js is generated**

Check: File exists at `main.js` with reasonable size

**Step 3: Manual testing checklist**

Test in Obsidian (if available):
- [ ] Settings tab shows Template Generator section
- [ ] All checkboxes toggle correctly
- [ ] Template filename input accepts text
- [ ] Generate button shows error for empty filename
- [ ] Generate button shows error for no sections selected
- [ ] Generate button creates template file in templates folder
- [ ] Template path auto-populates in File Management section
- [ ] Success notice appears after generation
- [ ] Generated template has correct structure
- [ ] Next video extraction uses new template

**Step 4: Create final commit**

```bash
git add .
git commit -m "chore: template generator feature complete"
```

**Step 5: Create version tag**

```bash
git tag v1.1.0
```

---

## Completion Checklist

- [ ] Task 1: Update types for template generator
- [ ] Task 2: Add UI components to settings tab
- [ ] Task 3: Implement template builder logic
- [ ] Task 4: Add filename validation and sanitization
- [ ] Task 5: Implement file creation logic
- [ ] Task 6: Wire up generate button
- [ ] Task 7: Add section selection validation
- [ ] Task 8: Final build and testing

## Notes

- The template generator integrates seamlessly with existing settings
- No changes needed to extraction pipeline
- Generated templates are fully editable markdown files
- User can generate multiple templates with different configurations
- Section preferences persist across plugin restarts
