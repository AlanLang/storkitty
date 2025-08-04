# Storkitty 项目功能规划文档

## 项目概述

**Storkitty** 是一个轻量级的无数据库文件管理系统，基于 Rust + React 技术栈开发。系统提供 Web 界面来管理服务器端文件，支持常见的文件操作功能。

### 核心特性
- 🔐 **安全认证**: JWT-based 用户登录系统
- 📁 **多目录管理**: 支持多个独立存储目录的完整文件 CRUD 操作
- 🚀 **无数据库**: 基于文件系统和配置文件，部署简单
- 🎨 **现代界面**: React + TypeScript 响应式前端
- ⚡ **高性能**: Rust Axum 后端，异步处理 + API 性能优化
- 📦 **快速构建**: Bun 包管理器，极速依赖安装
- 🗂️ **智能存储**: 多目录存储系统，灵活配置不同用途的存储位置

---

## 功能模块设计

### 1. 用户认证模块 ✅ (已实现)

**功能描述**: 提供安全的用户登录和会话管理，支持系统初始化

**实现方案**:
- **后端**: JWT token 认证 + bcrypt 密码哈希
- **前端**: React Context 状态管理 + localStorage 持久化
- **配置**: TOML 文件存储用户凭据
- **安全**: 自动 token 验证和路由保护
- **初始化**: 首次运行时自动引导管理员账户创建

**UI 设计**:
- ✅ 现代化登录界面
- ✅ 基于 shadcn/ui 设计系统
- ✅ TailwindCSS 4.x 样式系统
- ✅ 响应式布局设计
- ✅ 暗色主题支持
- ✅ 用户体验优化（去除焦点边框，简化交互）
- ✅ 演示账号信息显示

**系统初始化功能** ✅ (新增):
- ✅ **自动设置检测**: 系统启动时自动检查是否需要初始化
- ✅ **设置向导界面**: 友好的 Web 界面引导用户创建管理员账户
- ✅ **智能路由**: 根据系统状态自动重定向到设置页面或文件管理页面
- ✅ **即时生效**: 设置完成后立即登录，无需重启服务
- ✅ **安全默认**: 无默认密码，强制用户设置安全凭据

**API 接口**:
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/verify` - token 验证 + 系统配置信息（用户信息、文件配置、存储目录列表）
- `GET /api/setup/status` - 检查系统是否需要初始化
- `POST /api/setup/init` - 初始化系统并创建管理员账户

**前端技术栈升级**:
- ✅ React 19 + TypeScript
- ✅ TanStack Router（文件路由系统）
- ✅ TanStack Query（服务器状态管理）
- ✅ TailwindCSS 4.x（最新样式系统）
- ✅ shadcn/ui 组件库集成
- ✅ Rsbuild 构建工具

---

### 2. 多目录存储系统 ✅ (已实现)

**功能描述**: 支持配置和管理多个独立的存储目录，每个目录有不同的用途和设置

**实现方案**:
- **后端**: 
  - ✅ 基于 TOML 配置的多目录支持 (`[[storage_directories]]` 配置节)
  - ✅ 每个目录独立的 ID、名称、描述、图标和存储类型
  - ✅ 默认目录设置和自动目录创建
  - ✅ 目录级别的路径安全检查和沙盒隔离
  - ✅ 统一的目录化 API 端点设计
  - ✅ **目录禁用功能**: 支持通过 `disable = true` 临时禁用目录
- **前端**:
  - ✅ 现代化目录选择界面，侧边栏显示所有可用目录
  - ✅ 目录图标和描述的直观展示
  - ✅ 无缝的目录切换体验
  - ✅ 认证上下文集成目录信息，减少网络请求

**配置示例**:
```toml
[[storage.directories]]
id = "uploads"
name = "My Files"
description = "Personal file storage"
icon = "hard-drive"
storage_type = "local"
path = "./uploads"

