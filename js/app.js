import { EventBus } from './core/EventBus.js';
import { CanvasManager } from './core/CanvasManager.js';
import { StateManager } from './core/StateManager.js';
import { ObjectManager } from './core/ObjectManager.js';
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
        this.objectManager = new ObjectManager(this.eventBus);
        
        this.components = {};
        this.currentTool = null;
        this.renderLoop = null;
        
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
            this.startRenderLoop();
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

        // Save/Load Project
        this.eventBus.on('action:save-project', () => {
            this.saveProject();
        });

        this.eventBus.on('action:load-project', () => {
            this.loadProject();
        });

        // Selection tool events
        this.eventBus.on('selection:activated', () => {
            this.eventBus.emit('objectManager:ready', this.objectManager);
        });

        // Object management
        this.eventBus.on('objects:changed', () => {
            this.redrawCanvas();
        });

        this.eventBus.on('canvas:redraw', () => {
            this.redrawCanvas();
        });

        // Keyboard shortcuts
        this.setupKeyboardShortcuts();

        // Window resize
        window.addEventListener('resize', () => {
            this.components.canvas.handleResize();
        });

        // Auto-save every 30 seconds
        this.setupAutoSave();
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
                        if (e.shiftKey) {
                            this.eventBus.emit('action:save-project');
                        } else {
                            this.eventBus.emit('action:export', 'png');
                        }
                        break;
                case 'o':
                        e.preventDefault();
                        this.eventBus.emit('action:load-project');
                        break;
                }
            }

            // Tool shortcuts
            switch (e.key) {
                case 'v':
                    this.eventBus.emit('tool:select', 'select');
                    break;
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
            select: './tools/SelectionTool.js',
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
        this.selectTool('select');
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

    /**
     * Save current project as JSON file
     */
    async saveProject() {
        try {
            const { ProjectUtils } = await import('./utils/ProjectUtils.js');
            const canvas = this.components.canvas.getCanvasElement();
            
            // Gather current application state
            const projectData = {
                title: prompt('Enter project name:', 'My Drawing') || 'Untitled Drawing',
                zoom: this.canvasManager.getZoom(),
                panX: this.canvasManager.panX,
                panY: this.canvasManager.panY,
                lastUsedTool: this.currentTool?.constructor.name || 'pen',
                toolSettings: this.components.propertiesPanel.getProperties()
            };
            
            const project = ProjectUtils.saveProject(canvas, projectData);
            
            // Create quick save backup
            ProjectUtils.createQuickSave(canvas, projectData);
            
            // Show success message
            this.showNotification('Project saved successfully!', 'success');
            
        } catch (error) {
            console.error('Save project failed:', error);
            this.showNotification('Failed to save project. Please try again.', 'error');
        }
    }

    /**
     * Load project from JSON file
     */
    async loadProject() {
        try {
            const { ProjectUtils } = await import('./utils/ProjectUtils.js');
            
            // Create file input
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.style.display = 'none';
            
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                try {
                    // Show loading state
                    this.showNotification('Loading project...', 'info');
                    
                    // Load project data
                    const projectData = await ProjectUtils.loadProject(file);
                    
                    // Apply to canvas
                    const canvas = this.components.canvas.getCanvasElement();
                    await ProjectUtils.applyProject(projectData, canvas, this.canvasManager);
                    
                    // Restore tool settings
                    if (projectData.tools?.toolSettings) {
                        this.components.propertiesPanel.setProperties(projectData.tools.toolSettings);
                    }
                    
                    // Switch to last used tool
                    if (projectData.tools?.lastUsedTool) {
                        const toolName = this.mapToolClassName(projectData.tools.lastUsedTool);
                        if (toolName) {
                            this.selectTool(toolName);
                        }
                    }
                    
                    // Update zoom display
                    this.eventBus.emit('zoom:changed', this.canvasManager.getZoom());
                    
                    // Clear undo/redo history and save new state
                    this.stateManager.clear();
                    this.stateManager.saveState(this.canvasManager.getCanvasState());
                    
                    // Show success message
                    this.showNotification(`Project "${projectData.metadata?.title || 'Untitled'}" loaded successfully!`, 'success');
                    
                } catch (error) {
                    console.error('Load project failed:', error);
                    this.showNotification('Failed to load project: ' + error.message, 'error');
                }
                
                // Clean up
                document.body.removeChild(input);
            };
            
            // Trigger file dialog
            document.body.appendChild(input);
            input.click();
            
        } catch (error) {
            console.error('Load project setup failed:', error);
            this.showNotification('Failed to setup project loading.', 'error');
        }
    }

    /**
     * Setup auto-save functionality
     */
    setupAutoSave() {
        // Auto-save every 30 seconds
        setInterval(() => {
            if (this.components.canvas && this.canvasManager) {
                try {
                    const canvas = this.components.canvas.getCanvasElement();
                    const projectData = {
                        zoom: this.canvasManager.getZoom(),
                        panX: this.canvasManager.panX,
                        panY: this.canvasManager.panY,
                        currentTool: this.currentTool?.constructor.name || 'pen'
                    };
                    
                    // Import and use ProjectUtils
                    import('./utils/ProjectUtils.js').then(({ ProjectUtils }) => {
                        ProjectUtils.createQuickSave(canvas, projectData);
                    });
                } catch (error) {
                    console.warn('Auto-save failed:', error);
                }
            }
        }, 30000); // 30 seconds

        // Try to restore from quick save on startup
        setTimeout(() => {
            this.tryRestoreQuickSave();
        }, 1000);
    }

    /**
     * Try to restore from quick save
     */
    async tryRestoreQuickSave() {
        try {
            const { ProjectUtils } = await import('./utils/ProjectUtils.js');
            const quickSave = ProjectUtils.loadQuickSave();
            
            if (quickSave && quickSave.timestamp) {
                const timeDiff = Date.now() - quickSave.timestamp;
                const hoursDiff = timeDiff / (1000 * 60 * 60);
                
                // Only restore if less than 24 hours old
                if (hoursDiff < 24) {
                    const restore = confirm('Found an auto-saved drawing from your last session. Would you like to restore it?');
                    
                    if (restore) {
                        const canvas = this.components.canvas.getCanvasElement();
                        
                        // Apply quick save
                        const img = new Image();
                        img.onload = () => {
                            this.canvasManager.setCanvasSize(quickSave.canvas.width, quickSave.canvas.height);
                            const ctx = canvas.getContext('2d');
                            ctx.clearRect(0, 0, canvas.width, canvas.height);
                            ctx.drawImage(img, 0, 0);
                            
                            // Restore state
                            if (quickSave.state) {
                                this.canvasManager.zoom = quickSave.state.zoom || 1;
                                this.canvasManager.panX = quickSave.state.panX || 0;
                                this.canvasManager.panY = quickSave.state.panY || 0;
                                this.canvasManager.updateTransform();
                                this.eventBus.emit('zoom:changed', this.canvasManager.getZoom());
                            }
                            
                            this.showNotification('Previous session restored!', 'success');
                        };
                        img.src = quickSave.canvas.dataURL;
                    }
                }
            }
        } catch (error) {
            console.warn('Quick save restore failed:', error);
        }
    }

    /**
     * Start render loop for object-based drawing
     */
    startRenderLoop() {
        this.isRedrawing = false;
        const render = () => {
            if (!this.isRedrawing) {
                this.redrawCanvas();
            }
            this.renderLoop = requestAnimationFrame(render);
        };
        render();
    }

    /**
     * Stop render loop
     */
    stopRenderLoop() {
        if (this.renderLoop) {
            cancelAnimationFrame(this.renderLoop);
            this.renderLoop = null;
        }
    }

    /**
     * Redraw canvas with all objects
     */
    redrawCanvas() {
        if (!this.canvasManager.canvas || this.isRedrawing) return;
        
        this.isRedrawing = true;
        
        const ctx = this.canvasManager.ctx;
        const canvas = this.canvasManager.canvas;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw all objects
        const objects = this.objectManager.getAllObjects();
        objects.forEach(obj => {
            if (obj.visible) {
                this.drawObject(obj);
            }
        });
        
        // Draw selection if selection tool is active
        if (this.currentTool && this.currentTool.constructor.name === 'SelectionTool') {
            this.drawSelectionBox();
        }
        
        this.isRedrawing = false;
    }

    /**
     * Draw selection box for selected object
     */
    drawSelectionBox() {
        const selectedObject = this.objectManager.getSelectedObject();
        if (!selectedObject) return;
        
        const bounds = this.objectManager.getObjectBounds(selectedObject);
        const ctx = this.canvasManager.ctx;
        
        ctx.save();
        
        // Draw selection outline
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(bounds.x - 2, bounds.y - 2, bounds.width + 4, bounds.height + 4);
        
        // Draw resize handles
        ctx.fillStyle = '#2563eb';
        ctx.setLineDash([]);
        
        const handleSize = 8;
        const handles = [
            { x: bounds.x, y: bounds.y },
            { x: bounds.x + bounds.width / 2, y: bounds.y },
            { x: bounds.x + bounds.width, y: bounds.y },
            { x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2 },
            { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
            { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height },
            { x: bounds.x, y: bounds.y + bounds.height },
            { x: bounds.x, y: bounds.y + bounds.height / 2 }
        ];
        
        handles.forEach(handle => {
            ctx.fillRect(
                handle.x - handleSize / 2,
                handle.y - handleSize / 2,
                handleSize,
                handleSize
            );
        });
        
        ctx.restore();
    }

    /**
     * Draw a single object
     * @param {Object} obj - Object to draw
     */
    drawObject(obj) {
        const ctx = this.canvasManager.ctx;
        ctx.save();
        
        // Apply object properties
        if (obj.properties) {
            ctx.strokeStyle = obj.properties.strokeColor || '#000000';
            ctx.fillStyle = obj.properties.fillColor || '#ffffff';
            ctx.lineWidth = obj.properties.strokeWidth || 2;
            ctx.lineCap = obj.properties.lineCap || 'round';
            ctx.lineJoin = obj.properties.lineJoin || 'round';
            if (obj.properties.opacity !== undefined) {
                ctx.globalAlpha = obj.properties.opacity;
            }
        }
        
        // Draw based on object type
        switch (obj.type) {
            case 'rectangle':
                if (obj.properties?.enableFill) {
                    ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
                }
                ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
                break;
                
            case 'circle':
                ctx.beginPath();
                ctx.arc(obj.x, obj.y, obj.radius, 0, 2 * Math.PI);
                if (obj.properties?.enableFill) {
                    ctx.fill();
                }
                ctx.stroke();
                break;
                
            case 'line':
                if (obj.points && obj.points.length >= 2) {
                    ctx.beginPath();
                    ctx.moveTo(obj.points[0].x, obj.points[0].y);
                    ctx.lineTo(obj.points[1].x, obj.points[1].y);
                    ctx.stroke();
                }
                break;
                
            case 'arrow':
                if (obj.points && obj.points.length >= 2) {
                    this.drawArrowObject(obj);
                }
                break;
                
            case 'freehand':
                if (obj.path && obj.path.length > 0) {
                    ctx.beginPath();
                    ctx.moveTo(obj.path[0].x, obj.path[0].y);
                    for (let i = 1; i < obj.path.length; i++) {
                        ctx.lineTo(obj.path[i].x, obj.path[i].y);
                    }
                    ctx.stroke();
                }
                break;
        }
        
        ctx.restore();
    }

    /**
     * Draw arrow object with arrowhead
     * @param {Object} obj - Arrow object
     */
    drawArrowObject(obj) {
        const ctx = this.canvasManager.ctx;
        const p1 = obj.points[0];
        const p2 = obj.points[1];
        
        // Draw line
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        
        // Draw arrowhead
        const headLength = 15;
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        
        ctx.beginPath();
        ctx.moveTo(p2.x, p2.y);
        ctx.lineTo(
            p2.x - headLength * Math.cos(angle - Math.PI / 6),
            p2.y - headLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(p2.x, p2.y);
        ctx.lineTo(
            p2.x - headLength * Math.cos(angle + Math.PI / 6),
            p2.y - headLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
    }

    /**
     * Map tool class name to tool identifier
     * @param {string} className - Tool class name
     * @returns {string} Tool identifier
     */
    mapToolClassName(className) {
        const mapping = {
            'SelectionTool': 'select',
            'PenTool': 'pen',
            'EraserTool': 'eraser',
            'RectangleTool': 'rectangle',
            'CircleTool': 'circle',
            'LineTool': 'line',
            'ArrowTool': 'arrow'
        };
        return mapping[className] || 'select';
    }

    /**
     * Show notification to user
     * @param {string} message - Message to show
     * @param {string} type - Notification type (success, error, info)
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.parentElement.removeChild(notification);
            }
        }, 3000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DrawingApp();
});
