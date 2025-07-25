# Storkitty 项目功能规划文档

## 项目概述

**Storkitty** 是一个轻量级的无数据库文件管理系统，基于 Rust + React 技术栈开发。系统提供 Web 界面来管理服务器端文件，支持常见的文件操作功能。

### 核心特性
- 🔐 **安全认证**: JWT-based 用户登录系统
- 📁 **文件管理**: 完整的文件 CRUD 操作
- 🚀 **无数据库**: 基于文件系统和配置文件，部署简单
- 🎨 **现代界面**: React + TypeScript 响应式前端
- ⚡ **高性能**: Rust Axum 后端，异步处理

---

## 功能模块设计

### 1. 用户认证模块 ✅ (已实现)

**功能描述**: 提供安全的用户登录和会话管理

**实现方案**:
- **后端**: JWT token 认证 + bcrypt 密码哈希
- **前端**: React Context 状态管理 + localStorage 持久化
- **配置**: TOML 文件存储用户凭据
- **安全**: 自动 token 验证和路由保护

**API 接口**:
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/verify` - token 验证

---

### 2. 文件浏览模块 🔄 (规划中)

**功能描述**: 展示服务器指定目录的文件和文件夹列表

**实现方案**:
- **后端**: 
  - 使用 `std::fs` 读取目录内容
  - 返回文件信息：名称、大小、修改时间、类型
  - 支持路径导航和面包屑
  - 权限控制：只允许访问配置的根目录及其子目录
- **前端**:
  - 表格或卡片式文件列表展示
  - 文件类型图标识别
  - 文件大小友好格式化
  - 支持排序（按名称、大小、时间）

**API 接口**:
```
GET /api/files?path={directory_path}
Response: {
  "current_path": "/uploads",
  "parent_path": "/",
  "items": [
    {
      "name": "document.pdf",
      "type": "file",
      "size": 1024000,
      "modified": "2024-01-01T12:00:00Z"
    }
  ]
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
- **路由**: @tanstack/react-router
- **状态管理**: React Context API
- **文件上传**: 原生 FormData + fetch
- **UI 组件**: 自定义组件（保持轻量）

### 目录结构规划
```
src/backend/
├── auth.rs          # 认证模块 ✅
├── files.rs         # 文件操作模块 🔄
├── upload.rs        # 文件上传模块 🔄
├── download.rs      # 文件下载模块 🔄
└── config.rs        # 配置管理 ✅

src/frontend/
├── pages/
│   ├── LoginPage.tsx      ✅
│   ├── DashboardPage.tsx  ✅
│   └── FilePage.tsx       🔄
├── components/
│   ├── FileList.tsx       🔄
│   ├── FileUpload.tsx     🔄
│   ├── FilePreview.tsx    🔮
│   └── FileOperations.tsx 🔄
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
2. 🔄 文件浏览功能
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