# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack application called "storkitty" that combines a React frontend with a Rust backend. The application is a lightweight file management system featuring user authentication and a modern file browser interface.

## Architecture

- **Frontend**: React 19 + TypeScript application built with RSBuild
- **Backend**: Rust server using Axum framework with RESTful API and static file serving
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **Data Fetching**: TanStack Query for server state management, caching, and error handling
- **UI Framework**: TailwindCSS 4.x + shadcn/ui components for modern, accessible design
- **Database**: Configuration file-based user storage (no external database required)
- **File Storage**: File system-based storage with configurable root directory
- **Build System**: RSBuild for frontend bundling, Cargo for Rust compilation
- **Package Manager**: Bun for frontend dependency management
- **Code Quality**: Biome for TypeScript/React linting and formatting, rustfmt for Rust formatting
- **Routing**: @tanstack/react-router with File-Based Routing for frontend navigation and route protection

The application uses a dual-language architecture where:
- React frontend code is in `src/frontend/` with organized component structure
- Rust backend code is in `src/main.rs` with modular `src/backend/` directory
- Built frontend assets are output to `web/` directory
- Rust server serves files from `web/` directory and provides API endpoints on port 3330
- User credentials and configuration stored in `config.toml`
- File storage in configurable `uploads/` directory (gitignored)

## Development Commands

### Frontend Development
- `bun run dev` - Generate routes and start development server with hot reload
- `bun run build` - Generate routes and build frontend for production (outputs to `web/`)
- `bun run preview` - Preview production build
- `bun run routes:gen` - Generate route tree from file-based routes
- `bun install` - Install frontend dependencies

### Code Quality
- `bun run check` - Run Biome linter and auto-fix issues
- `bun run format` - Format code with Biome
- `cargo fmt` - Format Rust code

### Backend Development
- `cargo run --bin storkitty` - Start the Rust server (serves `web/` directory and API on port 3330)
- `cargo run --bin hash_password` - Generate bcrypt hash for new passwords
- `cargo build` - Build the Rust application
- `cargo build --release` - Build optimized release version

### Full Development Workflow
1. Run `bun install` to install frontend dependencies
2. Run `bun run build` to build the frontend
3. Run `cargo run --bin storkitty` to start the backend server
4. Access the application at `http://localhost:3330`
5. Login with credentials: username `admin`, password `admin123`

## Code Style Rules

### Frontend (Biome Configuration)
- No default exports (use named exports)
- Explicit member accessibility required
- Component-only modules for React components
- Double quotes for strings
- Space indentation
- Strict unused variable/import detection
- **No React import required**: Uses new JSX transform, omit `import React from "react"` in .tsx files

### Backend (Rust)
- Standard Rust formatting via rustfmt
- Uses 2024 edition
- Tokio async runtime with "full" features

## Features

### Authentication System
- **JWT-based authentication**: Secure token-based session management
- **Password hashing**: bcrypt with configurable cost for secure password storage
- **Route protection**: Frontend routes automatically redirect unauthenticated users
- **Token persistence**: Automatic login state restoration using localStorage
- **Configuration-based users**: Simple TOML file for user management (no database required)

### API Endpoints

#### Authentication
- `POST /api/auth/login` - User authentication (returns JWT token)
- `POST /api/auth/verify` - Token verification (returns user info + file configuration)

#### File Management
- `GET /api/files/list` - Get root directory file list
- `GET /api/files/list/{path}` - Get file list for specific path
- `GET /api/files/storage` - Get storage space information

#### File Upload
- `POST /api/upload/simple` - Simple file upload with multipart form data

