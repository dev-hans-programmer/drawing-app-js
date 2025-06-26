import { EventBus } from './core/EventBus.js';
import { CanvasManager } from './core/CanvasManager.js';
import { StateManager } from './core/StateManager.js';
import { Toolbar } from './components/Toolbar.js';
import { Canvas } from './components/Canvas.js';
import { PropertiesPanel } from './components/PropertiesPanel.js';

/**
 * Main application class that orchestrates all components
 */
class DrawingApp {
    constructor() {
        this.eventBus = new EventBus();
        this.stateManager = new StateManager(this.eventBus);
        this.canvasManager = new CanvasManager(this.eventBus);
        
        this.components = {};
        this.currentTool = null;
        
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        this.createComponents();
        this.setupEventListeners();
        this.selectDefaultTool();
    }

    /**
     * Create and mount all components
     */
    createComponents() {
        const appContainer = document.getElementById('app');
        
        // Create components
        this.components.toolbar = new Toolbar(this.eventBus);
        this.components.canvas = new Canvas(this.eventBus, this.canvasManager);
        this.components.propertiesPanel = new PropertiesPanel(this.eventBus);

        // Mount components
        appContainer.appendChild(this.components.toolbar.mount());
        appContainer.appendChild(this.components.canvas.mount());
        appContainer.appendChild(this.components.propertiesPanel.mount());

        // Initialize canvas manager with the canvas element after a brief delay
        // to ensure DOM has settled and container has proper dimensions
        setTimeout(() => {
            this.canvasManager.init(this.components.canvas.getCanvasElement());
        }, 100);
    }

    /**
     * Setup global event listeners
     */
    setupEventListeners() {
        // Tool selection
        this.eventBus.on('tool:select', (toolName) => {
            this.selectTool(toolName);
        });

        // Canvas state changes
        this.eventBus.on('canvas:change', () => {
            this.stateManager.saveState(this.canvasManager.getCanvasState());
        });

        // Undo/Redo
        this.eventBus.on('action:undo', () => {
            const state = this.stateManager.undo();
            if (state) {
                this.canvasManager.restoreState(state);
            }
        });

        this.eventBus.on('action:redo', () => {
            const state = this.stateManager.redo();
            if (state) {
                this.canvasManager.restoreState(state);
            }
        });

        // Clear canvas
        this.eventBus.on('action:clear', () => {
            this.canvasManager.clear();
            this.eventBus.emit('canvas:change');
        });

        // Export
        this.eventBus.on('action:export', (format) => {
            this.exportCanvas(format);
        });

        // Keyboard shortcuts
        this.setupKeyboardShortcuts();

        // Window resize
        window.addEventListener('resize', () => {
            this.components.canvas.handleResize();
        });
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Prevent default for app shortcuts
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'z':
                        e.preventDefault();
                        if (e.shiftKey) {
                            this.eventBus.emit('action:redo');
                        } else {
                            this.eventBus.emit('action:undo');
                        }
                        break;
                    case 'y':
                        e.preventDefault();
                        this.eventBus.emit('action:redo');
                        break;
                    case 's':
                        e.preventDefault();
                        this.eventBus.emit('action:export', 'png');
                        break;
                }
            }

            // Tool shortcuts
            switch (e.key) {
                case 'p':
                    this.eventBus.emit('tool:select', 'pen');
                    break;
                case 'e':
                    this.eventBus.emit('tool:select', 'eraser');
                    break;
                case 'r':
                    this.eventBus.emit('tool:select', 'rectangle');
                    break;
                case 'c':
                    this.eventBus.emit('tool:select', 'circle');
                    break;
                case 'l':
                    this.eventBus.emit('tool:select', 'line');
                    break;
                case 'a':
                    this.eventBus.emit('tool:select', 'arrow');
                    break;
            }
        });
    }

    /**
     * Select a drawing tool
     * @param {string} toolName - Name of the tool to select
     */
    async selectTool(toolName) {
        if (this.currentTool) {
            this.currentTool.deactivate();
        }

        try {
            const toolModule = await this.loadTool(toolName);
            this.currentTool = new toolModule.default(this.eventBus, this.canvasManager);
            this.currentTool.activate();
            
            this.eventBus.emit('tool:selected', toolName);
        } catch (error) {
            console.error(`Failed to load tool: ${toolName}`, error);
        }
    }

    /**
     * Dynamically load a tool module
     * @param {string} toolName - Name of the tool to load
     * @returns {Promise<Object>} Tool module
     */
    async loadTool(toolName) {
        const toolMap = {
            pen: './tools/PenTool.js',
            eraser: './tools/EraserTool.js',
            rectangle: './tools/RectangleTool.js',
            circle: './tools/CircleTool.js',
            line: './tools/LineTool.js',
            arrow: './tools/ArrowTool.js'
        };

        if (!toolMap[toolName]) {
            throw new Error(`Unknown tool: ${toolName}`);
        }

        return await import(toolMap[toolName]);
    }

    /**
     * Select the default tool
     */
    selectDefaultTool() {
        this.selectTool('pen');
    }

    /**
     * Export canvas as image
     * @param {string} format - Export format (png, jpg, svg)
     */
    async exportCanvas(format = 'png') {
        try {
            const { ExportUtils } = await import('./utils/ExportUtils.js');
            const canvas = this.components.canvas.getCanvasElement();
            
            ExportUtils.exportCanvas(canvas, format);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed. Please try again.');
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DrawingApp();
});
