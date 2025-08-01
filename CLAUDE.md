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
- **E2E Testing**: Playwright + TypeScript for comprehensive end-to-end testing

The application uses a dual-language architecture where:
- React frontend code is in `src/frontend/` with organized component structure
- Rust backend code is in `src/main.rs` with modular `src/backend/` directory
- Built frontend assets are output to `web/` directory
- Rust server serves files from `web/` directory and provides API endpoints on port 3330
- User credentials and configuration stored in `config.toml` (gitignored for security)
- Initial setup wizard for first-time configuration
- File storage in configurable `uploads/` directory (gitignored)
- Comprehensive E2E test suite in `e2e/` directory with automated testing framework

## Development Commands

### Frontend Development
- `bun run dev` - Generate routes and start development server with hot reload
- `bun run build` - Generate routes and build frontend for production (outputs to `web/`)
- `bun run preview` - Preview production build
- `bun run routes:gen` - Generate route tree from file-based routes
- `bun install` - Install frontend dependencies

### Code Quality
- `bun run check` - Run Biome linter on main project (excludes E2E tests)
- `bun run test:e2e:check` - Run Biome linter on E2E test code (with relaxed rules)
- `bun run format` - Format code with Biome
- `cargo fmt` - Format Rust code

### Backend Development
- `cargo run --bin storkitty` - Start the Rust server (serves `web/` directory and API on port 3330)
- `cargo run --bin hash_password` - Generate bcrypt hash for new passwords
- `cargo build` - Build the Rust application
- `cargo build --release` - Build optimized release version

### E2E Testing
- `bun run test:e2e` - Run all E2E tests
- `bun run test:e2e:ui` - Run tests with Playwright UI interface
- `bun run test:e2e:headed` - Run tests in headed browser mode
- `bun run test:e2e:debug` - Run tests in debug mode
- `bun run test:e2e:report` - View test results report

### Initial Setup (Automatic)
The application features an automatic setup wizard for first-time use:

1. Copy `config.example.toml` to `config.toml` (or create with empty user credentials)
2. Run `bun install` to install frontend dependencies  
3. Run `bun run build` to build the frontend
4. Run `cargo run --bin storkitty` to start the backend server
5. Access the application at `http://localhost:3330`
6. **First visit**: System will automatically redirect to setup wizard (`/setup`) if no admin user is configured
7. **Complete setup**: Enter your desired admin username, password, and email
8. **Automatic login**: System will immediately log you in and redirect to file management interface

### Development Workflow
- **Hot Configuration Reload**: Changes to user settings take effect immediately without server restart
- **Secure by Default**: No default credentials - admin account is created during initial setup
- **Route Protection**: Automatic redirection based on authentication and setup status

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
- **JWT-based authentication**: Secure token-based session management with async-safe configuration access
- **Password hashing**: bcrypt with configurable cost for secure password storage
- **Initial Setup Wizard**: Interactive first-time setup for admin account creation
- **Hot Configuration Reload**: Configuration changes apply immediately without server restart
- **Route protection**: Intelligent routing based on authentication and setup status
- **Token persistence**: Automatic login state restoration using localStorage
- **Configuration-based users**: Simple TOML file for user management (no database required)
- **Security-first**: No default credentials, gitignored configuration file

### API Endpoints

#### Authentication
- `POST /api/auth/login` - User authentication (returns JWT token)
- `POST /api/auth/verify` - Token verification (returns user info + file configuration)

#### System Setup
- `GET /api/setup/status` - Check if system needs initial setup (returns needs_setup boolean)
- `POST /api/setup/init` - Initialize system with admin account (returns success status + JWT token)

#### File Management
- `GET /api/files/list` - Get root directory file list
- `GET /api/files/list/{path}` - Get file list for specific path
- `GET /api/files/storage` - Get storage space information
- `DELETE /api/files/delete/{path}` - Delete file or directory (requires allow_delete permission)
- `POST /api/files/mkdir/{path}` - Create new directory (requires allow_mkdir permission)
- `PUT /api/files/rename/{path}` - Rename file or directory (with conflict detection and validation)
- `GET /api/files/download/{path}` - Download file with streaming support (no authentication required)

