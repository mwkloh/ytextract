# Community Plugin Submission Guide

This guide will help you submit the YouTube Transcript Extractor plugin to the Obsidian Community Plugins repository.

## Prerequisites Checklist

- [x] Plugin is fully tested and working
- [x] README.md is complete with installation and usage instructions
- [x] manifest.json contains correct metadata
- [x] GitHub repository is public
- [x] Release v1.3.1 created with required assets (main.js, manifest.json, styles.css)
- [x] All code is committed and pushed to main branch

## Submission Steps

### 1. Fork the obsidian-releases Repository

1. Go to: https://github.com/obsidianmd/obsidian-releases
2. Click "Fork" in the top-right corner
3. Create a fork in your GitHub account

### 2. Clone Your Fork

```bash
git clone https://github.com/YOUR_USERNAME/obsidian-releases.git
cd obsidian-releases
```

### 3. Create a New Branch

```bash
git checkout -b add-ytextract-plugin
```

### 4. Add Plugin to community-plugins.json

Edit `community-plugins.json` and add your plugin entry in **alphabetical order**:

```json
{
  "id": "ytextract",
  "name": "YouTube Transcript Extractor",
  "author": "Michael Loh",
  "description": "Extract YouTube transcripts and generate AI-powered summaries using local or cloud LLMs",
  "repo": "mwkloh/ytextract"
}
```

**Important Notes:**

- The `id` must match exactly what's in your `manifest.json` (must be lowercase)
- The `repo` should be in format: `username/repository-name`
- Ensure the entry is in alphabetical order by plugin name
- Keep the description concise (under 250 characters)

### 5. Commit and Push Changes

```bash
git add community-plugins.json
git commit -m "Add YouTube Transcript Extractor plugin"
git push origin add-ytextract-plugin
```

### 6. Create Pull Request

1. Go to your fork on GitHub
2. Click "Compare & pull request"
3. Fill out the PR template:

**PR Title:**
```
Add YouTube Transcript Extractor plugin
```

**PR Description:**
```
## Plugin Information

- **Plugin Name:** YouTube Transcript Extractor
- **Plugin ID:** ytextract
- **Repository:** https://github.com/mwkloh/ytextract
- **Latest Release:** 1.0.0
- **Author:** Michael Loh

## Description

Extract YouTube video transcripts and generate AI-powered summaries using local or cloud LLMs. The plugin now supports mobile devices through cloud provider integration (OpenAI, Anthropic, OpenRouter).

## Key Features

- Extract YouTube transcripts without API keys
- Generate summaries using local LLMs (Ollama, LM Studio, llama.cpp) or cloud providers
- Mobile-compatible with cloud LLM providers
- Customizable templates with variable substitution
- Multiple entry points: command palette, ribbon icon, context menu

## Release Assets

The 1.0.0 release includes all required files:
- main.js
- manifest.json
- styles.css

## Testing

The plugin has been thoroughly tested on:
- Obsidian desktop (macOS, Windows, Linux)
- Obsidian mobile (iOS, Android) with cloud providers
- Multiple LLM providers (local and cloud)

## Additional Information

- Minimum Obsidian version: 0.15.0
- Mobile compatible: Yes (with cloud providers)
- Desktop only features: Local LLM providers (Ollama, LM Studio, llama.cpp)
```

4. Submit the pull request

### 7. Wait for Review

The Obsidian team will review your submission. This typically takes:
- **Initial review**: 1-3 days
- **Total process**: 1-2 weeks (if changes are needed)

They will check:
- Code quality and security
- Proper functionality
- README completeness
- Release assets presence
- manifest.json correctness

### 8. Respond to Feedback

If the reviewers request changes:
1. Make the requested changes in your plugin repository
2. Create a new release if needed
3. Update the PR with any additional information
4. Be responsive and professional in your communication

## Common Review Comments

### Code Quality Issues
- **Security concerns**: Remove any hardcoded secrets or unsafe API calls
- **Performance**: Optimize heavy operations
- **Error handling**: Ensure proper error messages and graceful failures

### Documentation Issues
- **Missing information**: Add installation steps, configuration details, or usage examples
- **Unclear features**: Better explain what the plugin does
- **Screenshots**: Consider adding screenshots or GIFs

### Technical Issues
- **Missing files**: Ensure all required files are in the release
- **Version mismatch**: manifest.json version must match release tag
- **Build issues**: Ensure main.js is properly minified/bundled

## Post-Approval

Once approved:
1. Your plugin will be added to the community plugins list
2. Users can install it directly from Obsidian
3. Updates are automatic via GitHub releases

## Maintaining Your Plugin

### Creating Updates

1. Make changes to your code
2. Update version in `manifest.json`
3. Build the plugin: `npm run build`
4. Commit and push changes
5. Create a new release with updated assets

GitHub releases are automatically detected by Obsidian, so users get updates automatically.

### Version Numbering

Follow semantic versioning:
- **Major (x.0.0)**: Breaking changes
- **Minor (1.x.0)**: New features, backwards compatible
- **Patch (1.0.x)**: Bug fixes

Example:
- 1.3.1 → 1.3.2 (bug fix)
- 1.3.2 → 1.4.0 (new feature)
- 1.4.0 → 2.0.0 (breaking change)

## Resources

- **Obsidian Plugin Guidelines**: https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines
- **Sample Plugins**: https://github.com/obsidianmd/obsidian-sample-plugin
- **Developer Docs**: https://docs.obsidian.md/Home
- **Community Discord**: https://discord.gg/obsidianmd

## Checklist for Submission

Before submitting, verify:

- [ ] Repository is public
- [ ] Latest release (v1.3.1) has all required files
- [ ] README.md is comprehensive
- [ ] manifest.json has correct id, version, and metadata
- [ ] Plugin is tested on desktop and mobile
- [ ] No console errors or warnings
- [ ] Fork created of obsidian-releases repository
- [ ] Plugin entry added to community-plugins.json in alphabetical order
- [ ] Pull request created with detailed description

## Current Status

**Plugin Repository**: https://github.com/mwkloh/ytextract
**Latest Release**: 1.0.0
**Release URL**: https://github.com/mwkloh/ytextract/releases/tag/1.0.0

### Release Assets Available:

- ✅ main.js (66KB)
- ✅ manifest.json (347B)
- ✅ styles.css (204B)

## Next Steps

1. Fork https://github.com/obsidianmd/obsidian-releases
2. Add plugin entry to community-plugins.json
3. Create pull request with the template above
4. Wait for review and respond to feedback

Good luck with your submission! 🚀
