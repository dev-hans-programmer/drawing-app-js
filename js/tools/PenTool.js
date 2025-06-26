import { BaseTool } from './BaseTool.js';

/**
 * Pen tool for freehand drawing
 */
export default class PenTool extends BaseTool {
    constructor(eventBus, canvasManager) {
        super(eventBus, canvasManager);
        this.path = [];
        this.smoothing = 0.5;
    }

    /**
     * Start drawing with pen
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {MouseEvent} event - Original mouse event
     */
    startDrawing(x, y, event) {
        this.path = [{ x, y }];
        this.canvasManager.beginDrawing(x, y);
    }

    /**
     * Continue drawing with pen
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {MouseEvent} event - Original mouse event
     */
    continueDrawing(x, y, event) {
        this.path.push({ x, y });
        
        if (this.path.length > 2) {
            // Use quadratic curves for smoother lines
            const lastPoint = this.path[this.path.length - 2];
            const currentPoint = this.path[this.path.length - 1];
            
            // Calculate control point for smooth curve
            const controlX = lastPoint.x + (currentPoint.x - lastPoint.x) * this.smoothing;
            const controlY = lastPoint.y + (currentPoint.y - lastPoint.y) * this.smoothing;
            
            this.canvasManager.ctx.quadraticCurveTo(lastPoint.x, lastPoint.y, controlX, controlY);
            this.canvasManager.ctx.stroke();
        } else {
            // For first few points, use simple line
            this.canvasManager.continueDrawing(x, y);
        }
    }

    /**
     * End drawing with pen
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {MouseEvent} event - Original mouse event
     */
    endDrawing(x, y, event) {
        if (this.path.length > 0) {
            // Create object from path
            const object = {
                type: 'freehand',
                path: [...this.path],
                properties: {
                    strokeColor: this.properties.strokeColor,
                    strokeWidth: this.properties.strokeWidth,
                    lineCap: this.properties.penStyle || 'round',
                    opacity: this.properties.opacity || 1
                }
            };
            
            // Add to object manager
            this.eventBus.emit('object:add', object);
            
            // Finish the current stroke
            this.canvasManager.endDrawing();
        }
        this.path = [];
    }

    /**
     * Get pen cursor
     * @returns {string} CSS cursor value
     */
    getCursor() {
        return 'crosshair';
    }

    /**
     * Activate pen tool
     */
    activate() {
        super.activate();
        this.setCursor();
    }

    /**
     * Update pen properties
     * @param {Object} properties - Properties to update
     */
    updateProperties(properties) {
        super.updateProperties(properties);
        
        // Update pen-specific properties
        if (properties.penStyle) {
            this.canvasManager.ctx.lineCap = properties.penStyle;
            this.canvasManager.ctx.lineJoin = properties.penStyle;
        }
        
        // Update smoothing based on stroke width
        if (properties.strokeWidth) {
            this.smoothing = Math.max(0.3, Math.min(0.8, properties.strokeWidth / 20));
        }
    }
}