#### File Upload
- `POST /api/upload/simple` - Simple file upload with multipart form data

### File Structure
```
├── config.example.toml          # Example configuration file (copy to config.toml)
├── tsr.config.json             # Router configuration for file-based routing
├── playwright.config.ts        # Playwright E2E testing configuration
├── e2e/                        # E2E testing framework
│   ├── tests/                  # Test case files
│   │   ├── auth.spec.ts        # Authentication tests
│   │   ├── file-management.spec.ts # File management tests
│   │   ├── multi-directory.spec.ts # Multi-directory tests
│   │   └── ui-interactions.spec.ts # UI/UX tests
│   ├── utils/                  # Test helpers and utilities
│   │   ├── test-helpers.ts     # Core testing helper classes
│   │   ├── global-setup.ts     # Test environment setup
│   │   └── global-teardown.ts  # Test environment cleanup
│   ├── fixtures/               # Test data and configurations
│   │   └── test-config.toml    # Test environment config
│   └── README.md               # E2E testing documentation
├── src/
│   ├── main.rs                 # Main server entry point
│   ├── bin/
│   │   └── hash_password.rs    # Password hashing utility
│   ├── backend/
│   │   ├── mod.rs              # Backend module exports
│   │   ├── auth.rs             # Authentication logic and handlers (async-safe)
│   │   ├── files.rs            # File management logic and handlers
│   │   ├── upload.rs           # File upload logic and handlers
│   │   ├── setup.rs            # Initial setup and configuration management
│   │   └── config.rs           # Configuration file parsing
│   └── frontend/
│       ├── index.tsx           # Main app component with router
│       ├── routeTree.gen.ts    # Auto-generated route tree (do not edit)
│       ├── types/
│       │   ├── auth.ts         # Authentication & setup type definitions
│       │   └── files.ts        # File management type definitions
│       ├── api/
│       │   ├── auth.ts         # Authentication & setup API functions with error handling
│       │   ├── files.ts        # File management API functions
│       │   ├── upload.ts       # Simple file upload API functions and utilities
│       │   └── chunkedUpload.ts # Chunked upload API for large files
│       ├── utils/
│       │   └── download.ts     # File download utilities and link generation
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
│       │   │   ├── alert.tsx   # Alert component
│       │   │   ├── dialog.tsx  # Dialog component
│       │   │   └── dropdown-menu.tsx # Dropdown menu component
│       │   ├── LoginForm.tsx   # Login form component (clean, no demo credentials)
│       │   ├── SetupForm.tsx   # Initial setup form component with validation
│       │   ├── CreateDirectoryDialog.tsx # Directory creation dialog with validation
│       │   ├── DeleteConfirmDialog.tsx # File deletion confirmation dialog
│       │   ├── RenameDialog.tsx # File/folder rename dialog with validation and conflict detection
│       │   ├── UploadDrawer.tsx # Upload drawer component with progress tracking
│       │   ├── UploadIndicator.tsx # Floating upload indicator button
│       │   └── FilesPageComponent.tsx # Shared file management component
│       └── routes/             # File-based route definitions
│           ├── __root.tsx      # Root layout with AuthProvider
│           ├── index.tsx       # Home route (intelligent auto-redirect)
│           ├── setup.tsx       # Initial setup wizard route
│           ├── login.tsx       # Login page route
│           ├── files.index.tsx # Root directory file browser
│           └── files.$path.tsx # Dynamic path file browser
```

### User Management & Initial Setup
- **No default credentials**: System is secure by default with no pre-configured admin account
- **Interactive Setup Wizard**: First-time users are guided through initial setup at `/setup`
- **Automatic Configuration**: Setup wizard creates admin account and saves to `config.toml`
- **Hot Configuration Reload**: Changes take effect immediately without server restart
- **Setup Flow**:
  1. Copy `config.example.toml` to `config.toml` (or create with empty user section)
  2. Start server and access web interface
  3. System automatically redirects to setup wizard if no admin is configured
  4. Enter desired username, password, and email
  5. System immediately logs you in and redirects to file management
