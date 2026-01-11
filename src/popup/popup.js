// Popup Script

class PopupController {
  constructor() {
    this.currentTab = null;
    this.subtitleData = null;
    this.isProcessing = false;

    this.initElements();
    this.bindEvents();
    this.init();
  }

  initElements() {
    // Views
    this.mainView = document.getElementById('main-view');
    this.settingsView = document.getElementById('settings-view');

    // Main view elements
    this.videoInfo = document.getElementById('video-info');
    this.videoTitle = document.getElementById('video-title');
    this.videoAuthor = document.getElementById('video-author');
    this.statusArea = document.getElementById('status-area');
    this.statusMessage = document.getElementById('status-message');
    this.extractBtn = document.getElementById('extract-btn');
    this.settingsBtn = document.getElementById('settings-btn');
    this.progressArea = document.getElementById('progress-area');
    this.progressFill = document.getElementById('progress-fill');
    this.progressText = document.getElementById('progress-text');
    this.resultArea = document.getElementById('result-area');
    this.resultContent = document.getElementById('result-content');
    this.subtitleInfo = document.getElementById('subtitle-info');
    this.copyBtn = document.getElementById('copy-btn');
    this.errorArea = document.getElementById('error-area');
    this.errorMessage = document.getElementById('error-message');
    this.retryBtn = document.getElementById('retry-btn');
    this.noSubtitleArea = document.getElementById('no-subtitle-area');
    this.audioDuration = document.getElementById('audio-duration');
    this.speechLanguage = document.getElementById('speech-language');
    this.speechLanguageLabel = document.getElementById('speech-language-label');
    this.speechNote = document.getElementById('speech-note');
    this.startAudioBtn = document.getElementById('start-audio-btn');

    // Settings view elements
    this.backBtn = document.getElementById('back-btn');
    this.apiProvider = document.getElementById('api-provider');
    this.apiKey = document.getElementById('api-key');
    this.toggleKeyBtn = document.getElementById('toggle-key');
    this.apiEndpoint = document.getElementById('api-endpoint');
    this.endpointGroup = document.getElementById('endpoint-group');
    this.model = document.getElementById('model');
    this.customModel = document.getElementById('custom-model');
    this.speechRecognitionProvider = document.getElementById('speech-recognition-provider');
    this.whisperSettings = document.getElementById('whisper-settings');
    this.whisperEndpoint = document.getElementById('whisper-endpoint');
    this.whisperModel = document.getElementById('whisper-model');
    this.saveSettingsBtn = document.getElementById('save-settings');
    this.testApiBtn = document.getElementById('test-api');
    this.settingsStatus = document.getElementById('settings-status');

    // 存储提供商配置
    this.providers = null;
    this.currentSpeechProvider = 'webspeech';
  }

  bindEvents() {
    // Main view events
    this.extractBtn.addEventListener('click', () => this.extractAndSummarize());
    this.settingsBtn.addEventListener('click', () => this.showSettings());
    this.copyBtn.addEventListener('click', () => this.copyResult());
    this.retryBtn.addEventListener('click', () => this.extractAndSummarize());
    this.startAudioBtn.addEventListener('click', () => this.startAudioRecognition());

    // Settings view events
    this.backBtn.addEventListener('click', () => this.showMain());
    this.apiProvider.addEventListener('change', () => this.onProviderChange());
    this.toggleKeyBtn.addEventListener('click', () => this.toggleApiKeyVisibility());
    this.speechRecognitionProvider.addEventListener('change', () => this.onSpeechProviderChange());
    this.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
    this.testApiBtn.addEventListener('click', () => this.testApiConnection());
  }

  async init() {
    try {
      // 获取当前标签页
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      this.currentTab = tab;

      // 检查是否是 YouTube 视频页面
      if (!tab.url || !tab.url.includes('youtube.com/watch')) {
        this.showStatus('请在 YouTube 视频页面使用此插件', false);
        return;
      }

      // 检查页面状态
      const response = await this.sendToContent({ action: 'checkPage' });

      if (response && response.isYouTubeVideo) {
        // 获取视频信息
        const infoResponse = await this.sendToContent({ action: 'getVideoInfo' });
        if (infoResponse && infoResponse.success) {
          this.showVideoInfo(infoResponse.videoInfo);
        }

        this.showStatus('准备就绪，点击按钮开始提取字幕', true);
        this.extractBtn.disabled = false;
      } else {
        this.showStatus('未检测到 YouTube 视频', false);
      }

      // 加载设置
      await this.loadSettings();
    } catch (error) {
      console.error('初始化失败:', error);
      this.showStatus('初始化失败，请刷新页面后重试', false);
    }
  }

  async sendToContent(message) {
    try {
      return await chrome.tabs.sendMessage(this.currentTab.id, message);
    } catch (error) {
      console.error('发送消息失败:', error);
      return null;
    }
  }

