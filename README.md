# Storkitty

Storkitty 是一个现代化的基于 Web 的文件管理系统，专为高性能和卓越的用户体验而构建。它结合了强大的 Rust 后端和动态的 React 前端，提供流畅的文件管理体验。

![screenshot](https://cdn.sa.net/2025/11/29/AEtkB87qRyTJC2N.png)

## 功能特性

- **文件管理**:
  - **浏览**: 轻松导航您的文件系统。
  - **新建**: 创建新文件，支持文本、Markdown、Excalidraw 和 D2 图表。
  - **编辑**: 内置 Monaco Editor，支持文本和代码文件的语法高亮编辑。
  - **上传/下载**: 高效的文件传输能力。
  - **管理**: 重命名、移动和删除文件及文件夹。

- **用户界面**:
  - **现代设计**: 基于 Tailwind CSS 构建的整洁、响应式 UI。
  - **交互式弹窗**: 直观的文件操作弹窗（新建、重命名、删除、编辑）。
  - **右键菜单**: 支持右键快捷操作。
  - **深色模式**: 支持亮色和深色主题切换。

- **安全性**:
  - **身份验证**: 安全的登录系统。
  - **设置向导**: 简便的初始配置。

## 技术栈

### 前端

- **框架**: [React](https://react.dev/)
- **语言**: [TypeScript](https://www.typescriptlang.org/)
- **构建工具**: [RsBuild](https://rsbuild.rs/)
- **样式**: [Tailwind CSS](https://tailwindcss.com/)
- **路由**: [TanStack Router](https://tanstack.com/router)
- **状态管理**: [TanStack Query](https://tanstack.com/query)
- **UI 组件**: [Radix UI](https://www.radix-ui.com/) / [shadcn/ui](https://ui.shadcn.com/)

### 后端

- **语言**: [Rust](https://www.rust-lang.org/)
- **Web 框架**: [Axum](https://github.com/tokio-rs/axum)
- **异步运行时**: [Tokio](https://tokio.rs/)

## 快速开始

### 前置要求

- Node.js (建议 v18+)
- Rust (最新稳定版)
- Bun (可选，用于更快的包管理)

### 安装

1.  **克隆仓库:**

    ```bash
    git clone <repository-url>
    cd storkitty
    ```

2.  **安装前端依赖:**

    ```bash
    bun install
    ```

3.  **运行应用:**
    **前端**:
    ```bash
    bun run dev
    ```
    **后端**:
    ```bash
    cargo run
    ```

## 许可证

[MIT](LICENSE)