- **Configuration Management**:
  - JWT secret and expiration configurable in `config.toml` under `[jwt]` section
  - Server host and port configurable in `config.toml` under `[server]` section  
  - Security permissions configurable in `config.toml` under `[security]` section (allow_mkdir, allow_delete, allow_download)
  - To manually generate password hashes: Run `cargo run --bin hash_password`
- **Security**: `config.toml` is gitignored to prevent accidental credential commits

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

### File Download System
- **Direct download**: Click-to-download functionality for all file types
- **Copy download links**: Generate shareable download URLs with clipboard integration
- **No authentication required**: Download links work without login for easy sharing
- **Streaming support**: Efficient file download using tokio-util ReaderStream for large files
- **Proper headers**: Automatic Content-Disposition and Content-Type headers for downloads
- **Download utilities**: Centralized download functions in `src/frontend/utils/download.ts`
- **Toast notifications**: User feedback for copy link success/failure using sonner
- **Clipboard API**: Modern clipboard integration with fallback detection
- **File deletion**: Secure file and folder deletion with confirmation dialogs
- **Deletion safety**: Special confirmation required for non-empty folders
- **Directory creation**: Create new folders with validation and security checks
- **File renaming**: Rename files and folders with real-time validation and conflict detection
- **Name validation**: Automatic validation of file/directory names against illegal characters and system reserved names

### Dependencies
**Backend**: axum (with multipart), tokio, tokio-util, serde, jsonwebtoken, bcrypt, tower-http, uuid, mime, bytes, futures-util
**Frontend**: react, @tanstack/react-router, @tanstack/router-cli, @tanstack/router-devtools, @tanstack/react-query, @tanstack/react-query-devtools, react-dropzone, sonner
**UI Framework**: @tailwindcss/postcss (TailwindCSS 4.x), class-variance-authority, clsx, tailwind-merge, lucide-react, @radix-ui/react-slot, @radix-ui/react-dialog, @radix-ui/react-dropdown-menu, shadcn/ui components
**Animation**: TailwindCSS animate classes, CSS transitions and transforms for smooth user interactions, custom CSS keyframes for heartbeat effects
**Package Manager**: Bun (uses `bun.lockb` for dependency locking)
**E2E Testing**: @playwright/test, comprehensive test coverage with TypeScript support

## Development Notes
- Always run `bun run build` before starting the backend to ensure latest frontend assets
- Routes are auto-generated from file structure - run `bun run routes:gen` after changing routes
- The `routeTree.gen.ts` file is auto-generated and should not be edited manually
- **TSX files do not need `import React from "react"`** - uses new JSX transform
- Only import specific React hooks/types you need: `import { useState, useEffect } from "react"`
- Keep hooks in separate files from components for better modularity
- **TanStack Query handles all server state** - use query hooks for data fetching
- **TanStack Query Configuration**: Mutations are configured with `retry: 0` to prevent automatic retries for file operations
- API calls are centralized in `src/frontend/api/` with proper error handling
- React Query DevTools available in development for debugging queries
- **Error Handling**: Backend returns appropriate HTTP status codes (4xx for client errors, 200 for success)
- **Component architecture**: 
  - Shared UI components in `src/frontend/components/ui/` (shadcn/ui)
  - Business logic components in `src/frontend/components/`
  - FilesPageComponent: Shared component for file browser functionality
  - CreateDirectoryDialog: Dialog for creating new folders with input validation and error handling
  - DeleteConfirmDialog: Confirmation dialog for file/folder deletion with safety features
  - RenameDialog: Dialog for renaming files/folders with real-time validation and conflict detection
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
- **Animation Guidelines**: Follow consistent animation patterns across components
- Password hashes must be generated using the provided utility for security
- JWT tokens expire after 24 hours by default (configurable)
- CORS is enabled for development (all origins allowed)
- **File-based routing**: Routes in `src/frontend/routes/` become URL paths with nested layout support
- **Intelligent Route Structure**:
  - `/` - Home page with intelligent redirect based on system status
  - `/setup` - Initial setup wizard (automatic redirect if system needs setup)
  - `/login` - User authentication page (redirects if setup needed)
  - `/files` - Root directory file browser (files.index.tsx)
  - `/files/folder` - Dynamic folder navigation (files.$path.tsx)
  - `/files/folder/subfolder` - Deep folder navigation with URL encoding
