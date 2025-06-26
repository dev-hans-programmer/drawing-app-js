import { BaseTool } from './BaseTool.js';

/**
 * Selection tool for selecting, moving, and resizing objects
 */
export default class SelectionTool extends BaseTool {
    constructor(eventBus, canvasManager) {
        super(eventBus, canvasManager);
        this.objectManager = null;
        this.selectedObject = null;
        this.isMoving = false;
        this.isResizing = false;
        this.dragStartPoint = null;
        this.resizeHandle = null;
        this.selectionBox = null;
        
        // Resize handles
        this.handles = [];
        this.handleSize = 8;
        
        this.setupEventListeners();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        super.setupEventListeners();
        
        this.eventBus.on('object:selected', (object) => {
            this.selectedObject = object;
            this.updateSelectionBox();
        });

        this.eventBus.on('object:deselected', () => {
            this.selectedObject = null;
            this.clearSelectionBox();
        });

        this.eventBus.on('objectManager:ready', (objectManager) => {
            this.objectManager = objectManager;
        });
    }

    /**
     * Start selection/manipulation
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {MouseEvent} event - Original mouse event
     */
    startDrawing(x, y, event) {
        if (!this.objectManager) return;

        this.dragStartPoint = { x, y };
        
        // Check if clicking on resize handle
        if (this.selectedObject) {
            const handle = this.getResizeHandleAt(x, y);
            if (handle) {
                this.isResizing = true;
                this.resizeHandle = handle;
                return;
            }
            
            // Check if clicking on selected object (for moving)
            if (this.objectManager.isPointInObject(x, y, this.selectedObject)) {
                this.isMoving = true;
                return;
            }
        }
        
        // Try to select an object
        const clickedObject = this.objectManager.getObjectAtPosition(x, y);
        if (clickedObject) {
            this.objectManager.selectObject(clickedObject.id);
        } else {
            this.objectManager.deselectAll();
        }
    }

    /**
     * Continue selection/manipulation
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {MouseEvent} event - Original mouse event
     */
    continueDrawing(x, y, event) {
        if (!this.dragStartPoint) return;

        const deltaX = x - this.dragStartPoint.x;
        const deltaY = y - this.dragStartPoint.y;

        if (this.isMoving && this.selectedObject) {
            // Move the selected object
            this.objectManager.moveObject(this.selectedObject.id, deltaX, deltaY);
            this.dragStartPoint = { x, y };
            
        } else if (this.isResizing && this.selectedObject) {
            // Resize the selected object
            this.resizeSelectedObject(x, y);
            
        } else if (!this.selectedObject) {
            // Draw selection rectangle (for multi-select in future)
            this.drawSelectionRectangle(this.dragStartPoint.x, this.dragStartPoint.y, x, y);
        }
    }

    /**
     * End selection/manipulation
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {MouseEvent} event - Original mouse event
     */
    endDrawing(x, y, event) {
        if (this.isMoving || this.isResizing) {
            // Emit canvas change for undo/redo
            this.eventBus.emit('canvas:change');
        }
        
        this.isMoving = false;
        this.isResizing = false;
        this.resizeHandle = null;
        this.dragStartPoint = null;
        
        // Clear selection rectangle
        this.clearSelectionRectangle();
    }

    /**
     * Handle hover to show resize cursors
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {MouseEvent} event - Original mouse event
     */
    onHover(x, y, event) {
        if (!this.selectedObject) {
            this.setCursor('default');
            return;
        }
        
        const handle = this.getResizeHandleAt(x, y);
        if (handle) {
            this.setCursor(this.getResizeCursor(handle.type));
        } else if (this.objectManager.isPointInObject(x, y, this.selectedObject)) {
            this.setCursor('move');
        } else {
            this.setCursor('default');
        }
    }

    /**
     * Get resize handle at position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {Object|null} Handle or null
     */
    getResizeHandleAt(x, y) {
        if (!this.selectedObject) return null;
        
        const bounds = this.objectManager.getObjectBounds(this.selectedObject);
        const handles = this.getResizeHandles(bounds);
        
        for (const handle of handles) {
            const distance = Math.sqrt(
                Math.pow(x - handle.x, 2) + Math.pow(y - handle.y, 2)
            );
            if (distance <= this.handleSize) {
                return handle;
            }
        }
        
        return null;
    }

    /**
     * Get resize handles for bounds
     * @param {Object} bounds - Object bounds
     * @returns {Array} Array of handles
     */
    getResizeHandles(bounds) {
        const { x, y, width, height } = bounds;
        
        return [
            { type: 'nw', x: x, y: y },
            { type: 'n', x: x + width / 2, y: y },
            { type: 'ne', x: x + width, y: y },
            { type: 'e', x: x + width, y: y + height / 2 },
            { type: 'se', x: x + width, y: y + height },
            { type: 's', x: x + width / 2, y: y + height },
            { type: 'sw', x: x, y: y + height },
            { type: 'w', x: x, y: y + height / 2 }
        ];
    }

    /**
     * Get cursor for resize handle
     * @param {string} handleType - Handle type
     * @returns {string} CSS cursor
     */
    getResizeCursor(handleType) {
        const cursors = {
            'nw': 'nw-resize',
            'n': 'n-resize',
            'ne': 'ne-resize',
            'e': 'e-resize',
            'se': 'se-resize',
            's': 's-resize',
            'sw': 'sw-resize',
            'w': 'w-resize'
        };
        return cursors[handleType] || 'default';
    }

