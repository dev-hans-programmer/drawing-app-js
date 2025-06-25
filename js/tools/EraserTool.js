import { BaseTool } from './BaseTool.js';

/**
 * Eraser tool for removing drawn content
 */
export default class EraserTool extends BaseTool {
    constructor(eventBus, canvasManager) {
        super(eventBus, canvasManager);
        this.eraserSize = 20;
    }

    /**
     * Start erasing
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {MouseEvent} event - Original mouse event
     */
    startDrawing(x, y, event) {
        this.erase(x, y);
    }

    /**
     * Continue erasing
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {MouseEvent} event - Original mouse event
     */
    continueDrawing(x, y, event) {
        this.erase(x, y);
    }

    /**
     * End erasing
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {MouseEvent} event - Original mouse event
     */
    endDrawing(x, y, event) {
        // Emit canvas change event for undo/redo
        this.eventBus.emit('canvas:change');
    }

    /**
     * Erase at position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    erase(x, y) {
        this.canvasManager.erase(x, y, this.eraserSize);
    }

    /**
     * Handle hover to show eraser preview
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {MouseEvent} event - Original mouse event
     */
    onHover(x, y, event) {
        // Could implement eraser preview here
        this.showEraserPreview(x, y);
    }

    /**
     * Show eraser preview
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    showEraserPreview(x, y) {
        // Remove previous preview
        this.removeEraserPreview();
        
        // Create preview element
        const preview = document.createElement('div');
        preview.id = 'eraser-preview';
        preview.style.cssText = `
            position: absolute;
            width: ${this.eraserSize}px;
            height: ${this.eraserSize}px;
            border: 2px solid #ff6b6b;
            border-radius: 50%;
            pointer-events: none;
            z-index: 1000;
            transform: translate(-50%, -50%);
            left: ${x}px;
            top: ${y}px;
        `;
        
        this.canvasManager.canvas.parentElement.appendChild(preview);
    }

    /**
     * Remove eraser preview
     */
    removeEraserPreview() {
        const preview = document.getElementById('eraser-preview');
        if (preview) {
            preview.remove();
        }
    }

    /**
     * Get eraser cursor
     * @returns {string} CSS cursor value
     */
    getCursor() {
        return 'none'; // Hide cursor since we show custom preview
    }

    /**
     * Activate eraser tool
     */
    activate() {
        super.activate();
        this.setCursor();
    }

    /**
     * Deactivate eraser tool
     */
    deactivate() {
        super.deactivate();
        this.removeEraserPreview();
    }

    /**
     * Update eraser properties
     * @param {Object} properties - Properties to update
     */
    updateProperties(properties) {
        super.updateProperties(properties);
        
        if (properties.eraserSize !== undefined) {
            this.eraserSize = properties.eraserSize;
        }
    }
}
