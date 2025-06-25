import { BaseTool } from './BaseTool.js';

/**
 * Arrow tool for drawing arrows
 */
export default class ArrowTool extends BaseTool {
    constructor(eventBus, canvasManager) {
        super(eventBus, canvasManager);
        this.startPoint = null;
        this.arrowHeadSize = 15;
    }

    /**
     * Start drawing arrow
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {MouseEvent} event - Original mouse event
     */
    startDrawing(x, y, event) {
        this.startPoint = { x, y };
        this.saveCanvasState();
    }

    /**
     * Continue drawing arrow (show preview)
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {MouseEvent} event - Original mouse event
     */
    continueDrawing(x, y, event) {
        if (!this.startPoint) return;
        
        this.restoreCanvasState();
        this.drawArrowPreview(this.startPoint.x, this.startPoint.y, x, y);
    }

    /**
     * End drawing arrow
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {MouseEvent} event - Original mouse event
     */
    endDrawing(x, y, event) {
        if (!this.startPoint) return;
        
        this.restoreCanvasState();
        this.drawArrow(this.startPoint.x, this.startPoint.y, x, y);
        
        this.startPoint = null;
        this.eventBus.emit('canvas:change');
    }

    /**
     * Draw arrow preview
     * @param {number} x1 - Start X
     * @param {number} y1 - Start Y
     * @param {number} x2 - End X
     * @param {number} y2 - End Y
     */
    drawArrowPreview(x1, y1, x2, y2) {
        // Draw with lower opacity for preview
        const ctx = this.canvasManager.ctx;
        const originalOpacity = ctx.globalAlpha;
        ctx.globalAlpha = 0.5;
        
        this.canvasManager.drawArrow(x1, y1, x2, y2);
        
        ctx.globalAlpha = originalOpacity;
    }

    /**
     * Draw final arrow
     * @param {number} x1 - Start X
     * @param {number} y1 - Start Y
     * @param {number} x2 - End X
     * @param {number} y2 - End Y
     */
    drawArrow(x1, y1, x2, y2) {
        this.canvasManager.drawArrow(x1, y1, x2, y2);
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
     * Get arrow cursor
     * @returns {string} CSS cursor value
     */
    getCursor() {
        return 'crosshair';
    }

    /**
     * Activate arrow tool
     */
    activate() {
        super.activate();
        this.setCursor();
    }

    /**
     * Deactivate arrow tool
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
     * Update arrow properties
     * @param {Object} properties - Properties to update
     */
    updateProperties(properties) {
        super.updateProperties(properties);
        
        // Adjust arrow head size based on stroke width
        if (properties.strokeWidth) {
            this.arrowHeadSize = Math.max(10, properties.strokeWidth * 5);
        }
    }
}
