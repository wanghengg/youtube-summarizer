# YouTube 字幕总结助手

一个Chrome扩展，用于自动提取YouTube视频字幕并使用LLM进行中文总结。

## 项目结构

```
youtube-summarizer/
├── manifest.json                 # 插件清单文件
├── package.json                  # 项目配置和依赖
├── .gitignore                    # Git忽略文件
├── .eslintrc.json               # ESLint配置
├── eslint.config.js             # ESLint配置
│
├── src/                         # 源代码目录
│   ├── background/              # 后台脚本
│   │   └── background.js
│   │
│   ├── content/                 # 内容脚本
│   │   ├── content.js
│   │   └── content.css          # 内容脚本样式（可选）
│   │
│   ├── popup/                   # 弹窗页面
│   │   ├── popup.html
│   │   ├── popup.js
│   │   └── popup.css
│   │
│   ├── components/             # 可复用组件
│   │   ├── api-client.js        # API客户端
│   │   ├── storage.js           # 存储管理
│   │   └── utils.js             # 工具函数
│   │
│   └── assets/                  # 静态资源
│       └── icons/               # 插件图标
│           ├── icon16.png
│           ├── icon48.png
│           └── icon128.png
│
├── dist/                        # 构建输出目录
├── scripts/                     # 构建脚本
│   └── build.js                # 构建脚本
│
└── docs/                        # 文档目录
    ├── PROJECT_STRUCTURE.md     # 项目结构说明
    └── API.md                   # API文档（待添加）
```

## 开发环境设置

1. 安装依赖：
   ```bash
   pnpm install
   ```

2. 运行代码检查：
   ```bash
   pnpm lint
   ```

3. 构建项目：
   ```bash
   pnpm build
   ```

4. 开发模式（构建并查看输出）：
   ```bash
   pnpm dev
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

## 功能特性

- 自动提取YouTube视频字幕
- 支持多种字幕语言
- 使用多种LLM API进行总结
- 支持语音识别（当无字幕时）
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

## 许可证

ISC