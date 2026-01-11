# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

YouTube Subtitle Summarizer - A Chrome Extension (Manifest V3) that extracts subtitles from YouTube videos and generates Chinese summaries using LLM APIs.

## Development Commands

```bash
# Install dependencies
pnpm install

# Lint code
pnpm lint

# Build extension (outputs to dist/)
pnpm build

# Development mode (build + notify)
pnpm dev
```

**Load for testing:**
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist/` directory

## Architecture

Chrome Extension with source in `src/` and build output to `dist/`:

```
src/
├── assets/icons/           # Extension icons
├── background/background.js  # Service worker (LLM API calls)
├── content/content.js      # Content script (subtitle extraction)
└── popup/
    ├── popup.html          # UI structure
    ├── popup.css           # Styles
    └── popup.js            # UI controller
```

### Component Responsibilities

**popup.js** - Main controller handling:
- User actions (extract, settings, copy)
- Message passing between popup, content script, and background

**content.js** - Subtitle extraction:
- `YouTubeSubtitleExtractor`: Parses `ytInitialPlayerResponse` and `<script>` tags for `captionTracks`
- `AudioExtractor`: Captures audio via `video.captureStream()` for Whisper API
- `WebSpeechRecognizer`: Browser-native speech-to-text

**background.js** - API handling:
- `API_PROVIDERS`: Config for OpenAI, Anthropic, DeepSeek, Qwen, GLM, Kimi, Custom
- `generateSummary()`: Calls LLM with Chinese summarization prompt
- `transcribeAudio()`: Whisper API for audio transcription
- Stores config in `chrome.storage.sync`

### Data Flow

1. User clicks "Extract and Summarize" in popup
2. Popup → content script: `extractSubtitles` message
3. Content script:
   - Gets `ytInitialPlayerResponse` from page
   - Parses `captionTracks` array
   - Fetches subtitle content from `baseUrl` with `fmt=json3`
   - Returns `fullText` and metadata
4. Popup → background: `generateSummary` message
5. Background calls configured LLM API
6. Summary displayed in popup

### Language Priority

Subtitle selection order: Chinese (zh, zh-Hans, zh-Hant, zh-CN, zh-TW) → English (en, en-*) → First available

## Common Issues

1. **"No subtitles detected" when video has subtitles**: Regex parsing of `captionTracks` may fail if YouTube changes page structure. Check console for retry logs.

2. **Empty subtitle response**: `fetchSubtitleContent()` handles JSON parse errors and falls back to XML format automatically.

3. **Extension not responding after video navigation**: Content script loads at `document_idle`. Refresh page when switching videos quickly.
