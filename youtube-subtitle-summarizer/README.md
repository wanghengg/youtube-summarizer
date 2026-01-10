# YouTube 字幕总结助手

一个 Chrome 浏览器插件，可以自动爬取当前播放的 YouTube 视频字幕，并使用 LLM（大语言模型）进行中文总结。

## ✨ 功能特点

- 🎬 **智能字幕提取**：自动从 YouTube 视频中提取字幕
- 🌍 **多语言支持**：优先提取中文字幕，其次英文，最后其他语言
- 🤖 **AI 智能总结**：使用 LLM 生成结构化的中文总结
- 🎤 **语音识别**：当视频没有字幕时，可通过语音识别获取内容
- 📋 **一键复制**：方便地复制总结内容

## 📦 安装方法

### 方法一：开发者模式安装

1. 下载或克隆此项目到本地
2. 打开 Chrome 浏览器，进入 `chrome://extensions/`
3. 开启右上角的「开发者模式」
4. 点击「加载已解压的扩展程序」
5. 选择 `youtube-subtitle-summarizer` 文件夹
6. 插件安装完成！

### 方法二：打包安装

1. 在 `chrome://extensions/` 页面点击「打包扩展程序」
2. 选择项目文件夹进行打包
3. 将生成的 `.crx` 文件拖入 Chrome 浏览器安装

## ⚙️ 配置说明

首次使用前，需要配置 API Key：

1. 点击插件图标，打开弹出窗口
2. 点击「⚙️ 设置」按钮
3. 选择 API 提供商（支持 OpenAI、Anthropic 或自定义）
4. 输入您的 API Key
5. 选择要使用的模型
6. 点击「💾 保存设置」

### 支持的 API 提供商

| 提供商 | 支持的模型 | 说明 |
|--------|-----------|------|
| OpenAI | GPT-4o, GPT-4o Mini, GPT-4 Turbo, GPT-3.5 Turbo | 推荐使用 GPT-4o Mini，性价比高 |
| Anthropic | Claude 3.5 Sonnet, Claude 3 Haiku | 需要配置 Anthropic API |
| DeepSeek | deepseek-chat, deepseek-reasoner | 国产大模型，性价比高 |
| 通义千问 (Qwen) | qwen-turbo, qwen-plus, qwen-max, qwen-long | 阿里云大模型 |
| 智谱 GLM | glm-4-plus, glm-4, glm-4-flash, glm-4-long | 智谱 AI 大模型 |
| Kimi (月之暗面) | moonshot-v1-8k, moonshot-v1-32k, moonshot-v1-128k | 支持超长上下文 |
| 自定义 | 任意兼容 OpenAI API 格式的模型 | 支持本地部署的模型 |

## 🚀 使用方法

### 基本使用

1. 打开任意 YouTube 视频页面
2. 点击浏览器工具栏中的插件图标
3. 点击「🎬 提取字幕并总结」按钮
4. 等待处理完成，查看总结结果
5. 可点击「📋 复制」按钮复制总结内容

### 字幕提取优先级

插件会按以下优先级提取字幕：
1. **中文字幕**（zh, zh-Hans, zh-Hant, zh-CN, zh-TW）
2. **英文字幕**（en, en-US, en-GB 等）
3. **其他语言字幕**（第一个可用的字幕轨道）

### 无字幕视频处理

当视频没有可用字幕时，插件会提供语音识别选项：

1. 确保视频正在播放
2. 选择识别时长（30秒 - 3分钟）
3. 选择识别语言（使用 Web Speech API 时）
4. 点击「🎤 开始语音识别」
5. 等待识别完成
6. 查看基于语音识别内容的总结

### 语音识别方式

插件支持两种语音识别方式：

| 方式 | 说明 | 优点 | 缺点 |
|------|------|------|------|
| **Web Speech API** | Chrome 浏览器内置的语音识别 | 完全免费，无需 API Key | 需要麦克风权限，识别准确度依赖网络 |
| **OpenAI Whisper** | OpenAI 提供的语音识别 API | 识别准确度高，支持多语言 | 需要 OpenAI API Key，按使用量付费 |

在设置中可以选择使用哪种语音识别方式。默认使用免费的 Web Speech API。

## 📝 总结格式

生成的总结包含以下部分：

- 📌 **核心要点**：3-5 个关键点
- 📝 **内容摘要**：200-300 字的详细总结
- 🎯 **主要观点或结论**
- 💡 **值得关注的细节或亮点**

## 🔧 技术架构

```
youtube-subtitle-summarizer/
├── manifest.json      # Chrome 插件配置文件
├── background.js      # Service Worker，处理 API 调用
├── content.js         # Content Script，提取字幕和音频
├── popup.html         # 弹出窗口 HTML
├── popup.css          # 弹出窗口样式
├── popup.js           # 弹出窗口逻辑
├── icons/             # 插件图标
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md          # 说明文档
```

## 🔒 隐私说明

- 插件仅在 YouTube 网站上运行
- API Key 存储在 Chrome 本地存储中，不会上传到任何服务器
- 字幕内容仅发送到您配置的 LLM API 进行处理
- 不收集任何用户数据

## ❓ 常见问题

### Q: 为什么提示「请先在设置中配置 API Key」？
A: 首次使用需要配置 API Key。点击设置按钮，输入您的 OpenAI 或其他提供商的 API Key。

### Q: 为什么无法提取字幕？
A: 可能的原因：
- 视频确实没有字幕
- 页面还未完全加载，请刷新后重试
- YouTube 页面结构可能已更新，请检查插件是否有新版本

### Q: 语音识别不工作？
A: 请确保：
- 视频正在播放（非暂停状态）
- 已配置 OpenAI API Key（Whisper 需要 OpenAI API）
- 浏览器允许音频捕获

### Q: 如何使用自定义 API？
A: 在设置中选择「自定义」提供商，然后输入您的 API Endpoint 和 API Key。API 需要兼容 OpenAI 的 Chat Completions 格式。

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！