- **Smart Routing Logic**:
  - System automatically checks setup status and authentication state
  - Redirects to setup wizard if no admin user is configured
  - Redirects to login if setup is complete but user not authenticated
  - Redirects to files if user is authenticated
- **Route Protection**: Multi-layer protection (setup status → authentication → authorization)
- **Index routes**: Uses `files.index.tsx` for `/files` to ensure proper route matching
- **Dynamic parameters**: Path parameters automatically URL-encoded/decoded for special characters

## E2E Testing Framework

### Testing Architecture
- **Framework**: Playwright + TypeScript for reliable, cross-browser testing
- **Test Organization**: Organized by feature area (auth, file-management, multi-directory, ui-interactions)
- **Helper Classes**: Comprehensive testing utilities for common operations
- **Test Data**: Automatic test data generation and cleanup
- **Environment**: Isolated test environment with dedicated config and storage directories

### Test Coverage
- **Authentication**: Login/logout, session management, token validation, form validation
- **File Management**: File listing, upload, download, delete, rename, directory creation
- **Multi-Directory**: Directory switching, independent storage, URL routing
- **UI Interactions**: Responsive design, view switching, search, drag-drop, animations
- **Error Handling**: Network errors, validation errors, permission errors

### Test Execution
- **Parallel Execution**: Tests run in parallel for faster feedback
- **Cross-Browser**: Chromium, Firefox, WebKit, and mobile browsers
- **Automatic Setup**: Test environment prepared and cleaned automatically
- **Rich Reporting**: HTML reports with screenshots, videos, and traces
- **CI/CD Ready**: Optimized for continuous integration pipelines

### Test Maintenance
- **Page Object Model**: Organized helper classes for maintainable tests
- **Data Isolation**: Each test uses unique data to prevent conflicts
- **Error Recovery**: Robust error handling and cleanup mechanisms
- **Documentation**: Comprehensive test documentation and examples

## UI/UX Design Guidelines

### Animation & Transition Standards
- **Consistent Duration**: Use standardized animation durations across the application
  - Fast interactions: `duration-200` (200ms) for hover effects and button states
  - Standard transitions: `duration-300` (300ms) for modal/drawer appearances
  - Slow transitions: `duration-500` (500ms) for complex state changes
- **Easing Functions**: Use `ease-in-out` for natural feeling animations
- **Staggered Animations**: Implement layered timing for complex components
  - Primary content: 0ms delay
  - Secondary elements: 100-150ms delay  
  - Tertiary elements: 200-250ms delay

### Modal & Overlay Consistency
- **Backdrop Effect**: All modals and drawers use consistent backdrop styling
  - Background: `bg-black/20` (20% opacity black)
  - Blur effect: `backdrop-blur-sm` for depth perception
  - Animation: `duration-300` fade in/out
- **Content Behavior**: Modal content should have layered animation entrance
  - Main container: Fade + zoom effect (`fade-in-0 zoom-in-95`)
  - Content sections: Slide in from appropriate directions
  - Action buttons: Slide in from bottom with delay

### Interactive Element Standards
- **Hover Effects**: Consistent micro-interactions for all interactive elements
  - Scale effect: `hover:scale-105` for buttons and cards
  - Shadow enhancement: `hover:shadow-lg` for elevated elements
  - Transition: `transition-all duration-200` for smooth effects
