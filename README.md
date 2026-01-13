# YouTube 字幕总结助手

一个Chrome扩展，用于自动提取YouTube视频字幕并使用LLM进行中文总结。

## 功能特性

- 自动提取YouTube视频字幕
- 支持多种字幕语言（优先中文、英文）
- 使用多种LLM API进行总结
- 支持语音识别（当无字幕时）
  - Web Speech API（浏览器原生）
  - Whisper API（OpenAI）
- 可配置的API提供商和模型
- 简洁的用户界面

## 支持的API提供商

- OpenAI
- Anthropic (Claude)
- DeepSeek
- 通义千问 (Qwen)
- 智谱 GLM
- Kimi (月之暗面)
- 自定义API

## 项目结构

```
youtube-summarizer/
├── manifest.json                 # 插件清单文件
├── package.json                  # 项目配置和依赖
├── eslint.config.js             # ESLint配置
├── tsconfig.json                # TypeScript配置
│
├── src/                         # 源代码目录
│   ├── background/              # 后台脚本
│   │   └── background.js        # Service Worker (LLM API调用)
│   │
│   ├── content/                 # 内容脚本
│   │   └── content.js           # 字幕提取和语音识别
│   │
│   ├── popup/                   # 弹窗页面
│   │   ├── popup.html           # UI结构
│   │   ├── popup.css            # 样式
│   │   └── popup.js             # UI控制器
│   │
│   └── assets/                  # 静态资源
│       └── icons/               # 插件图标
│           ├── icon16.png
│           ├── icon48.png
│           └── icon128.png
│
├── dist/                        # 构建输出目录
├── scripts/                     # 构建脚本
│   └── build.js                 # 构建脚本
│
└── docs/                        # 文档目录
    ├── PROJECT_STRUCTURE.md     # 项目结构说明
    └── CLAUDE.md                # Claude Code 指南
```

## 开发环境设置

本项目使用pnpm作为包管理器。

### 安装pnpm

如果您尚未安装pnpm，可以使用以下命令安装：

```bash
npm install -g pnpm
```

或者使用npx：

```bash
npx pnpm install
```

### 安装依赖

```bash
pnpm install
```

### 可用脚本

- `pnpm lint` - 运行ESLint检查代码质量
- `pnpm build` - 构建项目（输出到 dist/ 目录）
- `pnpm dev` - 开发模式（构建并查看输出）
- `pnpm type-check` - 运行TypeScript类型检查

### 代码规范

项目使用ESLint进行代码检查，配置文件为`eslint.config.js`。主要规则：

- 允许使用console语句（用于调试）
- 警告未使用的变量
- 允许在Promise构造函数中使用async函数

### 添加新依赖

```bash
# 添加生产依赖
pnpm add <package-name>

# 添加开发依赖
pnpm add -D <package-name>
```

## 安装扩展

1. 构建项目：
   ```bash
   pnpm build
   ```

2. 打开Chrome浏览器，进入 `chrome://extensions/`

3. 开启"开发者模式"

4. 点击"加载已解压的扩展程序"

5. 选择项目中的 `dist` 目录

## 使用说明

1. 在YouTube视频页面打开扩展
2. 点击"提取字幕并总结"按钮
3. 等待字幕提取和总结生成
4. 查看生成的中文总结

如果视频没有字幕，可以使用语音识别功能：
- 选择语音识别方式（Web Speech API 或 Whisper API）
- 设置识别时长
- 点击"开始语音识别"按钮
- 确保视频正在播放且有声音

## 架构说明

### 组件职责

**popup.js** - 主控制器，处理：
- 用户操作（提取、设置、复制）
- 在popup、content script和background之间传递消息

**content.js** - 字幕提取：
- `YouTubeSubtitleExtractor`: 从页面解析字幕轨道
- `AudioExtractor`: 通过 `video.captureStream()` 捕获音频（用于Whisper API）
- `WebSpeechRecognizer`: 浏览器原生语音识别

**background.js** - API处理：
- `API_PROVIDERS`: OpenAI、Anthropic、DeepSeek等API配置
- `generateSummary()`: 调用LLM生成中文总结
- `transcribeAudio()`: Whisper API音频转录
- 使用 `chrome.storage.sync` 存储配置

### 数据流

1. 用户在popup中点击"提取并总结"
2. Popup → content script: 发送 `extractSubtitles` 消息
3. Content script:
   - 从页面获取 `ytInitialPlayerResponse`
   - 解析 `captionTracks` 数组
   - 使用 `fmt=json3` 获取字幕内容
   - 返回 `fullText` 和元数据
4. Popup → background: 发送 `generateSummary` 消息
5. Background调用配置的LLM API
6. 在popup中显示总结

### 字幕语言优先级

字幕选择顺序：中文（zh, zh-Hans, zh-Hant, zh-CN, zh-TW）→ 英文（en, en-*）→ 第一个可用的

## 使用pnpm的优势

1. **节省磁盘空间**：通过硬链接和符号链接共享依赖
2. **安装速度快**：比npm和yarn更快的安装速度
3. **严格的依赖管理**：只有package.json中声明的依赖才能被访问
4. **完全兼容npm**：支持所有npm命令和配置

## 注意事项

- 本项目使用ES模块（`"type": "module"`）
- ESLint配置使用新的扁平配置格式（ESLint 9.x）
- 所有依赖都通过pnpm管理，不要手动修改node_modules

## 许可证

ISC