// YouTube 字幕爬取 Content Script

class YouTubeSubtitleExtractor {
  constructor() {
    this.videoId = null;
    this.subtitleTracks = [];
  }

  // 获取当前视频ID
  getVideoId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('v');
  }

  // 从页面数据中提取字幕轨道信息
  async getSubtitleTracks() {
    try {
      // 方法1: 从 ytInitialPlayerResponse 获取
      const playerResponse = this.getPlayerResponse();
      if (playerResponse && playerResponse.captions) {
        const captionTracks = playerResponse.captions.playerCaptionsTracklistRenderer?.captionTracks;
        if (captionTracks && captionTracks.length > 0) {
          return captionTracks.map(track => ({
            languageCode: track.languageCode,
            name: track.name?.simpleText || track.languageCode,
            baseUrl: track.baseUrl,
            isTranslatable: track.isTranslatable
          }));
        }
      }

      // 方法2: 从页面脚本中提取
      const scripts = document.querySelectorAll('script');
      for (const script of scripts) {
        const text = script.textContent;
        if (text && text.includes('captionTracks')) {
          const match = text.match(/"captionTracks":(\[.*?\])/);
          if (match) {
            try {
              const tracks = JSON.parse(match[1]);
              return tracks.map(track => ({
                languageCode: track.languageCode,
                name: track.name?.simpleText || track.languageCode,
                baseUrl: track.baseUrl,
                isTranslatable: track.isTranslatable
              }));
            } catch (e) {
              console.error('解析字幕轨道失败:', e);
            }
          }
        }
      }

      return [];
    } catch (error) {
      console.error('获取字幕轨道失败:', error);
      return [];
    }
  }

  // 获取 player response
  getPlayerResponse() {
    // 尝试从全局变量获取
    if (window.ytInitialPlayerResponse) {
      return window.ytInitialPlayerResponse;
    }

    // 尝试从页面脚本中提取
    const scripts = document.querySelectorAll('script');
    for (const script of scripts) {
      const text = script.textContent;
      if (text && text.includes('ytInitialPlayerResponse')) {
        const match = text.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
        if (match) {
          try {
            return JSON.parse(match[1]);
          } catch (e) {
            // 尝试另一种匹配方式
            const match2 = text.match(/var ytInitialPlayerResponse\s*=\s*({.+?});/);
            if (match2) {
              try {
                return JSON.parse(match2[1]);
              } catch (e2) {
                console.error('解析 player response 失败:', e2);
              }
            }
          }
        }
      }
    }

    return null;
  }

  // 根据优先级选择字幕轨道
  selectSubtitleTrack(tracks) {
    if (!tracks || tracks.length === 0) {
      return null;
    }

    // 优先级: 中文 > 英文 > 第一个可用的
    const chineseTrack = tracks.find(t => 
      t.languageCode === 'zh' || 
      t.languageCode === 'zh-Hans' || 
      t.languageCode === 'zh-Hant' ||
      t.languageCode === 'zh-CN' ||
      t.languageCode === 'zh-TW'
    );
    if (chineseTrack) {
      return { track: chineseTrack, language: 'chinese' };
    }

    const englishTrack = tracks.find(t => 
      t.languageCode === 'en' || 
      t.languageCode.startsWith('en-')
    );
    if (englishTrack) {
      return { track: englishTrack, language: 'english' };
    }

    // 返回第一个可用的
    return { track: tracks[0], language: tracks[0].languageCode };
  }

  // 获取字幕内容
  async fetchSubtitleContent(baseUrl) {
    try {
      // 添加 fmt=json3 参数获取 JSON 格式
      const url = new URL(baseUrl);
      url.searchParams.set('fmt', 'json3');
      
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // 解析字幕事件
      if (data.events) {
        const subtitles = data.events
          .filter(event => event.segs)
          .map(event => {
            const text = event.segs.map(seg => seg.utf8).join('');
            return {
              start: event.tStartMs / 1000,
              duration: event.dDurationMs / 1000,
              text: text.trim()
            };
          })
          .filter(sub => sub.text);
        
        return subtitles;
      }
      
      return [];
    } catch (error) {
      console.error('获取字幕内容失败:', error);
      
      // 尝试获取 XML 格式
      try {
        const response = await fetch(baseUrl);
        const text = await response.text();
        return this.parseXMLSubtitles(text);
      } catch (e) {
        console.error('获取 XML 字幕也失败:', e);
        return [];
      }
    }
  }

  // 解析 XML 格式字幕
  parseXMLSubtitles(xmlText) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'text/xml');
    const textElements = doc.querySelectorAll('text');
    
    return Array.from(textElements).map(el => ({
      start: parseFloat(el.getAttribute('start') || 0),
      duration: parseFloat(el.getAttribute('dur') || 0),
      text: el.textContent.trim()
    })).filter(sub => sub.text);
  }

  // 将字幕数组转换为纯文本
  subtitlesToText(subtitles) {
    return subtitles.map(sub => sub.text).join(' ');
  }

  // 获取视频信息
  getVideoInfo() {
    const playerResponse = this.getPlayerResponse();
    if (playerResponse && playerResponse.videoDetails) {
      return {
        title: playerResponse.videoDetails.title,
        author: playerResponse.videoDetails.author,
        lengthSeconds: playerResponse.videoDetails.lengthSeconds,
        viewCount: playerResponse.videoDetails.viewCount
      };
    }

    // 从页面元素获取
    const titleElement = document.querySelector('h1.ytd-video-primary-info-renderer, h1.title');
    const authorElement = document.querySelector('#channel-name a, ytd-channel-name a');
    
    return {
      title: titleElement?.textContent?.trim() || document.title,
      author: authorElement?.textContent?.trim() || 'Unknown',
      lengthSeconds: null,
      viewCount: null
    };
  }

  // 主方法: 提取字幕
  async extractSubtitles() {
    this.videoId = this.getVideoId();
    
    if (!this.videoId) {
      return {
        success: false,
        error: '未找到视频ID，请确保在 YouTube 视频页面上'
      };
    }

    const videoInfo = this.getVideoInfo();
    const tracks = await this.getSubtitleTracks();
    
    if (!tracks || tracks.length === 0) {
      return {
        success: false,
        error: 'no_subtitles',
        videoId: this.videoId,
        videoInfo: videoInfo,
        message: '该视频没有可用的字幕'
      };
    }

    const selected = this.selectSubtitleTrack(tracks);
    if (!selected) {
      return {
        success: false,
        error: 'no_suitable_track',
        videoId: this.videoId,
        videoInfo: videoInfo,
        message: '未找到合适的字幕轨道'
      };
    }

    const subtitles = await this.fetchSubtitleContent(selected.track.baseUrl);
    
    if (!subtitles || subtitles.length === 0) {
      return {
        success: false,
        error: 'fetch_failed',
        videoId: this.videoId,
        videoInfo: videoInfo,
        message: '获取字幕内容失败'
      };
    }

    const fullText = this.subtitlesToText(subtitles);

    return {
      success: true,
      videoId: this.videoId,
      videoInfo: videoInfo,
      language: selected.language,
      languageName: selected.track.name,
      subtitles: subtitles,
      fullText: fullText,
      availableTracks: tracks.map(t => ({
        languageCode: t.languageCode,
        name: t.name
      }))
    };
  }
}

