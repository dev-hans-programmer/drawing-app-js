# Drawing App

## Overview

This is a modern web-based drawing application built with vanilla JavaScript using a modular component architecture. The application provides a complete drawing experience with multiple tools, real-time canvas manipulation, and a clean user interface. It's designed as a client-side only application that runs in the browser without requiring a backend database.

## System Architecture

### Frontend Architecture
- **Pure JavaScript ES6+ Modules**: No external frameworks, using native ES6 modules for modular code organization
- **Component-Based Architecture**: Self-contained components that communicate through an event bus
- **Event-Driven Communication**: Decoupled components using the observer pattern via EventBus
- **Canvas-Based Drawing**: HTML5 Canvas API for high-performance drawing operations
- **Responsive CSS Grid Layout**: Modern CSS Grid for flexible layout management

### Key Design Patterns
- **Observer Pattern**: EventBus enables loose coupling between components
- **Strategy Pattern**: Tool system allows easy addition of new drawing tools
- **Command Pattern**: State management for undo/redo functionality
- **Module Pattern**: ES6 modules for code organization and encapsulation

## Key Components

### Core Modules
1. **EventBus** (`js/core/EventBus.js`)
   - Central communication hub for all components
   - Implements publish-subscribe pattern
   - Provides `on()`, `once()`, and `emit()` methods for event handling

2. **CanvasManager** (`js/core/CanvasManager.js`)
   - Manages HTML5 canvas operations and state
   - Handles zoom, pan, and drawing transformations
   - Maintains drawing properties (colors, stroke width, etc.)

3. **StateManager** (`js/core/StateManager.js`)
   - Implements undo/redo functionality
   - Manages application state history (max 50 states)
   - Provides state persistence and restoration

### UI Components
1. **Toolbar** (`js/components/Toolbar.js`)
   - Main toolbar with tool selection and actions
   - Displays current tool state and undo/redo availability
   - Handles tool switching and action dispatching

2. **Canvas** (`js/components/Canvas.js`)
   - Drawing area container with zoom controls
   - Manages canvas interaction events (mouse, touch)
   - Provides zoom in/out functionality

3. **PropertiesPanel** (`js/components/PropertiesPanel.js`)
   - Tool-specific property configuration
   - Stroke color, fill color, width, and opacity controls
   - Dynamic UI based on selected tool

### Drawing Tools
All tools extend the `BaseTool` class and implement a consistent interface:

1. **PenTool** - Freehand drawing with smoothing
2. **LineTool** - Straight line drawing with preview
3. **RectangleTool** - Rectangle drawing with optional fill
4. **CircleTool** - Circle/ellipse drawing
5. **ArrowTool** - Arrow drawing with customizable head size
6. **EraserTool** - Content removal with configurable size

### Utility Modules
1. **CanvasUtils** - Mathematical utilities for canvas operations
2. **ExportUtils** - Canvas export functionality (PNG, JPEG, SVG)

## Data Flow

1. **User Interaction**: User interacts with toolbar or canvas
2. **Event Emission**: Component emits event via EventBus
3. **Event Processing**: Relevant components receive and process events
4. **State Updates**: StateManager tracks changes for undo/redo
5. **Canvas Rendering**: CanvasManager performs drawing operations
6. **UI Updates**: Components update their visual state

### Example Flow - Tool Selection
```
User clicks tool → Toolbar emits 'tool:selected' → 
CanvasManager switches active tool → PropertiesPanel updates properties → 
UI reflects new tool state
```

## External Dependencies

### CDN Dependencies
- **Feather Icons** (4.29.0): Icon library for UI buttons and controls
  - Used for consistent, lightweight SVG icons throughout the interface

### No Database Required
- All drawing data exists in browser memory and canvas
- Export functionality saves drawings as image files
- No user accounts or persistent storage implemented

## Deployment Strategy

### Development Server
- Uses Python's built-in HTTP server on port 5000
- Configured via `.replit` workflow for easy development
- Serves static files directly from root directory

### Production Deployment
The application can be deployed to any static hosting service:
- **GitHub Pages**: Direct deployment from repository
- **Netlify/Vercel**: Automatic deployment with build optimizations
- **AWS S3/CloudFront**: Scalable static hosting
- **Any Web Server**: Apache, Nginx, or similar

### Build Considerations
- No build process required - uses native ES6 modules
- Modern browsers required for ES6 module support
- Consider bundling for older browser support if needed

### Performance Optimizations
- Lazy loading of tool modules
- Canvas state caching for undo/redo
- Efficient event handling with proper cleanup
- Responsive design for mobile devices

## Changelog
- June 26, 2025: Fixed eraser icon issue, added comprehensive README with local setup instructions
- June 25, 2025: Initial setup with complete modular drawing application

## Recent Changes
✓ Fixed toolbar eraser icon (changed from 'eraser' to 'delete' for Feather Icons compatibility)
✓ Created comprehensive README.md with multiple local setup methods
✓ Application successfully tested and working with all core features
✓ Confirmed cross-browser compatibility and responsive design

## User Preferences

Preferred communication style: Simple, everyday language.
Local development: Prefers simple setup without complex build processes.