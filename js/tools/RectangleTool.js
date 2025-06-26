import { BaseTool } from './BaseTool.js';

/**
 * Rectangle tool for drawing rectangles
 */
export default class RectangleTool extends BaseTool {
    constructor(eventBus, canvasManager) {
        super(eventBus, canvasManager);
        this.startPoint = null;
        this.previewCanvas = null;
        this.previewCtx = null;
        this.enableFill = false;
    }

    /**
     * Start drawing rectangle
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {MouseEvent} event - Original mouse event
     */
    startDrawing(x, y, event) {
        this.startPoint = { x, y };
        this.createPreviewCanvas();
        this.saveCanvasState();
    }

    /**
     * Continue drawing rectangle (show preview)
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {MouseEvent} event - Original mouse event
     */
    continueDrawing(x, y, event) {
        if (!this.startPoint) return;
        
        this.restoreCanvasState();
        this.drawRectanglePreview(this.startPoint.x, this.startPoint.y, x, y);
    }

    /**
     * End drawing rectangle
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {MouseEvent} event - Original mouse event
     */
    endDrawing(x, y, event) {
        if (!this.startPoint) return;
        
        this.restoreCanvasState();
        
        // Create object instead of drawing directly
        const width = x - this.startPoint.x;
        const height = y - this.startPoint.y;
        
        const object = {
            type: 'rectangle',
            x: Math.min(this.startPoint.x, x),
            y: Math.min(this.startPoint.y, y),
            width: Math.abs(width),
            height: Math.abs(height),
            properties: {
                strokeColor: this.properties.strokeColor,
                fillColor: this.properties.fillColor,
                strokeWidth: this.properties.strokeWidth,
                enableFill: this.enableFill,
                opacity: this.properties.opacity || 1
            }
        };
        
        // Add to object manager
        this.eventBus.emit('object:add', object);
        
        this.startPoint = null;
        this.removePreviewCanvas();
        this.eventBus.emit('canvas:change');
    }

    /**
     * Draw rectangle preview
     * @param {number} x1 - Start X
     * @param {number} y1 - Start Y
     * @param {number} x2 - End X
     * @param {number} y2 - End Y
     */
    drawRectanglePreview(x1, y1, x2, y2) {
        const width = x2 - x1;
        const height = y2 - y1;
        
        // Draw with lower opacity for preview
        const ctx = this.canvasManager.ctx;
        const originalOpacity = ctx.globalAlpha;
        ctx.globalAlpha = 0.5;
        
        this.canvasManager.drawRectangle(x1, y1, width, height, this.enableFill);
        
        ctx.globalAlpha = originalOpacity;
    }

    /**
     * Draw final rectangle
     * @param {number} x1 - Start X
     * @param {number} y1 - Start Y
     * @param {number} x2 - End X
     * @param {number} y2 - End Y
     */
    drawRectangle(x1, y1, x2, y2) {
        const width = x2 - x1;
        const height = y2 - y1;
        
        this.canvasManager.drawRectangle(x1, y1, width, height, this.enableFill);
    }

    /**
     * Create preview canvas for temporary drawing
     */
    createPreviewCanvas() {
        // We'll use the main canvas but save/restore state
        // This is simpler than creating a separate canvas
    }

    /**
     * Remove preview canvas
     */
    removePreviewCanvas() {
        // Cleanup if needed
    }

    /**
     * Save canvas state for preview
     */
    saveCanvasState() {
        this.savedState = this.canvasManager.getCanvasState();
    }

    /**
     * Restore canvas state for preview
     */
    restoreCanvasState() {
        if (this.savedState) {
            this.canvasManager.restoreState(this.savedState);
        }
    }

    /**
     * Get rectangle cursor
     * @returns {string} CSS cursor value
     */
    getCursor() {
        return 'crosshair';
    }

    /**
     * Activate rectangle tool
     */
    activate() {
        super.activate();
        this.setCursor();
    }

    /**
     * Deactivate rectangle tool
     */
    deactivate() {
        super.deactivate();
        
        if (this.isDrawing) {
            this.restoreCanvasState();
            this.startPoint = null;
            this.isDrawing = false;
        }
    }

    /**
     * Update rectangle properties
     * @param {Object} properties - Properties to update
     */
    updateProperties(properties) {
        super.updateProperties(properties);
        
        if (properties.enableFill !== undefined) {
            this.enableFill = properties.enableFill;
        }
    }
}
