# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Code Style Guidelines
- **TypeScript**: Use strict mode, no implicit any, no unused locals/parameters
- **React**: Use functional components with hooks, follow React hooks rules
- **Imports**: Use path aliases (@/, @components/, @hooks/, etc.)
- **Formatting**: Follow ESLint recommended configurations
- **Naming**: Use camelCase for variables/functions, PascalCase for components
- **Components**: One component per file, named same as file
- **Error Handling**: Use try/catch for async operations
- **State Management**: Use React context via providers for shared state

Before committing, always run `npm run lint` to ensure code quality.