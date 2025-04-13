# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository. Claude MUST follow the rules and guidelines in this file when making changes to the codebase.

## Build Commands
- `npm run dev` - Start development server (custom multi-panel version)
- `npm run dev:unified` - Start server with unified custom panel interface
- `npm run dev:combined` - Start server with combined custom panel interface
- `npm run dev:leva` - Start server with Leva's native panel interface
- `npm run build` - Build for production (custom multi-panel version)
- `npm run build:unified` - Build for production with unified custom panel interface
- `npm run build:combined` - Build for production with combined custom panel interface
- `npm run build:leva` - Build for production with Leva's native panel interface
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
  - Four panel design approaches available:
    1. **Multi-panel version**: Multiple independent custom floating panels
    2. **Unified panel version**: Multiple custom panels with ability to switch between them
    3. **Combined panel version**: Single custom panel with collapsible sections for all controls
    4. **Leva panel version**: Uses Leva's native UI with all controls in a unified panel with collapsible sections
  - Custom DraggablePanel component with collapsible UI
  - CollapsibleSection component for organizing controls into groups
  - Standardized UI controls:
    - SliderControl: Numeric sliders with min/max/step/precision
    - ColorControl: Color pickers with preview
    - ToggleControl: Boolean switches
    - VectorControl: 3D position ([x,y,z]) inputs
  - Panels are independently draggable, resizable, and collapsible
  - Resize handles appear outside panel borders for accessibility
  - Hover effects provide visual feedback for interactive elements
  - Fixed position setup for reliable positioning across different viewports
  - Bounds detection prevents panels from moving off-screen
  - Panel state (position, size, collapse) persists in session storage
  - Consistent UI with standardized numeric ranges and step values for all controls

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

- Implemented dual panel system approach:
  - Created a unified panel version with collapsible sections
  - Maintained original multi-panel version for comparison and preference
  - Added ability to switch between panel styles in the UI
  - Created CollapsibleSection component for organizing controls
  - Built UnifiedControlPanel component that combines sections in one panel
  - Made sections independently collapsible within the unified panel

- Enhanced control panel interaction and UI controls:
  - Implemented collapsible panels with persistent collapse state
  - Created standardized UI control components:
    - SliderControl: For all numeric range inputs with consistent styling and visual feedback
    - ColorControl: For color pickers with preview
    - ToggleControl: For boolean switches
    - VectorControl: For 3D position ([x,y,z]) inputs
  - Updated all panels to use the new control components
  - Added min, max, and step values for all sliders based on appropriate ranges
  - Persisted all panel states (position, collapse state) between page refreshes
  - Improved control organization and visual consistency across all panels
  - Added proper display precision and units for input values

- Technical enhancements:
  - Added new build commands for both panel versions
  - Updated Vite configuration to support multiple entry points
  - Created alternative UnifiedApp component
  - Improved component organization with proper exports from common/
  - Enhanced state management for panel positions and collapse states
  - Removed unnecessary console logs for cleaner code
  - Added appropriate TypeScript interfaces for all new components
  - Implemented react memo pattern for better performance