  async sendToBackground(message) {
    try {
      return await chrome.runtime.sendMessage(message);
    } catch (error) {
      console.error('发送消息到 background 失败:', error);
      return null;
    }
  }

  showVideoInfo(info) {
    if (info) {
      this.videoTitle.textContent = info.title || '未知标题';
      this.videoAuthor.textContent = info.author || '未知作者';
      this.videoInfo.classList.remove('hidden');
    }
  }

  showStatus(message, ready = false) {
    this.statusMessage.textContent = message;
    this.statusArea.classList.remove('hidden');
    this.extractBtn.disabled = !ready;
  }

  showProgress(percent, text) {
    this.progressArea.classList.remove('hidden');
    this.progressFill.style.width = `${percent}%`;
    this.progressText.textContent = text;
  }

  hideProgress() {
    this.progressArea.classList.add('hidden');
  }

  showResult(summary, subtitleInfo) {
    this.resultContent.textContent = summary;
    this.subtitleInfo.textContent = subtitleInfo;
    this.resultArea.classList.remove('hidden');
    this.errorArea.classList.add('hidden');
    this.noSubtitleArea.classList.add('hidden');
  }

  showError(message) {
    this.errorMessage.textContent = message;
    this.errorArea.classList.remove('hidden');
    this.resultArea.classList.add('hidden');
    this.noSubtitleArea.classList.add('hidden');
  }

  showNoSubtitle() {
    this.noSubtitleArea.classList.remove('hidden');
    this.errorArea.classList.add('hidden');
    this.resultArea.classList.add('hidden');

    // 根据当前语音识别提供商更新 UI
    this.updateSpeechRecognitionUI();
  }

  updateSpeechRecognitionUI() {
    if (this.currentSpeechProvider === 'webspeech') {
      this.speechLanguageLabel.classList.remove('hidden');
      this.speechNote.textContent = '注意：Web Speech API 需要视频正在播放，且需要麦克风权限';
    } else {
      this.speechLanguageLabel.classList.add('hidden');
      this.speechNote.textContent = '注意：Whisper 需要视频正在播放，且会消耗 OpenAI API 配额';
    }
  }

  async extractAndSummarize() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      // 隐藏之前的结果和错误
      this.resultArea.classList.add('hidden');
      this.errorArea.classList.add('hidden');
      this.noSubtitleArea.classList.add('hidden');
      this.statusArea.classList.add('hidden');

      // 步骤1: 提取字幕
      this.showProgress(20, '正在提取字幕...');

      const subtitleResult = await this.sendToContent({ action: 'extractSubtitles' });

      if (!subtitleResult) {
        throw new Error('无法与页面通信，请刷新页面后重试');
      }

      if (!subtitleResult.success) {
        if (subtitleResult.error === 'no_subtitles') {
          this.hideProgress();
          this.showNoSubtitle();
          this.isProcessing = false;
          return;
        }
        throw new Error(subtitleResult.message || subtitleResult.error);
      }

      this.subtitleData = subtitleResult;
      this.showProgress(50, '字幕提取成功，正在生成总结...');

      // 步骤2: 调用 LLM 生成总结
      const summaryResult = await this.sendToBackground({
        action: 'generateSummary',
        text: subtitleResult.fullText,
        videoInfo: subtitleResult.videoInfo,
        language: subtitleResult.languageName || subtitleResult.language
      });

      if (!summaryResult || !summaryResult.success) {
        throw new Error(summaryResult?.error || '生成总结失败');
      }

      this.showProgress(100, '完成！');

