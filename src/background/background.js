// Background Service Worker

// LLM API 配置
const DEFAULT_CONFIG = {
  apiProvider: 'openai', // 'openai', 'anthropic', 'deepseek', 'qwen', 'glm', 'kimi', 'custom'
  apiKey: '',
  apiEndpoint: 'https://api.openai.com/v1/chat/completions',
  model: 'gpt-4o-mini',
  speechRecognitionProvider: 'webspeech', // 'webspeech' or 'whisper'
  whisperEndpoint: 'https://api.openai.com/v1/audio/transcriptions',
  whisperModel: 'whisper-1'
};

// API 提供商配置
const API_PROVIDERS = {
  openai: {
    name: 'OpenAI',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    type: 'openai'
  },
  anthropic: {
    name: 'Anthropic (Claude)',
    endpoint: 'https://api.anthropic.com/v1/messages',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'],
    type: 'anthropic'
  },
  deepseek: {
    name: 'DeepSeek',
    endpoint: 'https://api.deepseek.com/chat/completions',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    type: 'openai'
  },
  qwen: {
    name: '通义千问 (Qwen)',
    endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    models: ['qwen-turbo', 'qwen-plus', 'qwen-max', 'qwen-long'],
    type: 'openai'
  },
  glm: {
    name: '智谱 GLM',
    endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    models: ['glm-4-plus', 'glm-4', 'glm-4-flash', 'glm-4-long'],
    type: 'openai'
  },
  kimi: {
    name: 'Kimi (月之暗面)',
    endpoint: 'https://api.moonshot.cn/v1/chat/completions',
    models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
    type: 'openai'
  },
  custom: {
    name: '自定义',
    endpoint: '',
    models: [],
    type: 'openai'
  }
};

// 获取配置
async function getConfig() {
  const result = await chrome.storage.sync.get('config');
  return { ...DEFAULT_CONFIG, ...result.config };
}

// 保存配置
async function saveConfig(config) {
  await chrome.storage.sync.set({ config: { ...DEFAULT_CONFIG, ...config } });
}

// 使用 LLM 生成总结
async function generateSummary(text, videoInfo, language) {
  const config = await getConfig();

  if (!config.apiKey) {
    throw new Error('请先在设置中配置 API Key');
  }

  const systemPrompt = `你是一个专业的视频内容总结助手。请根据提供的视频字幕内容，生成一份结构清晰、内容准确的中文总结。

总结要求：
1. 使用中文输出
2. 包含以下部分：
   - 📌 核心要点（3-5个关键点）
   - 📝 内容摘要（200-300字的详细总结）
   - 🎯 主要观点或结论
   - 💡 值得关注的细节或亮点

请确保总结准确反映原视频内容，不要添加原文中没有的信息。`;

  const userPrompt = `视频标题：${videoInfo.title || '未知'}
作者：${videoInfo.author || '未知'}
字幕语言：${language}

字幕内容：
${text}

请生成中文总结：`;

  // 根据 API 提供商构建不同的请求
  const providerConfig = API_PROVIDERS[config.apiProvider] || API_PROVIDERS.custom;

  if (providerConfig.type === 'anthropic') {
    return await callAnthropicAPI(config, systemPrompt, userPrompt);
  } else {
    return await callOpenAIAPI(config, systemPrompt, userPrompt);
  }
}

// 调用 OpenAI 兼容 API
async function callOpenAIAPI(config, systemPrompt, userPrompt) {
  const requestBody = {
    model: config.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.7,
    max_tokens: 2000
  };

  const response = await fetch(config.apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`API 请求失败: ${response.status} - ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// 调用 Anthropic API
async function callAnthropicAPI(config, systemPrompt, userPrompt) {
  const requestBody = {
    model: config.model,
    max_tokens: 2000,
    system: systemPrompt,
    messages: [
      { role: 'user', content: userPrompt }
    ]
  };

  const response = await fetch(config.apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`API 请求失败: ${response.status} - ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

// 使用 Whisper API 进行语音识别
async function transcribeAudio(audioBase64, mimeType) {
  const config = await getConfig();

  if (!config.apiKey) {
    throw new Error('请先在设置中配置 API Key');
  }

  // 将 base64 转换为 Blob
  const binaryString = atob(audioBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const audioBlob = new Blob([bytes], { type: mimeType });

  // 创建 FormData
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.webm');
  formData.append('model', config.whisperModel);
  formData.append('response_format', 'text');

  const response = await fetch(config.whisperEndpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`语音识别失败: ${response.status} - ${errorData.error?.message || response.statusText}`);
  }

  const text = await response.text();
  return text;
}

// 监听来自 popup 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'generateSummary') {
    generateSummary(request.text, request.videoInfo, request.language)
      .then(summary => {
        sendResponse({ success: true, summary: summary });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  if (request.action === 'transcribeAudio') {
    transcribeAudio(request.audioData, request.mimeType)
      .then(text => {
        sendResponse({ success: true, text: text });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  if (request.action === 'getConfig') {
    getConfig().then(config => {
      // 不返回完整的 API Key，只返回是否已配置
      sendResponse({
        success: true,
        config: {
          ...config,
          apiKey: config.apiKey ? '******' : '',
          hasApiKey: !!config.apiKey
        },
        providers: API_PROVIDERS
      });
    });
    return true;
  }

  if (request.action === 'saveConfig') {
    saveConfig(request.config)
      .then(() => {
        sendResponse({ success: true });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  if (request.action === 'pageLoaded') {
    // 可以在这里添加页面加载后的处理逻辑
    console.log('YouTube 视频页面已加载:', request.videoId);
    return false;
  }
});

// 安装时初始化配置
chrome.runtime.onInstalled.addListener(() => {
  getConfig().then(config => {
    saveConfig(config);
  });
  console.log('YouTube 字幕总结助手已安装');
});