### File Structure
```
├── config.toml                  # Application configuration (users, server, files, security)
├── tsr.config.json             # Router configuration for file-based routing
├── src/
│   ├── main.rs                 # Main server entry point
│   ├── bin/
│   │   └── hash_password.rs    # Password hashing utility
│   ├── backend/
│   │   ├── mod.rs              # Backend module exports
│   │   ├── auth.rs             # Authentication logic and handlers
│   │   ├── files.rs            # File management logic and handlers
│   │   ├── upload.rs           # File upload logic and handlers
│   │   └── config.rs           # Configuration file parsing
│   └── frontend/
│       ├── index.tsx           # Main app component with router
│       ├── routeTree.gen.ts    # Auto-generated route tree (do not edit)
│       ├── types/
│       │   ├── auth.ts         # Authentication type definitions
│       │   └── files.ts        # File management type definitions
│       ├── api/
│       │   ├── auth.ts         # Authentication API functions and error handling
│       │   ├── files.ts        # File management API functions
│       │   ├── upload.ts       # Simple file upload API functions and utilities
│       │   └── chunkedUpload.ts # Chunked upload API for large files
│       ├── contexts/
│       │   ├── AuthContext.tsx # Authentication state management
│       │   ├── UploadContext.tsx # Upload state management and operations
│       │   └── UploadContextDefinition.ts # Upload context types and definitions
│       ├── hooks/
│       │   ├── useAuth.ts      # Authentication hook
│       │   ├── useAuthQueries.ts # TanStack Query hooks for auth
│       │   ├── useFiles.ts     # TanStack Query hooks for file management
│       │   └── useUploadContext.ts # Upload context hook
│       ├── lib/
│       │   └── utils.ts        # Utility functions (cn, etc.)
│       ├── styles/
│       │   └── globals.css     # TailwindCSS 4.x imports and @theme configuration
│       ├── components/
│       │   ├── ui/             # shadcn/ui components
│       │   │   ├── button.tsx  # Button component
│       │   │   ├── input.tsx   # Input component
│       │   │   ├── label.tsx   # Label component
│       │   │   ├── card.tsx    # Card components
│       │   │   └── alert.tsx   # Alert component
│       │   ├── LoginForm.tsx   # Login form component
│       │   ├── UploadDrawer.tsx # Upload drawer component with progress tracking
│       │   ├── UploadIndicator.tsx # Floating upload indicator button
│       │   └── FilesPageComponent.tsx # Shared file management component
│       └── routes/             # File-based route definitions
│           ├── __root.tsx      # Root layout with AuthProvider
│           ├── index.tsx       # Home route (auto-redirect)
│           ├── login.tsx       # Login page route
│           ├── files.index.tsx # Root directory file browser
│           └── files.$path.tsx # Dynamic path file browser
```

### User Management
- Default user: `admin` / `admin123`
- To add/modify users: Edit `config.toml` under `[user]` section  
- To generate password hashes: Run `cargo run --bin hash_password`
- JWT secret and expiration configurable in `config.toml` under `[jwt]` section
- Server host and port configurable in `config.toml` under `[server]` section

### File Management
- **File storage**: Configurable root directory (default: `./uploads`)
- **Upload limits**: Configurable maximum file size (default: 100MB)
- **File type restrictions**: Configurable allowed/blocked file extensions
- **Automatic directory creation**: Creates upload directory on startup
- **Path security**: Restricted to configured root directory with path validation
- **File browser interface**: Modern responsive design with grid/list view modes
- **Folder navigation**: Click folders to navigate into subdirectories with URL path reflection
- **Breadcrumb navigation**: Interactive breadcrumb showing current path with clickable navigation
- **File metadata**: File size formatting, type detection, and modification dates
- **Real-time storage info**: Storage space calculation and usage display
- **Search functionality**: Filter files and folders by name
- **URL-based routing**: File paths reflected in browser URL for bookmarking and sharing

### Dependencies
**Backend**: axum (with multipart), tokio, serde, jsonwebtoken, bcrypt, tower-http, uuid, mime, bytes, futures-util
**Frontend**: react, @tanstack/react-router, @tanstack/router-cli, @tanstack/router-devtools, @tanstack/react-query, @tanstack/react-query-devtools, react-dropzone
**UI Framework**: @tailwindcss/postcss (TailwindCSS 4.x), class-variance-authority, clsx, tailwind-merge, lucide-react, @radix-ui/react-slot, shadcn/ui components
**Package Manager**: Bun (uses `bun.lockb` for dependency locking)