      // 显示结果
      const infoText = `字幕语言: ${subtitleResult.languageName || subtitleResult.language} | 字幕长度: ${subtitleResult.fullText.length} 字符`;
      this.showResult(summaryResult.summary, infoText);

    } catch (error) {
      console.error('处理失败:', error);
      this.showError(error.message);
    } finally {
      this.hideProgress();
      this.isProcessing = false;
    }
  }

  async startAudioRecognition() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      this.noSubtitleArea.classList.add('hidden');
      this.errorArea.classList.add('hidden');

      const duration = parseInt(this.audioDuration.value);

      this.startAudioBtn.disabled = true;
      this.startAudioBtn.classList.add('recording');
      this.startAudioBtn.textContent = '🔴 识别中...';

      let recognizedText = '';
      let providerName = '';

      if (this.currentSpeechProvider === 'webspeech') {
        // 使用 Web Speech API
        providerName = 'Web Speech API';
        const language = this.speechLanguage.value;

        this.showProgress(10, `正在使用 Web Speech API 识别 (${duration}秒)...`);

        const result = await this.sendToContent({
          action: 'startWebSpeechRecognition',
          duration: duration,
          language: language
        });

        if (!result || !result.success) {
          throw new Error(result?.error || 'Web Speech API 识别失败');
        }

        recognizedText = result.text;

      } else {
        // 使用 Whisper API
        providerName = 'Whisper API';

        // 步骤1: 开始录制
        this.showProgress(10, `正在录制音频 (${duration}秒)...`);

        const audioResult = await this.sendToContent({
          action: 'startAudioCapture',
          duration: duration
        });

        if (!audioResult || !audioResult.success) {
          throw new Error(audioResult?.error || '音频录制失败');
        }

        this.showProgress(40, '正在进行语音识别...');

        // 步骤2: 语音识别
        const transcribeResult = await this.sendToBackground({
          action: 'transcribeAudio',
          audioData: audioResult.audioData,
          mimeType: audioResult.mimeType
        });

        if (!transcribeResult || !transcribeResult.success) {
          throw new Error(transcribeResult?.error || '语音识别失败');
        }

        recognizedText = transcribeResult.text;
      }

      if (!recognizedText || recognizedText.trim().length === 0) {
        throw new Error('未能识别到任何语音内容，请确保视频正在播放且有声音');
      }

      this.showProgress(70, '正在生成总结...');

      // 步骤3: 生成总结
      const videoInfoResult = await this.sendToContent({ action: 'getVideoInfo' });
      const videoInfo = videoInfoResult?.videoInfo || {};

      const summaryResult = await this.sendToBackground({
        action: 'generateSummary',
        text: recognizedText,
        videoInfo: videoInfo,
        language: '语音识别'
      });

      if (!summaryResult || !summaryResult.success) {
        throw new Error(summaryResult?.error || '生成总结失败');
      }

      this.showProgress(100, '完成！');

      const infoText = `来源: ${providerName} (${duration}秒) | 识别文本长度: ${recognizedText.length} 字符`;
      this.showResult(summaryResult.summary, infoText);

    } catch (error) {
      console.error('语音识别失败:', error);
      this.showError(error.message);
    } finally {
      this.hideProgress();
      this.startAudioBtn.disabled = false;
      this.startAudioBtn.classList.remove('recording');
      this.startAudioBtn.textContent = '🎤 开始语音识别';
      this.isProcessing = false;
    }
  }

  async copyResult() {
    try {
      const text = this.resultContent.textContent;
      await navigator.clipboard.writeText(text);

      const originalText = this.copyBtn.textContent;
      this.copyBtn.textContent = '✅ 已复制';
      setTimeout(() => {
        this.copyBtn.textContent = originalText;
      }, 2000);
    } catch (error) {
      console.error('复制失败:', error);
    }
  }

  // Settings methods
  showSettings() {
    this.mainView.classList.remove('active');
    this.settingsView.classList.add('active');
  }

  showMain() {
    this.settingsView.classList.remove('active');
    this.mainView.classList.add('active');
  }

  async loadSettings() {
    const result = await this.sendToBackground({ action: 'getConfig' });
    if (result && result.success) {
      const config = result.config;
      this.providers = result.providers;

      this.apiProvider.value = config.apiProvider || 'openai';
      this.apiEndpoint.value = config.apiEndpoint || '';
      this.whisperEndpoint.value = config.whisperEndpoint || '';
      this.whisperModel.value = config.whisperModel || 'whisper-1';

      // 语音识别提供商
      this.currentSpeechProvider = config.speechRecognitionProvider || 'webspeech';
      this.speechRecognitionProvider.value = this.currentSpeechProvider;
      this.onSpeechProviderChange();

      // API Key 显示占位符
      if (config.hasApiKey) {
        this.apiKey.placeholder = '已配置 (输入新值以更新)';
      }

      // 先更新提供商相关的 UI，然后设置模型
      this.onProviderChange(false);
      this.model.value = config.model || 'gpt-4o-mini';

      // 如果是自定义模型
      if (config.apiProvider === 'custom' && config.model) {
        this.customModel.value = config.model;
      }
    }
  }

  onProviderChange(resetModel = true) {
    const provider = this.apiProvider.value;
    const providerConfig = this.providers ? this.providers[provider] : null;

    if (providerConfig) {
      // 设置默认 endpoint
      if (providerConfig.endpoint) {
        this.apiEndpoint.value = providerConfig.endpoint;
      }

      // 更新模型选项
      if (providerConfig.models && providerConfig.models.length > 0) {
        this.updateModelOptions(providerConfig.models, resetModel);
        this.model.classList.remove('hidden');
        this.customModel.classList.add('hidden');
      } else {
        // 自定义提供商，显示文本输入
        this.model.classList.add('hidden');
        this.customModel.classList.remove('hidden');
      }
    } else {
      // 回退到默认配置
      this.setDefaultProviderConfig(provider, resetModel);
    }

    // 显示/隐藏 endpoint 输入框
    this.endpointGroup.classList.toggle('hidden', provider !== 'custom');

    // OpenAI 提供商设置 Whisper endpoint
    if (provider === 'openai') {
      this.whisperEndpoint.value = 'https://api.openai.com/v1/audio/transcriptions';
    }
  }

  setDefaultProviderConfig(provider, resetModel = true) {
    const defaultConfigs = {
      openai: {
        endpoint: 'https://api.openai.com/v1/chat/completions',
        models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo']
      },
      anthropic: {
        endpoint: 'https://api.anthropic.com/v1/messages',
        models: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307']
      },
      deepseek: {
        endpoint: 'https://api.deepseek.com/chat/completions',
        models: ['deepseek-chat', 'deepseek-reasoner']
      },
      qwen: {
        endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
        models: ['qwen-turbo', 'qwen-plus', 'qwen-max', 'qwen-long']
      },
      glm: {
        endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
        models: ['glm-4-plus', 'glm-4', 'glm-4-flash', 'glm-4-long']
      },
      kimi: {
        endpoint: 'https://api.moonshot.cn/v1/chat/completions',
        models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k']
      },
      custom: {
        endpoint: '',
        models: []
      }
    };

    const config = defaultConfigs[provider] || defaultConfigs.custom;
    this.apiEndpoint.value = config.endpoint;

    if (config.models.length > 0) {
      this.updateModelOptions(config.models, resetModel);
      this.model.classList.remove('hidden');
      this.customModel.classList.add('hidden');
    } else {
      this.model.classList.add('hidden');
      this.customModel.classList.remove('hidden');
    }
  }

  updateModelOptions(models, resetModel = true) {
    const currentValue = this.model.value;
    this.model.innerHTML = models.map(m =>
      `<option value="${m}">${m}</option>`
    ).join('');

    if (!resetModel && models.includes(currentValue)) {
      this.model.value = currentValue;
    } else if (models.length > 0) {
      this.model.value = models[0];
    }
  }

  onSpeechProviderChange() {
    const provider = this.speechRecognitionProvider.value;
    this.currentSpeechProvider = provider;

    // 显示/隐藏 Whisper 设置
    if (provider === 'whisper') {
      this.whisperSettings.classList.remove('hidden');
    } else {
      this.whisperSettings.classList.add('hidden');
    }
  }

  toggleApiKeyVisibility() {
    const type = this.apiKey.type === 'password' ? 'text' : 'password';
    this.apiKey.type = type;
    this.toggleKeyBtn.textContent = type === 'password' ? '👁️' : '🙈';
  }

  async saveSettings() {
    const provider = this.apiProvider.value;

    // 获取模型值：如果是自定义提供商，使用文本输入框的值
    let modelValue;
    if (provider === 'custom') {
      modelValue = this.customModel.value || this.model.value;
    } else {
      modelValue = this.model.value;
    }

    const config = {
      apiProvider: provider,
      apiEndpoint: this.apiEndpoint.value,
      model: modelValue,
      speechRecognitionProvider: this.speechRecognitionProvider.value,
      whisperEndpoint: this.whisperEndpoint.value,
      whisperModel: this.whisperModel.value
    };

    // 只有当用户输入了新的 API Key 时才更新
    if (this.apiKey.value) {
      config.apiKey = this.apiKey.value;
    }

    const result = await this.sendToBackground({
      action: 'saveConfig',
      config: config
    });

    if (result && result.success) {
      this.showSettingsStatus('设置已保存', 'success');
      this.apiKey.value = '';
      this.apiKey.placeholder = '已配置 (输入新值以更新)';
      this.currentSpeechProvider = config.speechRecognitionProvider;
    } else {
      this.showSettingsStatus('保存失败: ' + (result?.error || '未知错误'), 'error');
    }
  }

  async testApiConnection() {
    this.showSettingsStatus('正在测试连接...', '');

    try {
      // 简单测试：发送一个简短的请求
      const result = await this.sendToBackground({
        action: 'generateSummary',
        text: 'Hello, this is a test.',
        videoInfo: { title: 'Test', author: 'Test' },
        language: 'English'
      });

      if (result && result.success) {
        console.log('API 连接测试成功, 结果:', result.summary);
        this.showSettingsStatus('✅ 连接成功！', 'success');
      } else {
        this.showSettingsStatus('❌ 连接失败: ' + (result?.error || '未知错误'), 'error');
      }
    } catch (error) {
      this.showSettingsStatus('❌ 连接失败: ' + error.message, 'error');
    }
  }

  showSettingsStatus(message, type) {
    this.settingsStatus.textContent = message;
    this.settingsStatus.className = 'settings-status';
    if (type) {
      this.settingsStatus.classList.add(type);
    }
    this.settingsStatus.classList.remove('hidden');

    if (type === 'success') {
      setTimeout(() => {
        this.settingsStatus.classList.add('hidden');
      }, 3000);
    }
  }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});