[[storage.directories]]
id = "documents"
name = "Documents"
description = "Document storage area"
icon = "file-text"
storage_type = "local"
path = "./documents"
# 可选：禁用此目录，不会在前端显示
# disable = true
```

**目录选择系统**:
- ✅ **智能默认选择**: 自动选择配置中的第一个目录作为默认存储位置
- ✅ **localStorage 持久化**: 用户选择的目录自动保存到浏览器本地存储
- ✅ **无缝用户体验**: 刷新浏览器后自动恢复上次选择的目录
- ✅ **简化配置**: 移除 `default = true/false` 字段，采用更简洁的配置方式
- ✅ **向后兼容**: 现有配置文件继续有效，系统自动忽略遗留的 `default` 字段
- ✅ **SSR 兼容**: 安全处理服务端渲染，避免 hydration 问题

**API 优化**:
- ✅ 统一认证响应：`/api/auth/verify` 现在返回用户信息 + 文件配置 + 目录列表
- ✅ 减少网络请求：从多个独立请求优化为单一请求
- ✅ 提升用户体验：更快的应用启动和配置加载

---

### 3. 文件浏览模块 ✅ (已实现)

**功能描述**: 展示服务器指定目录的文件和文件夹列表，提供现代化的文件管理界面

**实现方案**:
- **后端**: 
  - ✅ 使用 `std::fs` 读取目录内容
  - ✅ 返回文件信息：名称、路径、大小、修改时间、类型、文件夹项目数量
  - ✅ 支持RESTful路径导航 (`/api/files/list/{path}`)
  - ✅ 权限控制：只允许访问配置的根目录及其子目录
  - ✅ 路径安全检查，防止目录遍历攻击
  - ✅ 文件按类型排序（文件夹优先）
- **前端**:
  - ✅ 现代化文件管理界面，采用简洁的列表视图设计
  - ✅ 文件类型图标识别（文件夹/文件）
  - ✅ 文件大小智能格式化 (B/KB/MB/GB/TB)
  - ✅ 响应式设计，移动端自动隐藏侧边栏
  - ✅ 实时搜索和过滤功能
  - ✅ TanStack Query 缓存管理
  - ✅ 加载状态和错误处理
  - ✅ 存储空间信息实时显示
  - ✅ **README.md 自动渲染**: 类似 GitHub 的 Markdown 预览功能 ✨

**UI 设计特性**:
- ✅ 侧边栏导航设计
- ✅ 工具栏（搜索、上传功能）
- ✅ 面包屑导航
- ✅ 简洁的列表项设计
- ✅ 悬浮交互效果
- ✅ 存储空间进度条
- ✅ 空状态友好提示
- ✅ 文件操作下拉菜单（Radix UI）
- ✅ Toast通知系统（Sonner）
- ✅ 心跳动画效果（删除警告）
- ✅ 一致的菜单定位（列表项右侧）

**API 接口** (目录化统一 API):
```
GET /api/files/{directory_id}/list              # 获取指定目录的文件列表
GET /api/files/{directory_id}/list/{path}       # 获取指定目录中指定路径的文件列表
GET /api/files/{directory_id}/storage           # 获取指定目录的存储空间信息
GET /api/files/{directory_id}/show/{path}       # ✨ 预览 Markdown 文件内容（README 渲染）