- **Loading States**: Provide clear feedback during async operations
  - Spinner animations: Use `animate-spin` for loading indicators
  - Button states: Disable and show loading spinner during actions
  - Progressive disclosure: Show loading states before content appears

### Visual Hierarchy & Spacing
- **Glass Morphism**: Use consistent backdrop blur effects for layered UI
  - Component backgrounds: `bg-background/95 backdrop-blur-sm`
  - Overlay elements: `bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50`
- **Shadow System**: Implement consistent depth perception
  - Cards: `shadow-md` for standard elevation
  - Modals: `shadow-2xl` for prominent elevation
  - Interactive hover: `hover:shadow-lg` for dynamic elevation

### Component Animation Patterns
- **Entry Animations**: Components should animate in with purpose
  - Slide in from logical directions (top for warnings, bottom for actions)
  - Use appropriate delays to create natural reading flow
  - Scale effects for emphasis (icons, important elements)
- **Exit Animations**: Smooth exit transitions prevent jarring changes
  - Fade out with slight scale reduction
  - Respect user's motion preferences
  - Clean up animation states properly

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
- **File action menus**: Radix UI dropdown menus for file operations (download, copy link, delete)
- **Smart menu positioning**: Grid mode menus expand right-down, list mode menus expand naturally
- **Toast notifications**: Sonner-based notifications for user feedback and status updates

### Technical Implementation
- **Shared component**: `FilesPageComponent` handles all file browser logic
- **Route separation**: 
  - `files.index.tsx` - Root directory browser (index route)
  - `files.$path.tsx` - Dynamic path navigation
- **State management**: TanStack Query for caching and data fetching
- **URL encoding**: Automatic encoding/decoding of special characters in paths
- **Error handling**: Graceful handling of navigation errors and loading states

## Directory Management System

### Create Directory Features
- **Modern Dialog Interface**: CreateDirectoryDialog component with smooth animations and validation
- **Real-time Validation**: Input validation for directory names with immediate error feedback
- **Security Checks**: Prevents creation of directories with illegal characters or system reserved names
- **Path-aware Creation**: Automatically creates directories in the current folder location
- **Animation Timeline**: Consistent animation timing with staggered element entry (0ms, 150ms, 100ms, 200ms delays)
- **Error Handling**: Comprehensive validation and error messages for user guidance

### Directory Creation Process
- **Input Validation**: Checks for empty names, illegal characters (`/ \ : * ? " < > |`), and reserved names
- **Length Limits**: Directory names restricted to 255 characters maximum
- **Reserved Names**: Prevents creation of system directories (`.DS_Store`, `.chunks`, `Thumbs.db`, `.gitkeep`, `desktop.ini`, `.tmp`, `.temp`, `__pycache__`, `.git`, `.svn`, `node_modules`)
- **Backend Security**: Server-side validation and permission checking (`allow_mkdir` configuration)
- **Automatic Refresh**: File list automatically updates after successful directory creation
- **User Feedback**: Loading states, success/error messages, and visual confirmation
- **Keyboard Support**: Enter key to confirm, Escape key to cancel, proper focus management

### Technical Implementation
- **API Endpoint**: `POST /api/files/mkdir/{path}` for secure directory creation
- **Mutation Hook**: `useCreateDirectoryMutation` for TanStack Query integration
- **Path Construction**: Automatic path building based on current navigation location
- **Permission System**: Configurable `allow_mkdir` permission in `config.toml`
- **State Management**: Centralized dialog state with proper cleanup and error handling
- **TypeScript Integration**: Proper type definitions for `KeyboardEvent<HTMLInputElement>` and component props
- **Real-time Validation**: `validateDirectoryName` function with immediate error clearing on input change
- **Accessibility**: Auto-focus on input, proper ARIA labels, and semantic HTML structure

## File Upload System

