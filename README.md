# Storkitty 文件管理系统

一个基于 Rust 和 React 的现代化文件管理系统，提供安全的用户认证和直观的文件管理界面。

## 功能特性

### 用户认证系统
- 安全的 JWT Token 认证
- 用户登录/登出功能
- 会话状态管理
- 演示账号支持（用户名: admin, 密码: admin123）

### 前端界面
- 现代化的登录界面设计
- 响应式布局设计
- 基于 shadcn/ui 的组件系统
- TailwindCSS 4.x 样式系统
- 深色模式支持

### 技术架构
- **后端**: Rust + Actix-web
- **前端**: React 19 + TypeScript
- **路由**: TanStack Router
- **状态管理**: TanStack Query
- **样式**: TailwindCSS 4.x + shadcn/ui
- **构建工具**: Rsbuild
- **包管理**: Bun

## 快速开始

### 环境要求
- Rust 1.70+
- Node.js 18+
- Bun（推荐）或 npm

### 安装依赖
```bash
# 安装前端依赖
bun install

# 或使用 npm
npm install
```

### 开发模式
```bash
# 启动前端开发服务器
bun run dev

# 启动后端服务器（另一个终端）
cargo run
```

### 生产构建
```bash
# 构建前端
bun run build

# 构建后端
cargo build --release
```

## 项目结构

```
storkitty/
├── src/
│   ├── backend/          # Rust 后端代码
│   │   ├── auth.rs       # 认证模块
│   │   ├── config.rs     # 配置管理
│   │   └── mod.rs        # 模块定义
│   ├── frontend/         # React 前端代码
│   │   ├── components/   # UI 组件
│   │   ├── routes/       # 路由页面
│   │   ├── hooks/        # React Hooks
│   │   ├── contexts/     # React Context
│   │   ├── api/          # API 客户端
│   │   └── styles/       # 样式文件
│   └── main.rs           # Rust 入口文件
├── config/               # 配置文件
├── web/                  # 构建输出目录
└── docs/                 # 文档
```

## 开发规范

- 使用 TailwindCSS 4.x 进行样式开发，禁止自定义 CSS
- 遵循 shadcn/ui 设计系统
- 使用 TypeScript 进行类型安全开发
- 遵循 React 19 最佳实践

## 许可证

MIT License