Response: {
  "success": true,
  "files": [
    {
      "name": "documents",
      "path": "documents", 
      "file_type": "folder",
      "size": null,
      "modified": "2025-07-25",
      "items": 12
    },
    {
      "name": "report.pdf",
      "path": "report.pdf",
      "file_type": "file", 
      "size": 2048576,
      "modified": "2025-07-25",
      "items": null
    }
  ],
  "current_path": "",
  "message": null
}
```

---

### 4. 文件上传模块 ✅ (已实现)

**功能描述**: 支持单文件和多文件上传到服务器

**实现方案**:
- **后端**:
  - ✅ 使用 `axum::extract::Multipart` 处理文件上传
  - ✅ 文件大小限制和类型验证（通过config.toml配置）
  - ✅ 自动处理文件名冲突（UUID重命名策略）
  - ✅ 分片上传支持大文件（>10MB自动分片）
  - ✅ 支持子目录上传（路径感知）
  - ✅ 目录化上传：所有上传操作指定目标存储目录
- **前端**:
  - ✅ 现代化上传抽屉界面（UploadDrawer）
  - ✅ 拖拽上传支持（react-dropzone）
  - ✅ 实时上传进度显示
  - ✅ 批量文件选择（最多20个文件）
  - ✅ 上传管理：暂停、取消、重试
  - ✅ 智能分片上传（1MB分片，3并发）
  - ✅ 浮动上传指示器（UploadIndicator）
  - ✅ 自动抽屉关闭：上传完成后自动关闭上传界面

**API 接口** (目录化统一 API):
```
POST /api/upload/dir/{directory_id}/simple    # 简单文件上传到指定目录
# 分片上传功能集成在 simple 端点中，根据文件大小自动处理
```

**上传功能增强**:
- ✅ **智能上传检测**: 自动判断文件大小，>10MB 使用分片上传
- ✅ **分片上传优化**: 1MB 分片大小，最多 3 个并发上传
- ✅ **进度跟踪**: 实时显示上传进度、速度和 ETA
- ✅ **错误恢复**: 每个分片最多 3 次重试机制
- ✅ **目录感知**: 所有上传操作明确指定目标存储目录

---

### 5. 文件下载模块 ✅ (已实现)

**功能描述**: 提供文件下载功能，支持直接下载和链接分享

**实现方案**:
- **后端**:
  - ✅ 使用 `tokio-util::io::ReaderStream` 流式下载
  - ✅ 设置正确的 Content-Type 和 Content-Disposition 头
  - ✅ 支持所有文件类型下载
  - ✅ 无需认证的下载链接（便于分享）
  - ✅ 路径安全验证和权限控制
- **前端**:
  - ✅ 集成在文件操作下拉菜单中
  - ✅ 直接下载功能（点击即下载）
  - ✅ 复制下载链接到剪贴板
  - ✅ Toast通知反馈（成功/失败提示）
  - ✅ 剪贴板API支持检测

**API 接口**:
```
GET /api/files/download/{path}   # 无需认证的文件下载
Content-Disposition: attachment; filename="..."
Content-Type: application/octet-stream
```

---

### 6. 文件操作模块 ✅ (已实现)

**功能描述**: 文件和文件夹的删除、创建操作

#### 6.1 文件重命名 ✅ (已实现)
**实现方案**:
- **后端**: ✅ 使用 `std::fs::rename` 进行文件重命名
- **前端**: ✅ 重命名对话框（RenameDialog）
- **验证**: ✅ 文件名验证（非法字符、系统保留名、冲突检查）
- **安全特性**: ✅ 路径安全检查和权限控制
- **用户体验**: ✅ 实时错误提示和输入验证
- **UI集成**: ✅ 集成在文件操作下拉菜单

#### 6.2 文件删除 ✅ (已实现)
**实现方案**:
- **后端**: ✅ 使用 `std::fs::remove_file` 和 `std::fs::remove_dir_all`
- **前端**: ✅ 删除确认对话框（DeleteConfirmDialog）
- **安全特性**: ✅ 非空文件夹需要输入名称确认
- **动画效果**: ✅ 心跳动画警告图标
- **UI优化**: ✅ 集成在文件操作下拉菜单

#### 6.3 新建文件夹 ✅ (已实现)
**实现方案**:
- **后端**: ✅ 使用 `std::fs::create_dir_all`
- **前端**: ✅ 新建文件夹对话框（CreateDirectoryDialog）
- **验证**: ✅ 目录名验证（非法字符、保留名检查）
- **用户体验**: ✅ 实时错误提示和输入验证

**API 接口** (目录化统一 API):
```
DELETE /api/files/dir/{directory_id}/delete/{path}    # 删除指定目录中的文件或文件夹
POST /api/files/dir/{directory_id}/mkdir/{path}       # 在指定目录中创建新文件夹
PUT /api/files/dir/{directory_id}/rename/{path}       # 重命名指定目录中的文件或文件夹
Body: { "new_name": "新文件名" }

