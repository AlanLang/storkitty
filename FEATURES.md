# Storkitty 项目功能规划文档

## 项目概述

**Storkitty** 是一个轻量级的无数据库文件管理系统，基于 Rust + React 技术栈开发。系统提供 Web 界面来管理服务器端文件，支持常见的文件操作功能。

### 核心特性
- 🔐 **安全认证**: JWT-based 用户登录系统
- 📁 **文件管理**: 完整的文件 CRUD 操作
- 🚀 **无数据库**: 基于文件系统和配置文件，部署简单
- 🎨 **现代界面**: React + TypeScript 响应式前端
- ⚡ **高性能**: Rust Axum 后端，异步处理
- 📦 **快速构建**: Bun 包管理器，极速依赖安装

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
- `POST /api/auth/verify` - token 验证

**前端技术栈升级**:
- ✅ React 19 + TypeScript
- ✅ TanStack Router（文件路由系统）
- ✅ TanStack Query（服务器状态管理）
- ✅ TailwindCSS 4.x（最新样式系统）
- ✅ shadcn/ui 组件库集成
- ✅ Rsbuild 构建工具

---

### 2. 文件浏览模块 ✅ (已实现)

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

**API 接口**:
```
GET /api/files/list           # 获取根目录文件列表
GET /api/files/list/{path}    # 获取指定路径文件列表
GET /api/files/storage        # 获取存储空间信息

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

### 3. 文件上传模块 🔄 (规划中)

**功能描述**: 支持单文件和多文件上传到服务器

**实现方案**:
- **后端**:
  - 使用 `axum::extract::Multipart` 处理文件上传
  - 文件大小限制和类型验证
  - 自动处理文件名冲突（重命名策略）
  - 上传进度支持
- **前端**:
  - 拖拽上传界面
  - 上传进度条显示
  - 批量文件选择
  - 上传预览和取消功能

**API 接口**:
```
POST /api/files/upload
Content-Type: multipart/form-data
Form fields: 
  - files: File[]
  - path: string (目标路径)
```

---

### 4. 文件下载模块 🔄 (规划中)

**功能描述**: 提供文件下载功能，支持单文件下载

**实现方案**:
- **后端**:
  - 使用 `tower-http::services::ServeFile` 流式下载
  - 设置正确的 Content-Type 和 Content-Disposition
  - 支持断点续传（Range requests）
  - 下载权限验证
- **前端**:
  - 直接链接下载
  - 下载进度显示（大文件）
  - 右键菜单集成

**API 接口**:
```
GET /api/files/download?path={file_path}
Headers: 
  - Authorization: Bearer {token}
```

---

### 5. 文件操作模块 🔄 (规划中)

**功能描述**: 文件和文件夹的移动、重命名、删除操作

#### 5.1 文件移动/重命名
**实现方案**:
- **后端**: 使用 `std::fs::rename` 进行文件移动
- **前端**: 拖拽操作 + 重命名对话框

#### 5.2 文件删除
**实现方案**:
- **后端**: 使用 `std::fs::remove_file` 和 `std::fs::remove_dir_all`
- **前端**: 删除确认对话框 + 批量删除支持

#### 5.3 新建文件夹
**实现方案**:
- **后端**: 使用 `std::fs::create_dir_all`
- **前端**: 新建文件夹对话框

**API 接口**:
```
PUT /api/files/move
Body: { "from": "/path/old", "to": "/path/new" }

DELETE /api/files?path={file_or_dir_path}

POST /api/files/mkdir
Body: { "path": "/path/new_folder" }
```

---

### 6. 文件搜索模块 🔮 (未来功能)

**功能描述**: 在指定目录中搜索文件

**实现方案**:
- **后端**: 
  - 使用 `walkdir` 库递归搜索
  - 支持文件名模糊匹配
  - 支持文件类型过滤
- **前端**: 搜索框 + 实时搜索结果

---

### 7. 文件预览模块 🔮 (未来功能)

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
├── upload.rs        # 文件上传模块 🔄
├── download.rs      # 文件下载模块 🔄
└── config.rs        # 配置管理 ✅

src/frontend/
├── api/                   # API 调用和错误处理
│   ├── auth.ts            ✅ (认证 API)
│   └── files.ts           ✅ (文件管理 API)
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
│   ├── LoginForm.tsx      ✅ (登录表单)
│   ├── FileList.tsx       🔄 (文件列表组件 - 集成在 files.tsx)
│   ├── FileUpload.tsx     🔄 (文件上传组件)
│   ├── FilePreview.tsx    🔮 (文件预览组件)
│   └── FileOperations.tsx 🔄 (文件操作组件)
```

---

## 配置文件设计

### config/server.toml (新增)
```toml
[server]
host = "0.0.0.0"
port = 3330

[files]
# 文件管理根目录
root_directory = "./uploads"
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
```

---

## 开发优先级

### 第一阶段 (MVP)
1. ✅ 用户认证系统
2. ✅ 文件浏览功能
3. 🔄 文件上传功能
4. 🔄 文件下载功能

### 第二阶段
1. 🔄 文件操作 (移动/删除/重命名)
2. 🔄 新建文件夹功能
3. 🔄 批量操作支持

### 第三阶段 (增强功能)
1. 🔮 文件搜索
2. 🔮 文件预览
3. 🔮 访问日志记录
4. 🔮 多用户权限管理

---

## 状态说明
- ✅ 已完成
- 🔄 开发中/规划中  
- 🔮 未来功能