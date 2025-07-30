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
- ✅ 文件操作下拉菜单（Radix UI）
- ✅ Toast通知系统（Sonner）
- ✅ 心跳动画效果（删除警告）
- ✅ 智能菜单定位（网格模式右下展开）

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

### 3. 文件上传模块 ✅ (已实现)

**功能描述**: 支持单文件和多文件上传到服务器

**实现方案**:
- **后端**:
  - ✅ 使用 `axum::extract::Multipart` 处理文件上传
  - ✅ 文件大小限制和类型验证（通过config.toml配置）
  - ✅ 自动处理文件名冲突（UUID重命名策略）
  - ✅ 分片上传支持大文件（>10MB自动分片）
  - ✅ 支持子目录上传（路径感知）
- **前端**:
  - ✅ 现代化上传抽屉界面（UploadDrawer）
  - ✅ 拖拽上传支持（react-dropzone）
  - ✅ 实时上传进度显示
  - ✅ 批量文件选择（最多20个文件）
  - ✅ 上传管理：暂停、取消、重试
  - ✅ 智能分片上传（1MB分片，3并发）
  - ✅ 浮动上传指示器（UploadIndicator）

**API 接口**:
```
POST /api/upload/simple          # 简单文件上传
POST /api/upload/chunked/init    # 分片上传初始化
POST /api/upload/chunked/chunk   # 分片数据上传
POST /api/upload/chunked/finish  # 分片上传完成
```

---

### 4. 文件下载模块 ✅ (已实现)

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

### 5. 文件操作模块 ✅ (已实现)

**功能描述**: 文件和文件夹的删除、创建操作

#### 5.1 文件重命名 ✅ (已实现)
**实现方案**:
- **后端**: ✅ 使用 `std::fs::rename` 进行文件重命名
- **前端**: ✅ 重命名对话框（RenameDialog）
- **验证**: ✅ 文件名验证（非法字符、系统保留名、冲突检查）
- **安全特性**: ✅ 路径安全检查和权限控制
- **用户体验**: ✅ 实时错误提示和输入验证
- **UI集成**: ✅ 集成在文件操作下拉菜单

#### 5.2 文件删除 ✅ (已实现)
**实现方案**:
- **后端**: ✅ 使用 `std::fs::remove_file` 和 `std::fs::remove_dir_all`
- **前端**: ✅ 删除确认对话框（DeleteConfirmDialog）
- **安全特性**: ✅ 非空文件夹需要输入名称确认
- **动画效果**: ✅ 心跳动画警告图标
- **UI优化**: ✅ 集成在文件操作下拉菜单

#### 5.3 新建文件夹 ✅ (已实现)
**实现方案**:
- **后端**: ✅ 使用 `std::fs::create_dir_all`
- **前端**: ✅ 新建文件夹对话框（CreateDirectoryDialog）
- **验证**: ✅ 目录名验证（非法字符、保留名检查）
- **用户体验**: ✅ 实时错误提示和输入验证

**API 接口**:
```
DELETE /api/files/delete/{path}    # 删除文件或文件夹
POST /api/files/mkdir/{path}       # 创建新文件夹
PUT /api/files/rename/{path}       # 重命名文件或文件夹
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