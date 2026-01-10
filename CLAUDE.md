# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

YouTube Subtitle Summarizer - A Chrome Extension (Manifest V3) that extracts subtitles from YouTube videos and generates Chinese summaries using LLM APIs.

## Development Commands

```bash
# Load extension for testing
# 1. Open chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the project folder

# Package extension for distribution
# 1. Open chrome://extensions/
# 2. Click "Pack extension"
# 3. Select project folder
# 4. Use the generated .crx file

# Validate JavaScript syntax
node --check content.js
```

## Architecture

This is a Chrome Extension with three main components communicating via Chrome message passing:

```
┌─────────────┐     ┌─────────────────┐     ┌─────────────┐     ┌─────────┐
│   Popup UI  │────▶│  Content Script │────▶│  Background │────▶│ LLM API │
│ (popup.html)│     │  (content.js)   │     │ (background)│     │         │
└─────────────┘     └─────────────────┘     └─────────────┘     └─────────┘
```

### Component Responsibilities

**popup.js / popup.html / popup.css**
- Main user interface and controller
- Handles user actions (extract, settings, copy)
- Coordinates the workflow between content script and background

**content.js**
- `YouTubeSubtitleExtractor` class: Extracts subtitles from YouTube page
  - Tries `ytInitialPlayerResponse` global variable first
  - Falls back to parsing `<script>` tags with regex
  - `extractSubtitles()` has retry logic (3 attempts, 1s delay)
  - Supports JSON3 and XML subtitle formats
- `AudioExtractor` class: Captures video audio using `video.captureStream()`
- `WebSpeechRecognizer` class: Browser's native speech-to-text

**background.js**
- Service worker handling all API calls
- `API_PROVIDERS` object: Defines supported LLM providers (OpenAI, Anthropic, DeepSeek, Qwen, GLM, Kimi, Custom)
- `generateSummary()`: Sends subtitles to LLM with system prompt for Chinese summarization
- `transcribeAudio()`: Calls Whisper API for audio transcription
- Stores config in `chrome.storage.sync`

### Data Flow

1. User clicks "Extract and Summarize" in popup
2. Popup sends `extractSubtitles` message to content script
3. Content script:
   - Extracts `ytInitialPlayerResponse` from page
   - Parses `captionTracks` array from player response
   - Fetches subtitle content from `baseUrl` (adds `fmt=json3`)
   - Returns fullText and metadata to popup
4. Popup sends `generateSummary` to background with fullText
5. Background calls configured LLM API with summarization prompt
6. Summary is displayed in popup

## Key Implementation Details

### Subtitle Extraction (content.js)

The `YouTubeSubtitleExtractor` class uses multiple extraction strategies:

1. `getPlayerResponse()`: Gets `window.ytInitialPlayerResponse` or parses from `<script>` tags
2. `getSubtitleTracks()`: Extracts `captionTracks` from player response
3. `selectSubtitleTrack()`: Language priority: Chinese (zh, zh-Hans, zh-Hant, zh-CN, zh-TW) → English (en, en-*) → First available
4. `fetchSubtitleContent()`: Downloads from `baseUrl` with `fmt=json3`, parses `events[].segs[]`

### API Configuration

Supported providers defined in `API_PROVIDERS` object (background.js:15-58):
- OpenAI, Anthropic (Claude), DeepSeek, Qwen (Alibaba), GLM (Zhipu), Kimi (Moonshot), Custom

### Speech Recognition Fallback

When no subtitles available, two options:
- **Web Speech API**: Free, browser-native, requires microphone permission, video must be playing
- **Whisper API**: Higher accuracy, requires OpenAI API Key, consumes quota

## Common Issues

1. **"No subtitles detected" when video has subtitles**: The regex parsing of `captionTracks` may fail if YouTube changes page structure. Check console logs for retry attempts.

2. **CORS issues**: `fetchSubtitleContent()` makes cross-origin requests to YouTube's subtitle servers. This works because the content script runs on the same domain.

3. **Extension not responding**: Content script loads at `document_idle`. If switching YouTube videos quickly, the old content script may need page refresh.