## Development Notes
- Always run `bun run build` before starting the backend to ensure latest frontend assets
- Routes are auto-generated from file structure - run `bun run routes:gen` after changing routes
- The `routeTree.gen.ts` file is auto-generated and should not be edited manually
- **TSX files do not need `import React from "react"`** - uses new JSX transform
- Only import specific React hooks/types you need: `import { useState, useEffect } from "react"`
- Keep hooks in separate files from components for better modularity
- **TanStack Query handles all server state** - use query hooks for data fetching
- API calls are centralized in `src/frontend/api/` with proper error handling
- React Query DevTools available in development for debugging queries
- **Component architecture**: 
  - Shared UI components in `src/frontend/components/ui/` (shadcn/ui)
  - Business logic components in `src/frontend/components/`
  - FilesPageComponent: Shared component for file browser functionality
  - UploadDrawer: Modern slide-out upload interface with drag-and-drop support
  - UploadIndicator: Floating upload status button with progress visualization
  - Route components: Thin wrappers that pass props to shared components
  - Hooks: Custom hooks for API calls and state management in `src/frontend/hooks/`
  - **AuthContext优化**: 现在包含用户信息和文件配置，减少了对独立配置API的依赖
- **ONLY use TailwindCSS 4.x classes for styling** - no custom CSS classes, no inline styles, no CSS-in-JS
- **TailwindCSS 4.x Configuration**: Uses `@tailwindcss/postcss` plugin with `@theme` configuration in globals.css
- **CSS Variables for shadcn/ui**: All colors defined as CSS variables (--primary, --secondary, etc.) and referenced via `@theme` configuration
- **NO custom CSS styles in components** - all styling must use TailwindCSS utility classes
- **Subtle hover effects** - use simple shadow and scaling effects for better UX
- **shadcn/ui components** - consistent, accessible components in `src/frontend/components/ui/`
- **Use `cn()` utility** - for conditional classes with `clsx` and `tailwind-merge`
- **Lucide React icons** - consistent icon system across the application
- Password hashes must be generated using the provided utility for security
- JWT tokens expire after 24 hours by default (configurable)
- CORS is enabled for development (all origins allowed)
- **File-based routing**: Routes in `src/frontend/routes/` become URL paths with nested layout support
- **Route structure**:
  - `/` - Home page with authentication-based redirect
  - `/login` - User authentication page  
  - `/files` - Root directory file browser (files.index.tsx)
  - `/files/folder` - Dynamic folder navigation (files.$path.tsx)
  - `/files/folder/subfolder` - Deep folder navigation with URL encoding
- **Index routes**: Uses `files.index.tsx` for `/files` to ensure proper route matching
- **Dynamic parameters**: Path parameters automatically URL-encoded/decoded for special characters  
- **Route protection**: Automatic redirect to login for unauthenticated users
- **Route matching priority**: Index routes have higher priority than parameterized routes

## TailwindCSS 4.x Configuration

The project uses TailwindCSS 4.x with the following setup:

### PostCSS Configuration
- Uses `@tailwindcss/postcss` plugin in `postcss.config.js`
- Integrated with RSBuild build system

### Color System
- All colors defined as CSS variables in `globals.css`
- shadcn/ui color system: `--primary`, `--secondary`, `--background`, etc.
- Colors mapped to TailwindCSS classes via `@theme` configuration
- Example: `bg-primary` becomes `background-color: hsl(var(--primary))`

### Dark Mode Support
- Automatic dark mode switching via CSS variables
- No JavaScript theme switching required
- Uses `.dark` class selector for dark theme variants

### Component Integration
- shadcn/ui components work seamlessly with TailwindCSS 4.x
- All component styling uses TailwindCSS utility classes
- No custom CSS classes or styles allowed

### Key Files
- `postcss.config.js` - PostCSS configuration with TailwindCSS plugin
- `src/frontend/styles/globals.css` - TailwindCSS imports and theme configuration
- `rsbuild.config.ts` - Build system integration (if needed)

## File Browser Features

### Navigation System
- **Folder clicking**: Click any folder to navigate into it
- **URL reflection**: Current path is reflected in the browser URL (e.g., `/files/documents/projects`)
- **Breadcrumb navigation**: Interactive breadcrumb trail with clickable path segments
- **Deep navigation**: Support for unlimited folder depth
- **Back navigation**: Use browser back/forward buttons or breadcrumb links

