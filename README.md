# Drawing App - Web-Based Drawing & Diagramming Tool

A modern, modular drawing application built with vanilla JavaScript, similar to Eraser.io. Features a complete set of drawing tools, canvas manipulation, and a responsive design.

## 🚀 Quick Start

### Running Locally

This is a client-side only application that requires no build process or backend server. You can run it locally using any of these methods:

#### Method 1: Python HTTP Server (Recommended)
```bash
# Navigate to the project directory
cd drawing-app

# Python 3
python -m http.server 5000

# Python 2 (if needed)
python -m SimpleHTTPServer 5000

# Open in browser
open http://localhost:5000
```

#### Method 2: Node.js HTTP Server
```bash
# Install a simple HTTP server globally
npm install -g http-server

# Navigate to project directory and start server
cd drawing-app
http-server -p 5000

# Open in browser
open http://localhost:5000
```

#### Method 3: PHP Built-in Server
```bash
# Navigate to project directory
cd drawing-app

# Start PHP server
php -S localhost:5000

# Open in browser
open http://localhost:5000
```

#### Method 4: Live Server (VS Code Extension)
1. Install the "Live Server" extension in VS Code
2. Open the project folder in VS Code
3. Right-click on `index.html`
4. Select "Open with Live Server"

### Browser Requirements

- Modern browser with ES6+ support (Chrome 61+, Firefox 60+, Safari 12+, Edge 79+)
- JavaScript must be enabled
- Recommended: Chrome or Firefox for best performance

## 🎨 Features

### Drawing Tools
- **Pen Tool (P)** - Freehand drawing with pressure simulation
- **Eraser Tool (E)** - Remove drawn content with customizable size
- **Rectangle Tool (R)** - Draw rectangles with optional fill
- **Circle Tool (C)** - Draw circles and ellipses
- **Line Tool (L)** - Straight lines with angle constraints (hold Shift)
- **Arrow Tool (A)** - Directional arrows with automatic head sizing

### Canvas Features
- **Zoom & Pan** - Mouse wheel zoom, drag to pan
- **Infinite Canvas** - Smooth zoom from 10% to 500%
- **Grid Background** - Visual reference grid
- **Responsive Design** - Works on desktop, tablet, and mobile

### Interface
- **Properties Panel** - Adjust colors, stroke width, opacity
- **Toolbar** - Quick tool selection and actions
- **Keyboard Shortcuts** - Fast workflow with hotkeys
- **Undo/Redo** - Full history management (50 steps)

## ⌨️ Keyboard Shortcuts

### Tools
- `P` - Pen tool
- `E` - Eraser tool
- `R` - Rectangle tool
- `C` - Circle tool
- `L` - Line tool
- `A` - Arrow tool

### Actions
- `Ctrl/Cmd + Z` - Undo
- `Ctrl/Cmd + Y` or `Ctrl/Cmd + Shift + Z` - Redo
- `Ctrl/Cmd + S` - Export as PNG
- `Space + Drag` - Pan canvas
- `Ctrl + Click + Drag` - Pan canvas
- `Shift + Line Tool` - Constrain to angles

### Canvas
- `Mouse Wheel` - Zoom in/out
- `Middle Mouse + Drag` - Pan canvas

## 📁 Project Structure

```
drawing-app/
├── index.html              # Main HTML file
├── css/
│   ├── main.css            # Global styles and utilities
│   └── components.css      # Component-specific styles
├── js/
│   ├── app.js              # Main application entry point
│   ├── core/
│   │   ├── EventBus.js     # Event system for component communication
│   │   ├── CanvasManager.js # Canvas operations and state
│   │   └── StateManager.js  # Undo/redo functionality
│   ├── components/
│   │   ├── Toolbar.js      # Main toolbar component
│   │   ├── Canvas.js       # Canvas container and controls
│   │   └── PropertiesPanel.js # Tool properties configuration
│   ├── tools/
│   │   ├── BaseTool.js     # Base class for all tools
│   │   ├── PenTool.js      # Freehand drawing
│   │   ├── EraserTool.js   # Content removal
│   │   ├── RectangleTool.js # Rectangle drawing
│   │   ├── CircleTool.js   # Circle drawing
│   │   ├── LineTool.js     # Line drawing
│   │   └── ArrowTool.js    # Arrow drawing
│   └── utils/
│       ├── CanvasUtils.js  # Canvas mathematical utilities
│       └── ExportUtils.js  # Export functionality
└── README.md               # This file
```

## 🏗️ Architecture

### Event-Driven Design
The application uses a central EventBus for component communication, ensuring loose coupling and maintainability.

### Modular Components
- **Core System** - EventBus, CanvasManager, StateManager
- **UI Components** - Toolbar, Canvas, PropertiesPanel
- **Tools System** - Extensible tool architecture
- **Utilities** - Reusable helper functions

### Key Design Patterns
- **Observer Pattern** - EventBus for component communication
- **Strategy Pattern** - Interchangeable drawing tools
- **Command Pattern** - Undo/redo state management
- **Module Pattern** - ES6 modules for organization

## 🛠️ Development

### Adding New Tools
1. Create a new tool class extending `BaseTool`
2. Implement required methods: `startDrawing`, `continueDrawing`, `endDrawing`
3. Add tool to the toolbar configuration
4. Register tool in the app's tool map

### Extending Functionality
- **New Export Formats** - Extend `ExportUtils` class
- **Additional UI Components** - Follow existing component pattern
- **Custom Cursors** - Implement in tool's `getCursor()` method

### Browser Testing
- Chrome 61+ ✅
- Firefox 60+ ✅
- Safari 12+ ✅
- Edge 79+ ✅

## 📱 Mobile Support

The application is fully responsive and supports touch devices:
- Touch drawing on mobile/tablet
- Responsive layout that hides sidebars on small screens
- Touch-friendly controls and gestures

## 🚀 Deployment

### Static Hosting
Deploy to any static hosting service:
- **GitHub Pages** - Push to gh-pages branch
- **Netlify** - Drag and drop or connect repository
- **Vercel** - Connect GitHub repository
- **AWS S3** - Upload files to S3 bucket with static hosting

### No Build Required
This application uses native ES6 modules and requires no build process or bundling.

## 🐛 Troubleshooting

### Common Issues

**Application won't load:**
- Ensure you're serving over HTTP/HTTPS (not file://)
- Check browser console for JavaScript errors
- Verify all files are in correct directory structure

**Tools not working:**
- Check browser console for module loading errors
- Ensure browser supports ES6 modules
- Try clearing browser cache

**Performance issues:**
- Reduce canvas size for better performance
- Clear canvas history if using for extended periods
- Consider using latest Chrome or Firefox

## 📄 License

MIT License - Feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

This is a demonstration project, but contributions are welcome:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Enjoy creating with your new drawing app!** 🎨