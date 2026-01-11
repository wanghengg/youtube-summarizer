# YouTube 字幕总结助手

一个Chrome扩展，用于自动爬取YouTube视频字幕并使用LLM进行中文总结。

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

## 可用脚本

- `pnpm lint` - 运行ESLint检查代码质量
- `pnpm build` - 构建项目（尚未实现）
- `pnpm dev` - 开发模式（尚未实现）
- `pnpm test` - 运行测试（尚未实现）

## 项目结构

```
youtube-summarizer/
├── manifest.json        # Chrome扩展清单文件
├── popup.html          # 弹窗页面HTML
├── popup.css           # 弹窗页面样式
├── popup.js            # 弹窗页面逻辑
├── background.js       # 后台脚本
├── content.js          # 内容脚本
├── icons/              # 扩展图标
├── package.json        # 项目配置和依赖
├── pnpm-lock.yaml     # pnpm锁定文件
└── .pnpmignore         # pnpm忽略文件
```

## 开发指南

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

### 加载扩展到Chrome

1. 打开Chrome浏览器
2. 访问 `chrome://extensions/`
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目根目录

## 使用pnpm的优势

1. **节省磁盘空间**：通过硬链接和符号链接共享依赖
2. **安装速度快**：比npm和yarn更快的安装速度
3. **严格的依赖管理**：只有package.json中声明的依赖才能被访问
4. **完全兼容npm**：支持所有npm命令和配置

## 注意事项

- 本项目使用ES模块（`"type": "module"`）
- ESLint配置使用新的扁平配置格式（ESLint 9.x）
- 所有依赖都通过pnpm管理，不要手动修改node_modules