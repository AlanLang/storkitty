# Storkitty 文件管理系统

一个基于 Rust 和 React 的轻量级文件管理系统，提供安全的用户认证和现代化的文件浏览界面。

![screely-1754393213853.png](https://cdn.sa.net/2025/08/05/YZNtHdKpMJ627hq.png)

## 功能特性

### 🔐 用户认证系统
- 安全的 JWT Token 认证（异步安全配置管理）
- 交互式初始设置向导
- 热配置重载（无需重启服务器）
- 用户登录/登出功能
- 会话状态管理和自动恢复
- 安全优先：无默认凭据，配置文件自动 gitignore

### 📁 文件管理功能
- 文件和文件夹浏览
- 实时存储空间显示
- 文件大小智能格式化
- 文件类型识别
- 实时搜索和过滤
- 简洁的列表视图界面
- **新建文件功能** 🆕 支持创建多种文本文件类型
  - 支持 30+ 种文件类型（.md, .txt, .js, .ts, .py, .json, .yaml, .css, .html 等）
  - 智能文件类型选择和自定义扩展名
  - 实时文件名验证和重复检测
  - 仅允许文本类型文件，确保系统安全
- **多格式文件预览** ✨ 支持 Markdown、PDF、图片和代码文件预览
- **在线文本编辑** 🔥 基于 Monaco Editor 的专业级代码编辑器
  - 支持 30+ 种编程语言语法高亮
  - 实时代码补全和错误检测
  - VS Code 级别的编辑体验
  - 键盘快捷键支持 (Ctrl+S 保存, ESC 退出)
  - 多种编辑入口：右键菜单、URL 参数、README 快速编辑按钮
  - 仅登录用户可访问，确保数据安全

### 🎨 前端界面
- 现代化的文件管理界面
- 响应式布局设计（移动端友好）
- 基于 shadcn/ui 的组件系统
- TailwindCSS 4.x 样式系统
- 深色模式自动支持
- 简洁的列表设计
- **智能时间显示** ⏰ 相对时间（"2分钟前"）+ 悬浮完整时间提示

### ⚡ 技术架构
- **后端**: Rust + Axum (高性能异步 Web 框架)
- **前端**: React 19 + TypeScript
- **路由**: TanStack Router (文件路由系统)
- **状态管理**: TanStack Query (服务器状态缓存)
- **样式**: TailwindCSS 4.x + shadcn/ui
- **构建工具**: Rsbuild (快速构建)
- **包管理**: Bun (极速依赖管理)
- **数据存储**: 文件系统 + TOML 配置 (无数据库)

## 快速开始

### 🚀 一键安装（推荐）

对于 Linux x86_64 系统，可以使用一键安装脚本快速部署：

#### 下载并运行安装脚本

```bash
curl -fsSL https://raw.githubusercontent.com/AlanLang/storkitty/main/install.sh | sudo bash
```

#### 或者分步执行

```bash
wget https://raw.githubusercontent.com/AlanLang/storkitty/main/install.sh
chmod +x install.sh
sudo ./install.sh
```

安装完成后，Storkitty 将作为系统服务运行：
- 🌐 访问地址: http://localhost:3330
- 🛠️ **首次访问**: 系统将自动引导您完成初始设置，创建管理员账户
- 📁 数据目录: `/etc/storkitty/uploads`
- ⚙️ 配置文件: `/etc/storkitty/config.toml`

#### 安装脚本命令

```bash
# 安装或更新到最新版本
sudo ./install.sh install

# 查看安装状态
./install.sh status

# 卸载 Storkitty（保留用户数据）
sudo ./install.sh uninstall

# 显示帮助信息
./install.sh help
```

#### 服务管理

```bash
# 查看服务状态
systemctl status storkitty

# 启动/停止/重启服务
sudo systemctl start storkitty
sudo systemctl stop storkitty
sudo systemctl restart storkitty

# 查看服务日志
journalctl -u storkitty -f
```

### 📦 手动安装

#### 环境要求
- Rust 1.70+
- Node.js 18+
- Bun（推荐）或 npm

### 初始配置

**自动化设置（推荐）**：
系统首次启动时会自动检测配置状态，如需初始化将引导您完成设置。

**手动准备配置文件**：
```bash
# 复制配置文件模板（或创建空白配置）
cp config.example.toml config.toml

# 确保用户部分为空（触发初始化向导）
# [user]
# username = ""
# password_hash = ""
# email = ""
```

### 安装依赖
```bash
# 安装前端依赖
bun install

# 或使用 npm
npm install
```

### 开发模式
```bash
# 1. 启动前端开发服务器（端口 3001）
bun run dev

# 2. 启动后端服务器（另一个终端，端口 3330）
cargo run

# 3. 访问应用
# 前端: http://localhost:3001
# 后端API: http://localhost:3330/api
# 首次访问会引导您完成初始设置
```

### 生产构建
```bash
# 1. 构建前端（输出到 web/ 目录）
bun run build

# 2. 构建后端（包含静态文件服务）
cargo build --release

# 3. 运行生产版本
./target/release/storkitty

# 4. 访问应用
# http://localhost:3330
# 首次访问会自动引导设置管理员账户
```

## 项目结构

```
storkitty/
├── src/
│   ├── backend/          # Rust 后端代码
│   │   ├── mod.rs        # 模块导出
│   │   ├── auth.rs       # 认证模块（异步安全）
│   │   ├── files.rs      # 文件管理模块
│   │   ├── setup.rs      # 初始设置和配置管理
│   │   └── config.rs     # 配置文件解析
│   ├── frontend/         # React 前端代码
│   │   ├── api/          # API 客户端
│   │   │   ├── auth.ts   # 认证 & 设置 API
│   │   │   └── files.ts  # 文件管理 API
│   │   ├── utils/        # 工具函数
│   │   │   ├── editor.ts # Monaco Editor 动态加载
│   │   │   ├── pdf.ts    # PDF.js 动态加载
│   │   │   └── markdown.ts # Markdown-it 动态加载
│   │   ├── types/        # TypeScript 类型定义
│   │   ├── components/   # UI 组件
│   │   │   └── preview/  # 文件预览组件
│   │   ├── routes/       # 文件路由页面
│   │   ├── hooks/        # React Hooks
│   │   ├── contexts/     # React Context
│   │   └── styles/       # 样式文件
│   └── main.rs           # Rust 入口文件
├── config.example.toml   # 配置文件模板（复制为 config.toml）
├── uploads/              # 文件存储目录（.gitignore）
├── web/                  # 前端构建输出目录
└── docs/                 # 项目文档
```

## 配置说明

### 配置文件 (config.toml)
```toml
[server]
host = "0.0.0.0"
port = 3330

[user]
username = ""  # 留空将触发初始化向导
password_hash = ""
email = ""

[jwt]
secret_key = "your-secret-key"
expiration_hours = 24

[files]
root_directory = "./uploads"
max_file_size = 100
allowed_extensions = []
blocked_extensions = [".exe", ".bat", ".sh"]

[security]
allow_mkdir = true
allow_delete = true
allow_download = true
```

### API 端点

#### 系统初始化
- `GET /api/setup/status` - 检查系统初始化状态
- `POST /api/setup/user` - 初始化管理员用户（返回JWT Token）

#### 认证
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/verify` - Token 验证（包含用户信息和文件配置）

#### 文件管理
- `GET /api/files/{directory_id}/list` - 获取指定目录的文件列表
- `GET /api/files/{directory_id}/list/{path}` - 获取指定路径文件列表
- `GET /api/files/{directory_id}/storage` - 获取存储空间信息
- `DELETE /api/files/{directory_id}/delete/{path}` - 删除文件或目录
- `POST /api/files/{directory_id}/mkdir/{path}` - 创建新目录
- `POST /api/files/{directory_id}/create` - 创建新文件 🆕
- `PUT /api/files/{directory_id}/rename/{path}` - 重命名文件或目录
- `GET /api/files/{directory_id}/download/{path}` - 文件下载（无需认证）
- `GET /api/files/{directory_id}/show/{path}` - 预览文本文件内容（支持 30+ 格式）✨
- `PUT /api/files/{directory_id}/save/{path}` - 保存文件内容（需要认证）🔥

#### 文件上传
- `POST /api/upload/simple` - 简单文件上传

## 开发规范

- 使用 TailwindCSS 4.x 进行样式开发，禁止自定义 CSS
- 遵循 shadcn/ui 设计系统和组件规范
- 使用 TypeScript 进行类型安全开发
- 遵循 React 19 最佳实践
- 使用 TanStack Query 管理服务器状态
- 遵循文件路由约定

## 许可证

MIT License