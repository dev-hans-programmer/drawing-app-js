import { BaseTool } from './BaseTool.js';

/**
 * Circle tool for drawing circles and ellipses
 */
export default class CircleTool extends BaseTool {
    constructor(eventBus, canvasManager) {
        super(eventBus, canvasManager);
        this.startPoint = null;
        this.enableFill = false;
    }

    /**
     * Start drawing circle
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {MouseEvent} event - Original mouse event
     */
    startDrawing(x, y, event) {
        this.startPoint = { x, y };
        this.saveCanvasState();
    }

    /**
     * Continue drawing circle (show preview)
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {MouseEvent} event - Original mouse event
     */
    continueDrawing(x, y, event) {
        if (!this.startPoint) return;
        
        this.restoreCanvasState();
        this.drawCirclePreview(this.startPoint.x, this.startPoint.y, x, y);
    }

    /**
     * End drawing circle
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {MouseEvent} event - Original mouse event
     */
    endDrawing(x, y, event) {
        if (!this.startPoint) return;
        
        this.restoreCanvasState();
        
        // Create object instead of drawing directly
        const centerX = (this.startPoint.x + x) / 2;
        const centerY = (this.startPoint.y + y) / 2;
        const radius = Math.sqrt(Math.pow(x - this.startPoint.x, 2) + Math.pow(y - this.startPoint.y, 2)) / 2;
        
        const object = {
            type: 'circle',
            x: centerX,
            y: centerY,
            radius: radius,
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
        this.eventBus.emit('canvas:change');
    }

    /**
     * Draw circle preview
     * @param {number} x1 - Start X
     * @param {number} y1 - Start Y
     * @param {number} x2 - Current X
     * @param {number} y2 - Current Y
     */
    drawCirclePreview(x1, y1, x2, y2) {
        const centerX = (x1 + x2) / 2;
        const centerY = (y1 + y2) / 2;
        const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)) / 2;
        
        // Draw with lower opacity for preview
        const ctx = this.canvasManager.ctx;
        const originalOpacity = ctx.globalAlpha;
        ctx.globalAlpha = 0.5;
        
        this.canvasManager.drawCircle(centerX, centerY, radius, this.enableFill);
        
        ctx.globalAlpha = originalOpacity;
    }

    /**
     * Draw final circle
     * @param {number} x1 - Start X
     * @param {number} y1 - Start Y
     * @param {number} x2 - End X
     * @param {number} y2 - End Y
     */
    drawCircle(x1, y1, x2, y2) {
        const centerX = (x1 + x2) / 2;
        const centerY = (y1 + y2) / 2;
        const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)) / 2;
        
        if (radius > 0) {
            this.canvasManager.drawCircle(centerX, centerY, radius, this.enableFill);
        }
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
     * Get circle cursor
     * @returns {string} CSS cursor value
     */
    getCursor() {
        return 'crosshair';
    }

    /**
     * Activate circle tool
     */
    activate() {
        super.activate();
        this.setCursor();
    }

    /**
     * Deactivate circle tool
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
     * Update circle properties
     * @param {Object} properties - Properties to update
     */
    updateProperties(properties) {
        super.updateProperties(properties);
        
        if (properties.enableFill !== undefined) {
            this.enableFill = properties.enableFill;
        }
    }
}