### Upload Interface
- **Upload Drawer**: Modern slide-out panel triggered by floating upload button
- **Smooth Animations**: 300ms slide transitions with backdrop blur effects
  - Backdrop: `bg-black/20 backdrop-blur-sm` for depth and focus
  - Drawer: `translate-x-full` to `translate-x-0` slide transition
  - Header: `bg-background/95 backdrop-blur-sm` for glass morphism effect
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

## File Deletion System

### Deletion Interface
- **Context-sensitive Delete Buttons**: Hover-activated delete buttons in both grid and list views
- **Grid View**: Floating delete button in top-right corner of file cards
- **List View**: Delete button in action menu that appears on hover
- **Visual Feedback**: Red destructive styling with trash icon for clear identification

### Deletion Features
- **Confirmation Dialog**: Modern modal dialog with detailed information about deletion
- **Safety Warnings**: Special warnings for non-empty folders with item counts
- **Name Confirmation**: Required typing of folder name for non-empty folder deletion
- **File Preview**: Shows file icon, name, size, and metadata in confirmation dialog
- **Loading States**: Visual feedback during deletion process with disabled UI
- **Layered Animations**: Staggered entrance animations for better visual hierarchy
  - Dialog backdrop: `bg-black/20 backdrop-blur-sm` with 300ms fade
  - Main dialog: Fade + zoom entrance with `animate-in fade-in-0 zoom-in-95`
  - Warning icon: Delayed zoom effect with `delay-150`
  - File preview: Slide from top with `delay-100`
  - Action buttons: Slide from bottom with `delay-200`

### Security & Safety
- **Permission Check**: Respects `allow_delete` configuration setting
- **Path Validation**: Ensures deletion is restricted to configured storage directory
- **Recursive Deletion**: Safely removes directories and all contents
- **Error Handling**: Comprehensive error reporting with user-friendly messages
- **No Recovery**: Clear messaging that deletions are permanent

### Technical Implementation
- **Backend API**: `DELETE /api/files/delete/{path}` endpoint with authentication
- **Frontend Hook**: `useDeleteFileMutation` with automatic cache invalidation
- **UI Components**: Reusable `DeleteConfirmDialog` with TypeScript support
- **State Management**: TanStack Query for optimistic updates and error handling
- **Real-time Updates**: Automatic refresh of file lists and storage information

## Configuration File Format

### Multi-Directory Storage Configuration
The `config.toml` file now supports multiple storage directories with the following format:

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
max_file_size = 100
allowed_extensions = []
blocked_extensions = [".exe", ".bat", ".sh"]

[security]
allow_mkdir = true
allow_delete = true
allow_download = true

# Multi-directory storage configuration
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
```

### Configuration Fields
- **Storage Directories**: Array of `[[storage.directories]]` entries
- **Directory ID**: Unique identifier for API routing
- **Directory Name**: Display name in the UI
- **Description**: Optional description for the directory
- **Icon**: Lucide React icon name for UI display
- **Storage Type**: Currently only "local" is supported
- **Path**: Filesystem path relative to server root
- **Default Selection**: The first directory in the list is automatically selected as default

### Directory Selection System
- **Automatic First Selection**: System automatically selects the first configured directory as the active storage location
- **LocalStorage Persistence**: User's directory choice is saved in browser localStorage and restored on page refresh
- **Storage Key**: `"storkitty_selected_directory"` - used to persist the selected directory ID
- **Seamless Experience**: No configuration needed, works out of the box with clean UI
- **Backwards Compatibility**: Existing configurations continue to work, any legacy `default` fields are ignored

### Directory Selection Features
- **Smart Initialization**: On first load, selects the first available directory
- **Persistent Selection**: User's choice survives browser refresh and restart
- **Fallback Handling**: If stored directory ID is not found, automatically falls back to first directory
- **Clean UI**: Removed "默认" (default) labels for simplified interface
- **SSR Compatible**: Handles server-side rendering safely with proper window checks

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
  },
  "directories": [
    {
      "id": "uploads",
      "name": "My Files",
      "description": "Personal file storage",
      "icon": "hard-drive",
      "storage_type": "local"
    },
    {
      "id": "documents",
      "name": "Documents",
      "description": "Document storage area",
      "icon": "file-text",
      "storage_type": "local"
    }
  ]
}
```