### UI Components
- **Grid/List views**: Toggle between card grid and detailed list views
- **Smart file icons**: Color-coded Lucide React icons based on file type (images=green, videos=red, documents=blue, code=purple, archives=orange)
- **Modern card design**: Rounded cards with gradient icon containers and smooth hover effects
- **Interactive hover effects**: Subtle shadow and icon scaling on hover for enhanced UX
- **File metadata**: Size, modification date, and item count for folders
- **Search filter**: Real-time filtering of files and folders by name
- **Storage display**: Real-time storage usage with progress bar
- **Responsive layout**: Adaptive grid from 2-7 columns across different screen sizes

### Technical Implementation
- **Shared component**: `FilesPageComponent` handles all file browser logic
- **Route separation**: 
  - `files.index.tsx` - Root directory browser (index route)
  - `files.$path.tsx` - Dynamic path navigation
- **State management**: TanStack Query for caching and data fetching
- **URL encoding**: Automatic encoding/decoding of special characters in paths
- **Error handling**: Graceful handling of navigation errors and loading states

## File Upload System

### Upload Interface
- **Upload Drawer**: Modern slide-out panel triggered by floating upload button
- **Smooth Animations**: 300ms slide transitions with backdrop blur effects
- **Smart File Detection**: Automatic chunked upload for files larger than 10MB
- **Drag & Drop**: Full-screen drop zone with visual feedback during drag operations
- **Upload Indicator**: Floating button with progress ring and status badges
- **Multi-file Support**: Upload up to 20 files simultaneously with individual progress tracking

### Upload Features
- **Progress Tracking**: Individual file progress with speed and ETA estimates
- **Error Handling**: Comprehensive error reporting with retry mechanisms
- **File Validation**: Dynamic size limits from config.toml, filename checks, and type validation
- **Path-aware Uploads**: Automatically uploads to current folder location
- **Upload Management**: Cancel individual uploads, clear completed items, or reset all
- **Real-time Updates**: Live progress updates with visual status indicators

### Technical Architecture
- **Upload Context**: Centralized state management for all upload operations
- **Chunked Upload API**: Handles large files via 1MB chunks with 3 concurrent uploads
- **Query Integration**: Automatic file list refresh after successful uploads
- **Storage Updates**: Real-time storage space recalculation
- **Component Separation**: Clean separation between upload logic and UI components
- **Dynamic Configuration**: File size limits and restrictions loaded from config.toml

### User Experience
- **Auto-refresh**: File list automatically updates when upload drawer is closed
- **Status Feedback**: Color-coded progress indicators (blue=uploading, green=complete, red=error)
- **Responsive Design**: Drawer adapts to different screen sizes (28rem width)
- **Keyboard Support**: ESC key to close drawer, proper focus management
- **Accessibility**: ARIA labels, semantic markup, and screen reader support

## API 优化

### 合并认证与配置请求
为了提升应用性能和减少网络请求，我们将文件配置信息合并到认证验证响应中：

#### 优化前
- 用户登录后需要两个独立请求：
  1. `POST /api/auth/verify` - 获取用户信息
  2. `GET /api/files/config` - 获取文件配置（上传限制等）

#### 优化后
- 只需一个请求：
  1. `POST /api/auth/verify` - 同时返回用户信息和文件配置

#### 响应格式
```json
{
  "user": {
    "username": "admin",
    "email": "admin@storkitty.com"
  },
  "file_config": {
    "max_file_size_mb": 100,
    "allowed_extensions": [],
    "blocked_extensions": [".exe", ".bat", ".sh"]
  }
}
```

#### 技术实现
- **后端变更**: 修改 `auth.rs` 中的 `VerifyResponse` 结构体，包含 `FileConfigInfo`
- **前端变更**: 更新 `AuthContext` 暴露 `fileConfig` 属性，组件直接从认证上下文获取配置
- **类型安全**: 统一在 `types/auth.ts` 中定义相关类型，移除重复定义
- **向后兼容**: 保持现有API结构，只是数据更丰富

#### 性能收益
- **减少网络请求**: 从2个请求优化为1个请求
- **降低延迟**: 用户登录后立即获得所有必要信息
- **简化状态管理**: 统一在认证上下文中管理用户和配置信息
- **改善用户体验**: 更快的界面响应和配置加载