Response: {
  "success": true,
  "message": "重命名成功"
}

# 错误响应（409 Conflict）:
{
  "success": false,
  "message": "目标文件名已存在"
}
```

---

### 7. README 渲染模块 ✅ (已实现)

**功能描述**: 类似 GitHub 的 README.md 自动检测和渲染功能，为文件目录提供美观的文档展示

**实现方案**:
- **后端**:
  - ✅ 智能文件检测：自动检测目录中的 README.md、readme.md、Readme.md、ReadMe.md
  - ✅ 文件类型验证：仅支持 .md 扩展名的文件
  - ✅ 安全读取：路径验证和权限检查
  - ✅ RESTful API：`GET /api/files/{directory_id}/show/{file_path}`
- **前端**:
  - ✅ 动态加载：使用 CDN 动态加载 markdown-it 库，不增加打包体积
  - ✅ 智能检测：自动扫描文件列表中的 README 文件
  - ✅ 缓存机制：markdown-it 实例缓存，避免重复加载
  - ✅ 错误处理：加载失败时降级为纯文本显示
  - ✅ 响应式设计：适配桌面和移动设备

**UI 设计特性**:
- ✅ **GitHub 风格**: 模仿 GitHub 的 README 渲染效果
- ✅ **Typography 优化**: 使用 @tailwindcss/typography + 自定义样式
- ✅ **行距优化**: 调整段落、标题、列表间距，提升阅读体验
- ✅ **标题装饰**: H1/H2 标题添加底部边框线，符合 GitHub 设计规范
- ✅ **主题适配**: 自动适配亮色/暗色主题
- ✅ **位置优化**: README 内容显示在文件列表下方，保持自然的浏览流程

**技术特性**:
- ✅ **零打包体积**: markdown-it 通过 CDN 动态加载
- ✅ **类型安全**: 完整的 TypeScript 类型定义
- ✅ **性能优化**: TanStack Query 缓存和错误处理
- ✅ **代码规范**: 通过 Biome 代码检查，符合项目规范

**API 接口**:
```
GET /api/files/{directory_id}/show/{file_path}

Response:
{
  "success": true,
  "content": "# README 内容...",
  "message": null
}