// 音频提取器 (用于无字幕情况 - Whisper API)
class AudioExtractor {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
  }

  // 获取视频元素
  getVideoElement() {
    return document.querySelector('video.html5-main-video, video');
  }

  // 检查是否可以捕获音频
  canCaptureAudio() {
    const video = this.getVideoElement();
    return video && !video.paused;
  }

  // 开始录制音频
  async startRecording(durationSeconds = 60) {
    return new Promise(async (resolve, reject) => {
      try {
        const video = this.getVideoElement();
        if (!video) {
          reject(new Error('未找到视频元素'));
          return;
        }

        // 使用 captureStream 获取媒体流
        let stream;
        if (video.captureStream) {
          stream = video.captureStream();
        } else if (video.mozCaptureStream) {
          stream = video.mozCaptureStream();
        } else {
          reject(new Error('浏览器不支持音频捕获'));
          return;
        }

        // 只获取音频轨道
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length === 0) {
          reject(new Error('无法获取音频轨道'));
          return;
        }

        const audioStream = new MediaStream(audioTracks);
        this.audioChunks = [];
        
        this.mediaRecorder = new MediaRecorder(audioStream, {
          mimeType: 'audio/webm;codecs=opus'
        });

        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            this.audioChunks.push(event.data);
          }
        };

        this.mediaRecorder.onstop = () => {
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
          resolve(audioBlob);
        };

        this.mediaRecorder.onerror = (event) => {
          reject(new Error('录制错误: ' + event.error));
        };

        this.mediaRecorder.start(1000); // 每秒收集一次数据

        // 设置录制时长
        setTimeout(() => {
          if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
          }
        }, durationSeconds * 1000);

      } catch (error) {
        reject(error);
      }
    });
  }

  // 停止录制
  stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }
  }

  // 将 Blob 转换为 Base64
  async blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

// Web Speech API 语音识别器
class WebSpeechRecognizer {
  constructor() {
    this.recognition = null;
    this.isRecognizing = false;
    this.results = [];
    this.finalTranscript = '';
  }

  // 检查浏览器是否支持 Web Speech API
  isSupported() {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }

  // 获取视频元素
  getVideoElement() {
    return document.querySelector('video.html5-main-video, video');
  }

