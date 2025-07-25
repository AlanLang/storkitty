# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack application called "storkitty" that combines a React frontend with a Rust backend. The application features user authentication and serves a protected dashboard interface.

## Architecture

- **Frontend**: React 19 + TypeScript application built with RSBuild
- **Backend**: Rust server using Axum framework with RESTful API and static file serving
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **Database**: Configuration file-based user storage (no external database required)
- **Build System**: RSBuild for frontend bundling, Cargo for Rust compilation
- **Package Manager**: Bun for frontend dependency management
- **Code Quality**: Biome for TypeScript/React linting and formatting, rustfmt for Rust formatting
- **Routing**: @tanstack/react-router with File-Based Routing for frontend navigation and route protection

The application uses a dual-language architecture where:
- React frontend code is in `src/frontend/` with organized component structure
- Rust backend code is in `src/main.rs` with modular `src/backend/` directory
- Built frontend assets are output to `web/` directory
- Rust server serves files from `web/` directory and provides API endpoints on port 3330
- User credentials are stored in `config/users.toml`

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
- `POST /api/auth/login` - User authentication (returns JWT token)
- `POST /api/auth/verify` - Token verification (returns user info)

### File Structure
```
├── config/
│   └── users.toml              # User credentials and JWT configuration
├── tsr.config.json             # Router configuration for file-based routing
├── src/
│   ├── main.rs                 # Main server entry point
│   ├── bin/
│   │   └── hash_password.rs    # Password hashing utility
│   ├── backend/
│   │   ├── mod.rs              # Backend module exports
│   │   ├── auth.rs             # Authentication logic and handlers
│   │   └── config.rs           # Configuration file parsing
│   └── frontend/
│       ├── index.tsx           # Main app component with router
│       ├── routeTree.gen.ts    # Auto-generated route tree (do not edit)
│       ├── types/
│       │   └── auth.ts         # Authentication type definitions
│       ├── contexts/
│       │   └── AuthContext.tsx # Authentication state management
│       ├── hooks/
│       │   └── useAuth.ts      # Authentication hook
│       ├── components/
│       │   └── LoginForm.tsx   # Login form component
│       └── routes/             # File-based route definitions
│           ├── __root.tsx      # Root layout with AuthProvider
│           ├── index.tsx       # Home route (auto-redirect)
│           ├── login.tsx       # Login page route
│           └── dashboard.tsx   # Protected dashboard route
```

### User Management
- Default user: `admin` / `admin123`
- To add/modify users: Edit `config/users.toml`
- To generate password hashes: Run `cargo run --bin hash_password`
- JWT secret and expiration configurable in `config/users.toml`

### Dependencies
**Backend**: axum, tokio, serde, jsonwebtoken, bcrypt, tower-http
**Frontend**: react, @tanstack/react-router, @tanstack/router-cli, @tanstack/router-devtools
**Package Manager**: Bun (uses `bun.lockb` for dependency locking)

## Development Notes
- Always run `bun run build` before starting the backend to ensure latest frontend assets
- Routes are auto-generated from file structure - run `bun run routes:gen` after changing routes
- The `routeTree.gen.ts` file is auto-generated and should not be edited manually
- **TSX files do not need `import React from "react"`** - uses new JSX transform
- Only import specific React hooks/types you need: `import { useState, useEffect } from "react"`
- Keep hooks in separate files from components for better modularity
- Password hashes must be generated using the provided utility for security
- JWT tokens expire after 24 hours by default (configurable)
- CORS is enabled for development (all origins allowed)
- File-based routing follows convention: routes in `src/frontend/routes/` become URL paths