Error Response:
{
  "success": false,
  "content": null,
  "message": "文件不存在"
}
```

**支持的文件格式**:
- ✅ README.md / readme.md / Readme.md / ReadMe.md
- ✅ 任意 .md 扩展名的 Markdown 文件
- ✅ 完整的 Markdown 语法支持（标题、列表、链接、代码块等）

---

### 8. 文件搜索模块 🔮 (未来功能)

**功能描述**: 在指定目录中搜索文件

**实现方案**:
- **后端**: 
  - 使用 `walkdir` 库递归搜索
  - 支持文件名模糊匹配
  - 支持文件类型过滤
- **前端**: 搜索框 + 实时搜索结果

---

### 9. 文件预览模块 ✅ (已完成 - 多格式支持)

**功能描述**: 支持多种文件类型的在线预览，包括 Markdown、PDF、图片和代码文件

**实现方案**:
- **Markdown 预览** ✅:
  - ✅ 点击文件自动导航到预览页面
  - ✅ 全屏 Markdown 渲染界面，使用动态 CDN 加载 markdown-it
  - ✅ GitHub 风格样式和 Typography 优化
  - ✅ 完整的导航工具栏（返回、下载、复制链接）
  - ✅ 响应式设计，适配桌面和移动设备
  - ✅ 支持 HTML、换行符转换和自动链接识别

- **PDF 预览** ✅ (新增):
  - ✅ **完整的 PDF 阅读器**: 基于 PDF.js 3.11.174 的专业级 PDF 预览
  - ✅ **交互式控制**:
    - 页面导航（前一页/后一页按钮）
    - 缩放控制（50%-300% 范围，25% 步进）
    - 直接页码输入和快速跳转
    - 页面数量显示和进度指示
  - ✅ **性能优化**:
    - Canvas 高质量渲染
    - ArrayBuffer 数据缓存，使用普通数组存储防止分离问题
    - 高效的内存管理和错误处理
  - ✅ **用户界面**:
    - 粘性工具栏，固定在顶部便于操作
    - 自适应画布大小，支持不同屏幕尺寸
    - 多页 PDF 的快速跳转按钮（超过 5 页时显示）

- **图片预览** ✅:
  - ✅ 直接图片展示，保持原始宽高比
  - ✅ 支持格式：JPG, JPEG, PNG, GIF, BMP, WebP, SVG
  - ✅ 集成下载和分享功能

- **代码预览** ✅:
  - ✅ Prism.js 语法高亮集成
  - ✅ 广泛语言支持：JavaScript、TypeScript、Python、Rust、Go、Java、PHP、Ruby、Swift、Shell、HTML、CSS、JSON、XML、YAML、SQL 等
  - ✅ 专业代码展示，带行号和颜色标记

- **通用特性** ✅:
  - ✅ **公开预览**: 所有预览功能无需认证，支持直接分享预览链接
  - ✅ **统一界面**: 一致的预览界面设计和交互体验
  - ✅ **路由设计**: `/files/preview/{directory_id}/{file_path}` 预览路由
  - ✅ **错误处理**: 不支持的文件类型显示友好提示界面
  - ✅ **加载状态**: 所有预览类型都有优雅的加载动画

**API 接口**:
```
GET /api/files/{directory_id}/show/{file_path}      # 获取文本文件内容（Markdown/代码预览）
GET /api/files/{directory_id}/download/{file_path}  # 获取二进制文件内容（PDF/图片预览）
```

**技术实现细节**:
- ✅ **组件化架构**: 模块化预览组件设计
  - `MarkdownPreview.tsx` - Markdown 渲染组件
  - `PDFPreview.tsx` - PDF 预览组件，完整的阅读器功能
  - `ImagePreview.tsx` - 图片预览组件
  - `CodePreview.tsx` - 代码语法高亮组件
  - `UnsupportedFilePreview.tsx` - 不支持格式的回退组件
- ✅ **动态库加载**: PDF.js 和 markdown-it 通过 CDN 加载，不增加打包体积
- ✅ **文件类型检测**: 基于文件扩展名的智能类型识别
- ✅ **数据处理优化**: PDF 使用纯数组存储避免 ArrayBuffer 分离问题

---

## 技术实现架构

### 后端技术栈
- **Web 框架**: Axum (异步高性能)
- **文件处理**: std::fs + tokio::fs (异步文件操作)
- **认证**: jsonwebtoken + bcrypt
- **配置**: serde + toml
- **错误处理**: anyhow + 自定义错误类型

### 前端技术栈
- **UI 框架**: React 19 + TypeScript
- **路由**: @tanstack/react-router (File-Based Routing)
- **状态管理**: React Context API + TanStack Query
- **数据请求**: TanStack Query (React Query) - 服务器状态管理
- **样式系统**: TailwindCSS 4.x + shadcn/ui 组件库
- **构建工具**: Rsbuild (替代 Webpack/Vite)
- **文件上传**: 原生 FormData + fetch
- **包管理器**: Bun (快速依赖安装和构建)

**样式系统特性**:
- ✅ TailwindCSS 4.x 最新特性支持
- ✅ CSS 变量系统集成
- ✅ 深色模式自动切换
- ✅ shadcn/ui 组件库完整集成
- ✅ 响应式设计支持

### 目录结构规划
```
src/backend/
├── mod.rs           # 模块导出 ✅
├── auth.rs          # 认证模块 ✅
├── files.rs         # 文件操作模块 ✅ (浏览、存储信息)
├── upload.rs        # 文件上传模块 ✅
├── download.rs      # 文件下载模块 ✅ (集成在files.rs)
└── config.rs        # 配置管理 ✅

