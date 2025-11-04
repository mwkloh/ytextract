# YTExtract Template Generator - Manual Testing Guide

## Version 1.1.0 - Template Generator Feature

This document provides a comprehensive guide for manually testing the new template generator feature implemented in version 1.1.0.

---

## What Was Implemented

### Core Features

1. **Template Service** (`src/services/TemplateService.ts`)
   - Dynamic template loading from `/templates` directory
   - Template registration and management
   - Template validation and parsing
   - Error handling for missing or invalid templates

2. **Template Generator Modal** (`src/ui/TemplateGeneratorModal.ts`)
   - User interface for template selection
   - Dropdown to choose available templates
   - Preview of selected template
   - Note name input field
   - "Generate" button to create notes
   - Real-time template preview updates

3. **Command Integration**
   - New command: "Generate note from template"
   - Accessible via Command Palette (Ctrl/Cmd + P)
   - Opens template generator modal

4. **Template Directory Setup**
   - Automatic creation of `/templates` directory
   - Default template (`default.md`) included
   - Support for custom user templates

### Technical Implementation

- **LLM Integration**: Uses existing LLM service for AI-powered content generation
- **Provider Support**: Works with all configured LLM providers (Ollama, LM Studio, llama.cpp)
- **Error Handling**: Comprehensive error messages for template loading, validation, and generation failures
- **Type Safety**: Full TypeScript implementation with proper types and interfaces

---

## Manual Testing Checklist

### Prerequisites

Before testing, ensure:
- [ ] Obsidian is running
- [ ] YTExtract plugin is enabled
- [ ] At least one LLM provider is configured in settings
- [ ] The `/templates` directory exists in your vault

### Test 1: Template Directory Initialization

**Steps:**
1. Reload Obsidian or restart the plugin
2. Navigate to your vault's root directory
3. Check for `/templates` folder

**Expected Behavior:**
- `/templates` folder should exist
- `default.md` template should be present inside
- Default template should contain the standard format with sections for Context, Summary, and Key Points

**Status:** ⬜ Pass / ⬜ Fail

---

### Test 2: Command Palette Access

**Steps:**
1. Open Command Palette (Ctrl/Cmd + P)
2. Type "Generate note from template"
3. Press Enter to execute

**Expected Behavior:**
- Command should be visible in the palette
- Command should have "YTExtract: " prefix
- Selecting the command opens the Template Generator modal

**Status:** ⬜ Pass / ⬜ Fail

---

### Test 3: Template Generator Modal - UI

**Steps:**
1. Open the Template Generator modal via command
2. Inspect the modal interface

**Expected Behavior:**
- Modal title: "Generate Note from Template"
- Template dropdown showing available templates
- "Default Template" should be pre-selected
- Template preview area showing the selected template's content
- Note name input field with placeholder text
- "Generate" button at the bottom

**Status:** ⬜ Pass / ⬜ Fail

---

### Test 4: Template Selection

**Steps:**
1. Open the Template Generator modal
2. Click the template dropdown
3. Select different templates (if multiple exist)

**Expected Behavior:**
- Dropdown lists all available templates from `/templates` directory
- Selecting a template updates the preview immediately
- Preview shows the full template content
- Previous selection is remembered if modal is reopened

**Status:** ⬜ Pass / ⬜ Fail

---

### Test 5: Template Preview

**Steps:**
1. Open the Template Generator modal
2. Observe the template preview area
3. Select different templates

**Expected Behavior:**
- Preview displays template content accurately
- Preview is read-only (not editable)
- Preview updates when template selection changes
- Preview shows formatting (headers, bullet points, etc.)
- Long templates have scrolling capability

**Status:** ⬜ Pass / ⬜ Fail

---

### Test 6: Note Name Input

**Steps:**
1. Open the Template Generator modal
2. Type a note name in the input field
3. Try various characters (spaces, special characters, etc.)

**Expected Behavior:**
- Input field accepts text
- Placeholder text disappears when typing
- All standard characters are accepted
- Input is trimmed of leading/trailing spaces

**Status:** ⬜ Pass / ⬜ Fail

---

### Test 7: Generate Note - Success Case

**Steps:**
1. Open the Template Generator modal
2. Select a template (or use default)
3. Enter a note name: "Test Template Generation"
4. Click "Generate" button

**Expected Behavior:**
- Modal shows "Generating note..." during processing
- Modal closes upon successful generation
- New note is created in the vault
- Note name matches input
- Note contains content generated from template
- Note follows template structure
- Success notice appears: "Note generated: [note name]"

**Status:** ⬜ Pass / ⬜ Fail

---

### Test 8: Generate Note - Empty Note Name

**Steps:**
1. Open the Template Generator modal
2. Leave note name field empty
3. Click "Generate" button

**Expected Behavior:**
- Error notice appears: "Please enter a note name"
- Modal remains open
- No note is created
- User can correct and retry

**Status:** ⬜ Pass / ⬜ Fail

---

### Test 9: Generate Note - LLM Provider Error

**Steps:**
1. Disable or misconfigure all LLM providers in settings
2. Open the Template Generator modal
3. Enter a note name
4. Click "Generate" button

**Expected Behavior:**
- Error notice appears with LLM-related error message
- Modal remains open or closes gracefully
- No note is created
- Error message is descriptive and actionable

**Status:** ⬜ Pass / ⬜ Fail

---

### Test 10: Custom Template Support

