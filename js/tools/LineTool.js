import { BaseTool } from './BaseTool.js';

/**
 * Line tool for drawing straight lines
 */
export default class LineTool extends BaseTool {
    constructor(eventBus, canvasManager) {
        super(eventBus, canvasManager);
        this.startPoint = null;
    }

    /**
     * Start drawing line
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {MouseEvent} event - Original mouse event
     */
    startDrawing(x, y, event) {
        this.startPoint = { x, y };
        this.saveCanvasState();
    }

    /**
     * Continue drawing line (show preview)
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {MouseEvent} event - Original mouse event
     */
    continueDrawing(x, y, event) {
        if (!this.startPoint) return;
        
        this.restoreCanvasState();
        this.drawLinePreview(this.startPoint.x, this.startPoint.y, x, y);
    }

    /**
     * End drawing line
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {MouseEvent} event - Original mouse event
     */
    endDrawing(x, y, event) {
        if (!this.startPoint) return;
        
        this.restoreCanvasState();
        this.drawLine(this.startPoint.x, this.startPoint.y, x, y);
        
        this.startPoint = null;
        this.eventBus.emit('canvas:change');
    }

    /**
     * Draw line preview
     * @param {number} x1 - Start X
     * @param {number} y1 - Start Y
     * @param {number} x2 - End X
     * @param {number} y2 - End Y
     */
    drawLinePreview(x1, y1, x2, y2) {
        // Draw with lower opacity for preview
        const ctx = this.canvasManager.ctx;
        const originalOpacity = ctx.globalAlpha;
        ctx.globalAlpha = 0.5;
        
        this.canvasManager.drawLine(x1, y1, x2, y2);
        
        ctx.globalAlpha = originalOpacity;
    }

    /**
     * Draw final line
     * @param {number} x1 - Start X
     * @param {number} y1 - Start Y
     * @param {number} x2 - End X
     * @param {number} y2 - End Y
     */
    drawLine(x1, y1, x2, y2) {
        this.canvasManager.drawLine(x1, y1, x2, y2);
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
     * Get line cursor
     * @returns {string} CSS cursor value
     */
    getCursor() {
        return 'crosshair';
    }

    /**
     * Activate line tool
     */
    activate() {
        super.activate();
        this.setCursor();
    }

    /**
     * Deactivate line tool
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
     * Handle key events for line constraints
     * @param {KeyboardEvent} event - Keyboard event
     */
    onKeyDown(event) {
        if (event.shiftKey && this.isDrawing && this.startPoint) {
            // Constrain to horizontal, vertical, or 45-degree angles
            this.constrainLine = true;
        }
    }

    /**
     * Handle key up events
     * @param {KeyboardEvent} event - Keyboard event
     */
    onKeyUp(event) {
        if (!event.shiftKey) {
            this.constrainLine = false;
        }
    }

    /**
     * Constrain line to angles if shift is held
     * @param {number} x1 - Start X
     * @param {number} y1 - Start Y
     * @param {number} x2 - End X
     * @param {number} y2 - End Y
     * @returns {Object} Constrained coordinates
     */
    constrainLineToAngles(x1, y1, x2, y2) {
        if (!this.constrainLine) {
            return { x2, y2 };
        }
        
        const deltaX = x2 - x1;
        const deltaY = y2 - y1;
        const angle = Math.atan2(deltaY, deltaX);
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Snap to nearest 45-degree angle
        const snapAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
        
        return {
            x2: x1 + Math.cos(snapAngle) * distance,
            y2: y1 + Math.sin(snapAngle) * distance
        };
    }
}