src/frontend/
├── api/                   # API 调用和错误处理
│   ├── auth.ts            ✅ (认证 API)
│   ├── files.ts           ✅ (文件管理 API)
│   ├── upload.ts          ✅ (文件上传 API)
│   └── chunkedUpload.ts   ✅ (分片上传 API)
├── utils/                 # 工具函数
│   ├── download.ts        ✅ (下载工具函数)
│   ├── markdown.ts        ✅ (动态 markdown-it 加载工具)
│   └── pdf.ts             ✅ (PDF.js 加载和渲染工具)
├── types/                 # TypeScript 类型定义
│   ├── auth.ts            ✅ (认证相关类型)
│   └── files.ts           ✅ (文件管理类型)
├── routes/                # File-Based Routing
│   ├── __root.tsx         ✅ (根布局 + Query Provider)
│   ├── index.tsx          ✅ (首页重定向)
│   ├── login.tsx          ✅ (登录页面)
│   ├── files.tsx          ✅ (文件管理页面)
│   └── files.preview.$directoryId.$.tsx ✅ (文件预览路由)
├── hooks/                 # React Hooks
│   ├── useAuth.ts         ✅ (认证 Hook)
│   ├── useAuthQueries.ts  ✅ (认证 TanStack Query Hooks)
│   └── useFiles.ts        ✅ (文件管理 TanStack Query Hooks)
├── components/
│   ├── ui/                    # shadcn/ui 组件库
│   │   ├── button.tsx         ✅ (按钮组件)
│   │   ├── input.tsx          ✅ (输入框组件)
│   │   ├── dialog.tsx         ✅ (对话框组件)
│   │   └── dropdown-menu.tsx  ✅ (下拉菜单组件)
│   ├── LoginForm.tsx          ✅ (登录表单)
│   ├── FilesArea.tsx             ✅ (文件管理主组件)
│   ├── UploadDrawer.tsx       ✅ (上传抽屉组件)
│   ├── UploadIndicator.tsx    ✅ (上传指示器)
│   ├── CreateDirectoryDialog.tsx ✅ (创建文件夹对话框)
│   ├── DeleteConfirmDialog.tsx   ✅ (删除确认对话框)
│   ├── RenameDialog.tsx          ✅ (文件重命名对话框)
│   ├── MarkdownRenderer.tsx      ✅ (Markdown 内容渲染组件)
│   ├── FilePreview.tsx           ✅ (文件预览主组件)
│   ├── preview/                  ✅ (预览组件模块)
│   │   ├── index.ts              ✅ (预览组件导出)
│   │   ├── MarkdownPreview.tsx   ✅ (Markdown 预览组件)
│   │   ├── PDFPreview.tsx        ✅ (PDF 预览组件)
│   │   ├── ImagePreview.tsx      ✅ (图片预览组件)
│   │   ├── CodePreview.tsx       ✅ (代码预览组件)
│   │   └── UnsupportedFilePreview.tsx ✅ (不支持格式回退组件)
│   └── FileOperations.tsx        ✅ (文件操作菜单 - 集成在主组件)
```

---

## 配置文件设计

### config.toml (更新为多目录支持)
```toml
[server]
host = "0.0.0.0"
port = 3330

[jwt]
secret_key = "your-secret-key"
expiration_hours = 24

[user]
username = "admin"
password_hash = "$2b$12$..."
email = "admin@storkitty.com"