**Steps:**
1. Create a new file in `/templates` directory: `custom.md`
2. Add custom content to the template
3. Reload Obsidian or restart plugin
4. Open Template Generator modal
5. Check if custom template appears in dropdown

**Expected Behavior:**
- Custom template is detected and loaded
- Template appears in dropdown with proper name
- Selecting custom template shows its preview
- Can generate notes using custom template
- Generated notes follow custom template structure

**Status:** ⬜ Pass / ⬜ Fail

---

### Test 11: Template with Variables

**Steps:**
1. Create a template with common variables like `{{title}}`, `{{date}}`
2. Use this template to generate a note
3. Check generated content

**Expected Behavior:**
- Variables are properly substituted
- `{{title}}` is replaced with note name
- `{{date}}` is replaced with current date
- Other variables are handled appropriately

**Status:** ⬜ Pass / ⬜ Fail

---

### Test 12: Multiple Consecutive Generations

**Steps:**
1. Generate a note from a template
2. Immediately open modal again
3. Generate another note with different name
4. Repeat 2-3 more times

**Expected Behavior:**
- Each generation works independently
- No errors or crashes
- All notes are created successfully
- Modal state resets between uses
- No memory leaks or performance degradation

**Status:** ⬜ Pass / ⬜ Fail

---

### Test 13: Cancel Operation

**Steps:**
1. Open Template Generator modal
2. Make some selections
3. Click outside the modal or press Escape

**Expected Behavior:**
- Modal closes without generating a note
- No errors or warnings
- Can reopen modal and start fresh

**Status:** ⬜ Pass / ⬜ Fail

---

### Test 14: Template Directory Missing

**Steps:**
1. Delete or rename the `/templates` directory
2. Try to open Template Generator modal

**Expected Behavior:**
- Error notice appears: "Templates directory not found"
- Modal either doesn't open or shows helpful error
- User is informed about missing directory
- Plugin doesn't crash

**Status:** ⬜ Pass / ⬜ Fail

---

### Test 15: Invalid Template File

**Steps:**
1. Create a template file with invalid format or empty content
2. Try to use it in Template Generator

**Expected Behavior:**
- Template is either skipped or shows error
- Error message is clear and helpful
- Other valid templates still work
- Plugin doesn't crash

**Status:** ⬜ Pass / ⬜ Fail

---

## Integration Testing

### Test 16: Template Generator with Different LLM Providers

**Steps:**
1. Test with Ollama provider
2. Test with LM Studio provider
3. Test with llama.cpp provider

**Expected Behavior:**
- All providers work correctly with template generation
- Generated content quality is consistent
- Provider-specific features (streaming, etc.) work as expected

**Status:** ⬜ Pass / ⬜ Fail

---

### Test 17: Template Generator with Existing Plugin Features

**Steps:**
1. Generate a note from template
2. Use other plugin features (summarization, etc.) on the generated note

**Expected Behavior:**
- All plugin features work with template-generated notes
- No conflicts or errors
- Generated notes are treated like any other notes

**Status:** ⬜ Pass / ⬜ Fail

---

## Performance Testing

### Test 18: Large Template Handling

**Steps:**
1. Create a very large template (10,000+ characters)
2. Load it in Template Generator
3. Generate a note from it

**Expected Behavior:**
- Large template loads without freezing UI
- Preview displays correctly (with scrolling)
- Generation completes successfully
- No performance degradation

**Status:** ⬜ Pass / ⬜ Fail

---

### Test 19: Many Templates

**Steps:**
1. Create 20+ template files in `/templates` directory
2. Open Template Generator modal
3. Browse through templates

**Expected Behavior:**
- All templates load successfully
- Dropdown handles many templates gracefully
- Template switching is responsive
- No performance issues

**Status:** ⬜ Pass / ⬜ Fail

---

## Known Limitations

1. **Template Variables**: Currently limited variable substitution support
2. **Template Validation**: Basic validation only - complex templates may need careful testing
3. **Error Recovery**: Some error states may require plugin reload
4. **Template Refresh**: May need plugin reload to detect new templates

---

## Troubleshooting Guide

### Issue: Templates not appearing in dropdown

**Solution:**
- Check if `/templates` directory exists
- Verify template files have `.md` extension
- Try reloading Obsidian
- Check console for error messages

### Issue: Generation fails with no error

**Solution:**
- Verify LLM provider is configured
- Check provider is running and accessible
- Review console logs for detailed errors
- Try with default template first

### Issue: Modal doesn't open

**Solution:**
- Ensure plugin is enabled
- Check for JavaScript errors in console
- Try disabling other plugins temporarily
- Reload Obsidian

### Issue: Generated note is empty

**Solution:**
- Check template content is valid
- Verify LLM provider is responding
- Try simpler template first
- Check network connectivity to LLM provider

---

## Testing Notes

**Test Environment:**
- Obsidian Version: _____________
- Plugin Version: 1.1.0
- Operating System: _____________
- LLM Provider: _____________
- Date Tested: _____________

**Tester Name:** _____________

**Overall Assessment:** ⬜ Pass / ⬜ Fail / ⬜ Needs Review

**Additional Comments:**
_____________________________________________
_____________________________________________
_____________________________________________

---

## Reporting Issues

If you encounter any issues during testing:

1. Note the specific test that failed
2. Document steps to reproduce
3. Include any error messages from console
4. Note your environment details
5. Report to the development team

---

**End of Testing Guide**
