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

**功能描述**: 提供安全的用户登录和会话管理

**实现方案**:
- **后端**: JWT token 认证 + bcrypt 密码哈希
- **前端**: React Context 状态管理 + localStorage 持久化
- **配置**: TOML 文件存储用户凭据
- **安全**: 自动 token 验证和路由保护

**UI 设计**:
- ✅ 现代化登录界面
- ✅ 基于 shadcn/ui 设计系统
- ✅ TailwindCSS 4.x 样式系统
- ✅ 响应式布局设计
- ✅ 暗色主题支持
- ✅ 用户体验优化（去除焦点边框，简化交互）
- ✅ 演示账号信息显示

**API 接口**:
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/verify` - token 验证 + 系统配置信息（用户信息、文件配置、存储目录列表）

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
- **前端**:
  - ✅ 现代化目录选择界面，侧边栏显示所有可用目录
  - ✅ 目录图标和描述的直观展示
  - ✅ 无缝的目录切换体验
  - ✅ 认证上下文集成目录信息，减少网络请求

**配置示例**:
```toml
[[storage_directories]]
id = "uploads"
name = "My Files"
description = "Personal file storage"
icon = "hard-drive"
storage_type = "local"
path = "./uploads"
default = true

[[storage_directories]]
id = "documents"
name = "Documents"
description = "Document storage area"
icon = "file-text"
storage_type = "local"
path = "./documents"
default = false
```

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
  - ✅ 现代化文件管理界面，支持网格和列表两种视图模式
  - ✅ 文件类型图标识别（文件夹/文件）
  - ✅ 文件大小智能格式化 (B/KB/MB/GB/TB)
  - ✅ 响应式设计，移动端自动隐藏侧边栏
  - ✅ 实时搜索和过滤功能
  - ✅ TanStack Query 缓存管理
  - ✅ 加载状态和错误处理
  - ✅ 存储空间信息实时显示

**UI 设计特性**:
- ✅ 侧边栏导航设计
- ✅ 工具栏（搜索、上传、视图切换）
- ✅ 面包屑导航
- ✅ 紧凑的文件卡片设计
- ✅ 悬浮交互效果
- ✅ 存储空间进度条
- ✅ 空状态友好提示
- ✅ 文件操作下拉菜单（Radix UI）
- ✅ Toast通知系统（Sonner）
- ✅ 心跳动画效果（删除警告）
- ✅ 智能菜单定位（网格模式右下展开）

**API 接口** (目录化统一 API):
```
GET /api/files/dir/{directory_id}/list              # 获取指定目录的文件列表
GET /api/files/dir/{directory_id}/list/{path}       # 获取指定目录中指定路径的文件列表
GET /api/files/dir/{directory_id}/storage           # 获取指定目录的存储空间信息

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

### 7. 文件搜索模块 🔮 (未来功能)

**功能描述**: 在指定目录中搜索文件

**实现方案**:
- **后端**: 
  - 使用 `walkdir` 库递归搜索
  - 支持文件名模糊匹配
  - 支持文件类型过滤
- **前端**: 搜索框 + 实时搜索结果

---

### 8. 文件预览模块 🔮 (未来功能)

**功能描述**: 支持常见文件类型的在线预览

**实现方案**:
- **图片**: 直接显示缩略图和原图
- **文本**: 语法高亮显示
- **PDF**: 使用 PDF.js 预览
- **音视频**: HTML5 播放器

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
│   └── download.ts        ✅ (下载工具函数)
├── types/                 # TypeScript 类型定义
│   ├── auth.ts            ✅ (认证相关类型)
│   └── files.ts           ✅ (文件管理类型)
├── routes/                # File-Based Routing
│   ├── __root.tsx         ✅ (根布局 + Query Provider)
│   ├── index.tsx          ✅ (首页重定向)
│   ├── login.tsx          ✅ (登录页面)
│   └── files.tsx          ✅ (文件管理页面)
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
│   ├── FilesPageComponent.tsx ✅ (文件管理主组件)
│   ├── UploadDrawer.tsx       ✅ (上传抽屉组件)
│   ├── UploadIndicator.tsx    ✅ (上传指示器)
│   ├── CreateDirectoryDialog.tsx ✅ (创建文件夹对话框)
│   ├── DeleteConfirmDialog.tsx   ✅ (删除确认对话框)
│   ├── RenameDialog.tsx          ✅ (文件重命名对话框)
│   ├── FilePreview.tsx        🔮 (文件预览组件)
│   └── FileOperations.tsx     ✅ (文件操作菜单 - 集成在主组件)
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
[[storage_directories]]
id = "uploads"
name = "My Files"
description = "Personal file storage"
icon = "hard-drive"
storage_type = "local"
path = "./uploads"
default = true

[[storage_directories]]
id = "documents"
name = "Documents"
description = "Document storage area"
icon = "file-text"
storage_type = "local"
path = "./documents"
default = false

[[storage_directories]]
id = "media"
name = "Media Files"
description = "Photos, videos, and media"
icon = "image"
storage_type = "local"
path = "./media"
default = false
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
3. ✅ **测试工具链**: 测试助手、数据工厂、全局设置和清理
4. ✅ **CI/CD 支持**: 适配持续集成的测试配置和报告生成

### 第五阶段 (增强功能)
1. 🔮 文件搜索
2. 🔮 文件预览
3. 🔮 访问日志记录
4. 🔮 多用户权限管理
5. 🔮 云存储支持 (S3, 阿里云 OSS 等)

---

## 状态说明
- ✅ 已完成
- 🔄 开发中/规划中  
- 🔮 未来功能