    /**
     * Resize selected object
     * @param {number} x - Current X
     * @param {number} y - Current Y
     */
    resizeSelectedObject(x, y) {
        if (!this.resizeHandle || !this.selectedObject) return;
        
        const bounds = this.objectManager.getObjectBounds(this.selectedObject);
        const handle = this.resizeHandle.type;
        
        let newBounds = { ...bounds };
        
        switch (handle) {
            case 'nw':
                newBounds.width = bounds.x + bounds.width - x;
                newBounds.height = bounds.y + bounds.height - y;
                newBounds.x = x;
                newBounds.y = y;
                break;
            case 'n':
                newBounds.height = bounds.y + bounds.height - y;
                newBounds.y = y;
                break;
            case 'ne':
                newBounds.width = x - bounds.x;
                newBounds.height = bounds.y + bounds.height - y;
                newBounds.y = y;
                break;
            case 'e':
                newBounds.width = x - bounds.x;
                break;
            case 'se':
                newBounds.width = x - bounds.x;
                newBounds.height = y - bounds.y;
                break;
            case 's':
                newBounds.height = y - bounds.y;
                break;
            case 'sw':
                newBounds.width = bounds.x + bounds.width - x;
                newBounds.height = y - bounds.y;
                newBounds.x = x;
                break;
            case 'w':
                newBounds.width = bounds.x + bounds.width - x;
                newBounds.x = x;
                break;
        }
        
        // Apply minimum size constraints
        newBounds.width = Math.max(10, newBounds.width);
        newBounds.height = Math.max(10, newBounds.height);
        
        // Update object
        this.applyNewBounds(this.selectedObject, newBounds);
    }

    /**
     * Apply new bounds to object
     * @param {Object} object - Object to update
     * @param {Object} newBounds - New bounds
     */
    applyNewBounds(object, newBounds) {
        const scaleX = newBounds.width / (object.width || 1);
        const scaleY = newBounds.height / (object.height || 1);
        
        object.x = newBounds.x;
        object.y = newBounds.y;
        object.width = newBounds.width;
        object.height = newBounds.height;
        
        // Handle special object types
        switch (object.type) {
            case 'circle':
                object.radius = Math.min(newBounds.width, newBounds.height) / 2;
                object.x = newBounds.x + newBounds.width / 2;
                object.y = newBounds.y + newBounds.height / 2;
                break;
                
            case 'line':
            case 'arrow':
                if (object.points && object.points.length >= 2) {
                    const p1 = object.points[0];
                    const p2 = object.points[1];
                    object.points[0] = { x: newBounds.x, y: newBounds.y };
                    object.points[1] = { 
                        x: newBounds.x + newBounds.width, 
                        y: newBounds.y + newBounds.height 
                    };
                }
                break;
        }
        
        this.eventBus.emit('objects:changed');
    }

    /**
     * Update selection box display
     */
    updateSelectionBox() {
        // Selection box is now drawn by the main render loop
        // No need to do anything here to prevent recursion
    }

    /**
     * Draw selection box
     * @param {Object} bounds - Object bounds
     */
    drawSelectionBox(bounds) {
        // This method is no longer used - selection box is drawn in main app
    }

    /**
     * Clear selection box
     */
    clearSelectionBox() {
        // Selection box clearing is handled by main render loop
        // No need to emit redraw events to prevent recursion
    }

    /**
     * Draw selection rectangle
     * @param {number} x1 - Start X
     * @param {number} y1 - Start Y
     * @param {number} x2 - End X
     * @param {number} y2 - End Y
     */
    drawSelectionRectangle(x1, y1, x2, y2) {
        const ctx = this.canvasManager.ctx;
        ctx.save();
        
        ctx.strokeStyle = '#2563eb';
        ctx.fillStyle = 'rgba(37, 99, 235, 0.1)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        
        const width = x2 - x1;
        const height = y2 - y1;
        
        ctx.fillRect(x1, y1, width, height);
        ctx.strokeRect(x1, y1, width, height);
        
        ctx.restore();
    }

    /**
     * Clear selection rectangle
     */
    clearSelectionRectangle() {
        // Selection rectangle clearing is handled by main render loop
    }

    /**
     * Handle delete key
     */
    onKeyDown(event) {
        if (event.key === 'Delete' || event.key === 'Backspace') {
            if (this.selectedObject) {
                this.objectManager.deleteObject(this.selectedObject.id);
            }
        }
    }

    /**
     * Get selection cursor
     * @returns {string} CSS cursor value
     */
    getCursor() {
        return 'default';
    }

    /**
     * Activate selection tool
     */
    activate() {
        super.activate();
        
        // Add keyboard listener for delete
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        
        // Request object manager from app
        this.eventBus.emit('selection:activated');
    }

    /**
     * Deactivate selection tool
     */
    deactivate() {
        super.deactivate();
        
        // Remove keyboard listener
        document.removeEventListener('keydown', this.onKeyDown.bind(this));
        
        // Clear selection
        if (this.objectManager) {
            this.objectManager.deselectAll();
        }
        
        this.clearSelectionBox();
    }
}