[files]
# 单文件上传大小限制 (MB)
max_file_size = 100
# 允许的文件类型 (空表示允许所有)
allowed_extensions = []
# 禁止的文件类型
blocked_extensions = [".exe", ".bat", ".sh"]

[security]
# 是否允许创建文件夹
allow_mkdir = true
# 是否允许删除文件
allow_delete = true
# 是否允许下载文件
allow_download = true

# 多目录存储配置 ✅ (新增)
[[storage.directories]]
id = "uploads"
name = "My Files"
description = "Personal file storage"
icon = "hard-drive"
storage_type = "local"
path = "./uploads"

[[storage.directories]]
id = "documents"
name = "Documents"
description = "Document storage area"
icon = "file-text"
storage_type = "local"
path = "./documents"

[[storage.directories]]
id = "media"
name = "Media Files"
description = "Photos, videos, and media"
icon = "image"
storage_type = "local"
path = "./media"
```

---

## 开发优先级

### 第一阶段 (MVP) ✅ 已完成
1. ✅ 用户认证系统
2. ✅ 文件浏览功能
3. ✅ 文件上传功能
4. ✅ 文件下载功能

### 第二阶段 ✅ 已完成
1. ✅ 文件操作 (删除功能)
2. ✅ 新建文件夹功能
3. ✅ 文件重命名功能
4. 🔄 批量操作支持

### 第三阶段 ✅ 已完成 (多目录与性能优化)
1. ✅ **多目录存储系统**: 支持配置多个独立存储目录
2. ✅ **API 性能优化**: 统一认证响应，减少网络请求
3. ✅ **智能上传系统**: 自动分片上传，并发控制和错误恢复
4. ✅ **目录化 API**: 所有文件操作统一使用目录化端点

### 第四阶段 ✅ 已完成 (E2E 测试框架)
1. ✅ **E2E 测试框架**: 基于 Playwright + TypeScript 的端到端测试系统
2. ✅ **全面测试覆盖**: 用户认证、文件管理、多目录存储、UI 交互测试
3. ✅ **多目录操作测试**: 专门的多目录文件管理流程测试用例
4. ✅ **测试工具链**: 测试助手、数据工厂、全局设置和清理
5. ✅ **上传抽屉优化**: 修复并优化上传界面自动关闭逻辑
6. ✅ **CI/CD 支持**: 适配持续集成的测试配置和报告生成

### 第五阶段 ✅ 已完成 (README 渲染功能)
1. ✅ **README.md 自动检测**: 智能检测目录中的 README.md、readme.md 等文件
2. ✅ **Markdown 渲染引擎**: 动态 CDN 加载 markdown-it，不增加打包体积
3. ✅ **GitHub 风格样式**: 使用 @tailwindcss/typography + 自定义样式优化
4. ✅ **RESTful API 设计**: `/api/files/{directory_id}/show/{file_path}` 端点
5. ✅ **UI 集成优化**: README 内容显示在文件列表下方，保持流畅体验

### 第六阶段 ✅ 已完成 (文件预览系统)
1. ✅ **完整文件预览系统**: 支持 Markdown、PDF、图片、代码文件的专业级预览功能
2. ✅ **PDF 阅读器**: 基于 PDF.js 的功能完整的 PDF 预览，包含页面导航、缩放控制、页码跳转
3. ✅ **代码语法高亮**: Prism.js 集成，支持 20+ 编程语言的语法高亮显示
4. ✅ **统一预览界面**: 一致的用户体验和响应式设计
5. ✅ **性能优化**: 动态 CDN 加载，ArrayBuffer 分离问题解决方案

### 第七阶段 (未来功能)
1. 🔮 文件搜索
2. 🔮 访问日志记录
3. 🔮 多用户权限管理
4. 🔮 云存储支持 (S3, 阿里云 OSS 等)
5. 🔮 音视频预览 (HTML5 播放器)

---

## 状态说明
- ✅ 已完成
- 🔄 开发中/规划中  
- 🔮 未来功能