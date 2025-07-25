# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack application called "storkitty" that combines a React frontend with a Rust backend. The Rust backend serves as a static file server for the React application.

## Architecture

- **Frontend**: React 19 + TypeScript application built with RSBuild
- **Backend**: Rust server using Axum framework that serves the React app as static files
- **Build System**: RSBuild for frontend bundling, Cargo for Rust compilation
- **Code Quality**: Biome for TypeScript/React linting and formatting, rustfmt for Rust formatting

The application uses a dual-language architecture where:
- React frontend code is in `src/frontend/` and `src/index.tsx`
- Rust backend code is in `src/main.rs` (with `src/backend/` directory currently empty)
- Built frontend assets are output to `web/` directory
- Rust server serves files from `web/` directory on port 3330

## Development Commands

### Frontend Development
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build frontend for production (outputs to `web/`)
- `npm run preview` - Preview production build

### Code Quality
- `npm run check` - Run Biome linter and auto-fix issues
- `npm run format` - Format code with Biome
- `cargo fmt` - Format Rust code

### Backend Development
- `cargo run` - Start the Rust server (serves `web/` directory on port 3330)
- `cargo build` - Build the Rust application
- `cargo build --release` - Build optimized release version

### Full Development Workflow
1. Run `npm run build` to build the frontend
2. Run `cargo run` to start the backend server
3. Access the application at `http://localhost:3330`

## Code Style Rules

### Frontend (Biome Configuration)
- No default exports (use named exports)
- Explicit member accessibility required
- Component-only modules for React components
- Double quotes for strings
- Space indentation
- Strict unused variable/import detection

### Backend (Rust)
- Standard Rust formatting via rustfmt
- Uses 2024 edition
- Tokio async runtime with "full" features