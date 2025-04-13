# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository. Claude MUST follow the rules and guidelines in this file when making changes to the codebase.

## Build Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Logging System Commands
- `npm run logs:start` - Start the logging server
- `npm run logs:view` - View logs in real-time with automatic refresh
- `npm run logs:clear` - Clear all current logs
- `npm run logs:files` - List all log files
- `npm run logs:stop` - Stop the logging server
- `npm run stop-all` - Stop both logging server and development server

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

## Rules for Claude

1. **ALWAYS update CLAUDE.md** after making significant changes to the project, particularly:
   - Adding new commands or scripts
   - Changing the project structure
   - Implementing new features or workflows
   - Fixing major bugs that require special attention

2. **Server Management Rules**:
   - NEVER start the dev server automatically - the user will handle this
   - DO NOT use `npm run dev` without explicit user request
   - Always mention logging capabilities when working with components

3. **Code Modification Rules**:
   - Always run `npm run lint` after making code changes
   - Use type assertions carefully and document their use
   - Keep track of React hooks order and avoid conditional hooks
   - Follow React best practices for handling state and effects
   - When modifying ResizablePanel component, ensure:
     - Panel dragging works correctly across the entire window
     - Resize handles remain accessible and visible
     - Panel state is properly persisted
     - Visual feedback is provided for user interactions

4. **Debugging Rules**:
   - Recommend using the logging system for debugging issues
   - Suggest adding console.log statements that will be captured by the logger
   - Reference log files when discussing errors or behavior

5. **Documentation Rules**:
   - Include comments for complex code sections
   - Update README.md when adding significant features
   - Document new API endpoints or interfaces

## Project Overview

- **Project Description**: 3D model simulation display dashboard for racing components
- **Key Components**: 
  - SteeringWheel, Throttle, and Brake components for racing simulation
  - WebSocket connection for real-time data feed
  - Enhanced logging system with file storage and rotation
  - Leva UI controls for adjusting visual parameters
  - Three.js/React Three Fiber for 3D rendering
  - Multiple view modes (single component or all components)

## Technical Details

- **TypeScript Types**: 
  - Use type assertions (`as any`) for Leva controls where necessary
  - Convert array values to numbers with `Number()` when used in Three.js properties
  - Properly handle unused parameters in components with eslint-disable comments

- **Control Panel System**:
  - Custom ResizablePanel component that wraps Leva UI panels
  - Panels are independently draggable and resizable
  - Resize handles appear outside panel borders for accessibility
  - Hover effects provide visual feedback for interactive elements
  - Fixed position setup for reliable positioning across different viewports
  - Bounds detection prevents panels from moving off-screen
  - Panel state persists in session storage between refreshes

- **Config System**:
  - Uses controlStateManager.ts to persist UI panel positions and control values
  - Settings can be exported, reset, and cleared through UI
  - Provides fallback values when loading from storage fails
  - Automatic export functionality with "Export Config" button
  - Panel reset capability with "Fix Positions" button

- **Logging System**:
  - Log files stored in `logs/` directory with timestamps
  - Auto-rotation when logs exceed 500 lines
  - HTTP API for log access and management
  - Real-time monitoring with automatic refresh

## Last Session Accomplishments

- Enhanced control panel interaction and movement:
  - Implemented completely redesigned ResizablePanel component with improved drag & resize functionality
  - Fixed issues with panel movement that previously caused panels to snap or be constrained
  - Improved panel positioning with fixed positioning to prevent containment issues
  - Added larger, more accessible resize handles with hover effects for better usability
  - Created smarter bounds detection to prevent panels from moving off-screen
  - Added dedicated "Fix Positions" button for easy panel recovery
  - Updated controlState.json and fallbackState with better default panel positions
  - Made panels independently movable throughout the entire window

- Control panel UI improvements:
  - Separated controls into four distinct panels: Steering, Wheel Model, Shadow Surface, and Lighting
  - Adjusted wheel orientation to face upward by default (rotationX: 90 degrees)
  - Added rotationY and rotationZ controls for more flexible wheel positioning
  - Fixed proper panel state persistence between page refreshes
  - Ensured all control values are saved to session storage
  - Added subtle visual feedback for resize operations
  - Improved accessibility with larger touch targets

- Added 3D enhancements and technical fixes:
  - Implemented nested rotation components for X, Y, and Z axes
  - Improved model orientation with better default values
  - Made controls more responsive with immediate feedback
  - Adjusted TypeScript config to reduce over-strict parameter checking
  - Resolved all lint and TypeScript errors in the codebase
  - Added proper eslint-disable comments where needed