  // 开始语音识别
  async startRecognition(durationSeconds = 60, language = 'zh-CN') {
    return new Promise((resolve, reject) => {
      if (!this.isSupported()) {
        reject(new Error('浏览器不支持 Web Speech API'));
        return;
      }

      const video = this.getVideoElement();
      if (!video) {
        reject(new Error('未找到视频元素'));
        return;
      }

      if (video.paused) {
        reject(new Error('请先播放视频'));
        return;
      }

      // 创建语音识别实例
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      // 配置
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = language;
      this.recognition.maxAlternatives = 1;

      this.results = [];
      this.finalTranscript = '';
      this.isRecognizing = true;

      let timeoutId = null;

      this.recognition.onresult = (event) => {
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            this.finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
      };

      this.recognition.onerror = (event) => {
        console.error('语音识别错误:', event.error);
        // 某些错误可以忽略并继续
        if (event.error === 'no-speech' || event.error === 'aborted') {
          return;
        }
        this.isRecognizing = false;
        if (timeoutId) clearTimeout(timeoutId);
        reject(new Error('语音识别错误: ' + event.error));
      };

      this.recognition.onend = () => {
        // 如果还在识别期间意外结束，尝试重启
        if (this.isRecognizing) {
          try {
            this.recognition.start();
          } catch (e) {
            // 忽略重启错误
          }
        }
      };

      // 开始识别
      try {
        this.recognition.start();
      } catch (e) {
        reject(new Error('无法启动语音识别: ' + e.message));
        return;
      }

      // 设置超时
      timeoutId = setTimeout(() => {
        this.stopRecognition();
        resolve(this.finalTranscript.trim());
      }, durationSeconds * 1000);
    });
  }

  // 停止语音识别
  stopRecognition() {
    this.isRecognizing = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // 忽略停止错误
      }
    }
  }

  // 获取支持的语言列表
  getSupportedLanguages() {
    return [
      { code: 'zh-CN', name: '中文（简体）' },
      { code: 'zh-TW', name: '中文（繁体）' },
      { code: 'en-US', name: 'English (US)' },
      { code: 'en-GB', name: 'English (UK)' },
      { code: 'ja-JP', name: '日本語' },
      { code: 'ko-KR', name: '한국어' },
      { code: 'es-ES', name: 'Español' },
      { code: 'fr-FR', name: 'Français' },
      { code: 'de-DE', name: 'Deutsch' },
      { code: 'ru-RU', name: 'Русский' },
      { code: 'pt-BR', name: 'Português (Brasil)' }
    ];
  }
}

// 创建全局实例
const subtitleExtractor = new YouTubeSubtitleExtractor();
const audioExtractor = new AudioExtractor();
const webSpeechRecognizer = new WebSpeechRecognizer();

// 监听来自 popup 或 background 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractSubtitles') {
    subtitleExtractor.extractSubtitles().then(result => {
      sendResponse(result);
    }).catch(error => {
      sendResponse({
        success: false,
        error: error.message
      });
    });
    return true; // 保持消息通道开放
  }

  if (request.action === 'getVideoInfo') {
    const videoInfo = subtitleExtractor.getVideoInfo();
    const videoId = subtitleExtractor.getVideoId();
    sendResponse({
      success: true,
      videoId: videoId,
      videoInfo: videoInfo
    });
    return true;
  }

  if (request.action === 'startAudioCapture') {
    const duration = request.duration || 60;
    audioExtractor.startRecording(duration).then(async (audioBlob) => {
      const base64Audio = await audioExtractor.blobToBase64(audioBlob);
      sendResponse({
        success: true,
        audioData: base64Audio,
        mimeType: 'audio/webm'
      });
    }).catch(error => {
      sendResponse({
        success: false,
        error: error.message
      });
    });
    return true;
  }

  if (request.action === 'stopAudioCapture') {
    audioExtractor.stopRecording();
    sendResponse({ success: true });
    return true;
  }

  // Web Speech API 语音识别
  if (request.action === 'startWebSpeechRecognition') {
    const duration = request.duration || 60;
    const language = request.language || 'zh-CN';
    
    webSpeechRecognizer.startRecognition(duration, language).then(text => {
      sendResponse({
        success: true,
        text: text
      });
    }).catch(error => {
      sendResponse({
        success: false,
        error: error.message
      });
    });
    return true;
  }

  if (request.action === 'stopWebSpeechRecognition') {
    webSpeechRecognizer.stopRecognition();
    sendResponse({ success: true });
    return true;
  }

  if (request.action === 'checkWebSpeechSupport') {
    sendResponse({
      supported: webSpeechRecognizer.isSupported(),
      languages: webSpeechRecognizer.getSupportedLanguages()
    });
    return true;
  }

  if (request.action === 'checkPage') {
    const videoId = subtitleExtractor.getVideoId();
    sendResponse({
      isYouTubeVideo: !!videoId,
      videoId: videoId
    });
    return true;
  }
});

// 页面加载完成后通知 background
window.addEventListener('load', () => {
  const videoId = subtitleExtractor.getVideoId();
  if (videoId) {
    chrome.runtime.sendMessage({
      action: 'pageLoaded',
      videoId: videoId
    }).catch(() => {
      // 忽略错误，可能 background 还未准备好
    });
  }
});

console.log('YouTube 字幕总结助手 - Content Script 已加载');