#### 技术实现
- **后端变更**: 修改 `auth.rs` 中的 `VerifyResponse` 结构体，包含 `FileConfigInfo` 和 `DirectoryInfo` 数组
- **前端变更**: 更新 `AuthContext` 暴露 `fileConfig` 和 `directories` 属性，组件直接从认证上下文获取配置
- **类型安全**: 统一在 `types/auth.ts` 中定义相关类型，移除重复定义
- **目录选择优化**: 移除 `default` 字段，采用首个目录自动选择机制
- **持久化存储**: 集成 localStorage 实现目录选择状态持久化
- **向后兼容**: 保持现有API结构，只是数据更丰富，移除的 `default` 字段不影响旧配置

#### 性能收益
- **减少网络请求**: 从2个请求优化为1个请求
- **降低延迟**: 用户登录后立即获得所有必要信息
- **简化状态管理**: 统一在认证上下文中管理用户、配置和目录信息
- **改善用户体验**: 更快的界面响应和配置加载
- **智能目录选择**: 自动选择首个目录，无需额外配置
- **状态持久化**: 目录选择状态自动保存，用户体验更连贯

## 开发阶段与维护规则

### 开发优先级

#### 第一阶段 (MVP) ✅ 已完成
1. ✅ 用户认证系统
2. ✅ 文件浏览功能
3. ✅ 文件上传功能
4. ✅ 文件下载功能

#### 第二阶段 ✅ 已完成
1. ✅ 文件操作 (删除功能)
2. ✅ 新建文件夹功能
3. ✅ 文件重命名功能
4. 🔄 批量操作支持

#### 第三阶段 ✅ 已完成 (多目录与性能优化)
1. ✅ **多目录存储系统**: 支持配置多个独立存储目录
2. ✅ **API 性能优化**: 统一认证响应，减少网络请求
3. ✅ **智能上传系统**: 自动分片上传，并发控制和错误恢复
4. ✅ **目录化 API**: 所有文件操作统一使用目录化端点

#### 第四阶段 ✅ 已完成 (E2E 测试框架)
1. ✅ **E2E 测试框架**: 基于 Playwright + TypeScript 的端到端测试系统
2. ✅ **全面测试覆盖**: 用户认证、文件管理、多目录存储、UI 交互测试
3. ✅ **测试工具链**: 测试助手、数据工厂、全局设置和清理
4. ✅ **CI/CD 支持**: 适配持续集成的测试配置和报告生成

#### 第五阶段 (增强功能)
1. 🔮 文件搜索
2. 🔮 文件预览
3. 🔮 访问日志记录
4. 🔮 多用户权限管理
5. 🔮 云存储支持 (S3, 阿里云 OSS 等)

### 文档维护规则

#### FEATURES.md 维护规则 ⚠️ 重要
**每当实现新功能或更新现有功能时，必须同步更新 FEATURES.md 文件。**

维护要求：
1. **功能完成后立即更新**: 不允许功能实现与文档脱节
2. **详细记录实现细节**: 包括技术实现、API 端点、用户界面变化
3. **更新开发阶段状态**: 及时标记完成的功能为 ✅，进行中的为 🔄
4. **保持格式一致性**: 遵循现有的文档结构和格式规范
5. **包含配置示例**: 新功能如涉及配置文件变更，必须提供配置示例

#### 文档同步检查清单
- [ ] 功能描述是否准确反映实际实现
- [ ] API 端点文档是否与后端代码一致
- [ ] 配置文件示例是否正确和完整
- [ ] 技术实现部分是否涵盖关键架构决策
- [ ] 用户界面变化是否有相应说明
- [ ] 开发阶段状态是否及时更新

### 状态说明
- ✅ 已完成并测试
- 🔄 开发中/规划中  
- 🔮 未来功能
- ⚠️ 需要注意的重要信息