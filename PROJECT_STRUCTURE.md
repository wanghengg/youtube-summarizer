# YouTube 字幕总结助手 - 项目结构说明

## 当前项目结构分析

当前项目是一个Chrome扩展，用于提取YouTube视频字幕并使用LLM进行总结。项目结构相对简单，主要文件都在根目录中。

## 建议的项目结构

基于Chrome插件开发最佳实践，建议采用以下结构：

```
youtube-summarizer/
├── manifest.json                 # 插件清单文件
├── package.json                  # 项目配置和依赖
├── pnpm-lock.yaml               # 依赖锁定文件
├── README.md                    # 项目说明文档
├── .gitignore                   # Git忽略文件
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
│   ├── options/                 # 选项页面（可选）
│   │   ├── options.html
│   │   ├── options.js
│   │   └── options.css
│   │
│   ├── components/             # 可复用组件
│   │   ├── api-client.js        # API客户端
│   │   ├── storage.js           # 存储管理
│   │   └── utils.js             # 工具函数
│   │
│   └── assets/                  # 静态资源
│       ├── icons/
│       │   ├── icon16.png
│       │   ├── icon48.png
│       │   └── icon128.png
│       └── images/              # 其他图片资源
│
├── dist/                        # 构建输出目录
│   ├── manifest.json
│   ├── background.js
│   ├── content.js
│   ├── popup.html
│   ├── popup.js
│   ├── popup.css
│   └── icons/
│
└── docs/                        # 文档目录
    ├── API.md                   # API文档
    └── DEVELOPMENT.md           # 开发指南
```

## 结构说明

### 1. 根目录文件
- `manifest.json`: 插件清单文件，定义插件的基本信息和权限
- `package.json`: 项目配置和依赖管理
- `.eslintrc.json`/`eslint.config.js`: 代码风格检查配置
- `README.md`: 项目说明文档

### 2. src/ 源代码目录
将所有源代码放在src目录下，便于管理和构建。

#### background/ 后台脚本
- `background.js`: 后台服务工作进程，处理全局逻辑和API调用

#### content/ 内容脚本
- `content.js`: 注入到YouTube页面的脚本，负责提取字幕
- `content.css`: 内容脚本样式（可选）

#### popup/ 弹窗页面
- `popup.html`: 弹窗页面结构
- `popup.js`: 弹窗页面逻辑
- `popup.css`: 弹窗页面样式

#### options/ 选项页面（可选）
- `options.html`: 选项页面结构
- `options.js`: 选项页面逻辑
- `options.css`: 选项页面样式

#### components/ 可复用组件
- `api-client.js`: API客户端，封装各种API调用
- `storage.js`: 存储管理，封装Chrome存储API
- `utils.js`: 工具函数，包含通用功能

#### assets/ 静态资源
- `icons/`: 插件图标
- `images/`: 其他图片资源

### 3. dist/ 构建输出目录
存放构建后的文件，用于发布到Chrome Web Store。

### 4. docs/ 文档目录
存放项目相关文档。

## 实施建议

1. **逐步迁移**: 不建议一次性重构整个项目，可以逐步迁移文件到新结构中。

2. **构建工具**: 考虑添加构建工具（如Webpack、Rollup或Vite）来处理代码打包、压缩和优化。

3. **模块化**: 将大型文件拆分为更小的模块，提高代码可维护性。

4. **类型检查**: 考虑添加TypeScript支持，提高代码质量和开发体验。

5. **测试**: 添加单元测试和集成测试，确保代码质量。

## 优势

1. **清晰的职责分离**: 不同类型的文件放在不同目录，便于理解和维护。

2. **可扩展性**: 新功能可以轻松添加到相应目录中。

3. **构建友好**: 源代码和构建输出分离，便于构建工具处理。

4. **团队协作**: 清晰的结构有助于团队成员理解和协作。

5. **代码复用**: 通用组件可以在多个地方使用，减少重复代码。