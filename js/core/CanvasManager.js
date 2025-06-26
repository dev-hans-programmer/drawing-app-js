import { CanvasUtils } from '../utils/CanvasUtils.js';

/**
 * Manages canvas operations and state
 */
export class CanvasManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.canvas = null;
        this.ctx = null;
        this.isDrawing = false;
        this.lastPoint = null;
        
        // Canvas state
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.canvasWidth = 1200;
        this.canvasHeight = 800;
        
        // Drawing properties
        this.strokeColor = '#000000';
        this.fillColor = '#ffffff';
        this.strokeWidth = 2;
        this.lineCap = 'round';
        this.lineJoin = 'round';
        
        this.setupEventListeners();
    }

    /**
     * Initialize canvas manager with canvas element
     * @param {HTMLCanvasElement} canvas - Canvas element
     */
    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Auto-size canvas to container
        this.autoSizeCanvas();
        this.updateTransform();
        
        // Set initial drawing properties
        this.updateDrawingProperties();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        this.eventBus.on('canvas:zoom', (delta, x, y) => {
            this.zoom(delta, x, y);
        });

        this.eventBus.on('canvas:pan', (deltaX, deltaY) => {
            this.pan(deltaX, deltaY);
        });

        this.eventBus.on('canvas:resize', (width, height) => {
            this.setCanvasSize(width, height);
        });

        this.eventBus.on('properties:change', (properties) => {
            this.updateProperties(properties);
        });
    }

    /**
     * Set canvas size
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     */
    setCanvasSize(width, height) {
        this.canvasWidth = width;
        this.canvasHeight = height;
        
        if (this.canvas) {
            this.canvas.width = width;
            this.canvas.height = height;
            this.updateDrawingProperties();
        }
    }

    /**
     * Auto-size canvas to fit container
     */
    autoSizeCanvas() {
        if (!this.canvas) return;
        
        const container = this.canvas.parentElement;
        const containerRect = container.getBoundingClientRect();
        
        // Make canvas fill the entire container
        this.canvasWidth = containerRect.width;
        this.canvasHeight = containerRect.height;
        
        this.setCanvasSize(this.canvasWidth, this.canvasHeight);
    }

    /**
     * Update canvas transform (zoom and pan)
     */
    updateTransform() {
        if (!this.canvas) return;
        
        // Apply zoom and pan transforms
        this.canvas.style.transform = `scale(${this.zoom}) translate(${this.panX}px, ${this.panY}px)`;
        this.canvas.style.transformOrigin = 'center center';
    }

    /**
     * Zoom canvas
     * @param {number} delta - Zoom delta
     * @param {number} x - Mouse X position
     * @param {number} y - Mouse Y position
     */
    zoomCanvas(delta, x, y) {
        const oldZoom = this.zoom;
        this.zoom = Math.max(0.1, Math.min(5, this.zoom + delta));
        
        if (x !== undefined && y !== undefined) {
            // Zoom towards mouse position
            const zoomRatio = this.zoom / oldZoom;
            this.panX = x - (x - this.panX) * zoomRatio;
            this.panY = y - (y - this.panY) * zoomRatio;
        }
        
        this.updateTransform();
        this.eventBus.emit('zoom:changed', this.zoom);
    }

    /**
     * Pan canvas
     * @param {number} deltaX - Pan delta X
     * @param {number} deltaY - Pan delta Y
     */
    panCanvas(deltaX, deltaY) {
        this.panX += deltaX;
        this.panY += deltaY;
        this.updateTransform();
    }

    /**
     * Convert screen coordinates to canvas coordinates
     * @param {number} x - Screen X
     * @param {number} y - Screen Y
     * @returns {Object} Canvas coordinates
     */
    screenToCanvas(x, y) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (x - rect.left) / this.zoom,
            y: (y - rect.top) / this.zoom
        };
    }

    /**
     * Update drawing properties
     * @param {Object} properties - Drawing properties
     */
    updateProperties(properties) {
        Object.assign(this, properties);
        this.updateDrawingProperties();
    }

    /**
     * Apply current drawing properties to context
     */
    updateDrawingProperties() {
        if (!this.ctx) return;
        
        this.ctx.strokeStyle = this.strokeColor;
        this.ctx.fillStyle = this.fillColor;
        this.ctx.lineWidth = this.strokeWidth;
        this.ctx.lineCap = this.lineCap;
        this.ctx.lineJoin = this.lineJoin;
    }

    /**
     * Begin drawing operation
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    beginDrawing(x, y) {
        this.isDrawing = true;
        this.lastPoint = { x, y };
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
    }

    /**
     * Continue drawing operation
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    continueDrawing(x, y) {
        if (!this.isDrawing) return;
        
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
        this.lastPoint = { x, y };
    }

    /**
     * End drawing operation
     */
    endDrawing() {
        if (!this.isDrawing) return;
        
        this.isDrawing = false;
        this.lastPoint = null;
        this.eventBus.emit('canvas:change');
    }

    /**
     * Draw line
     * @param {number} x1 - Start X
     * @param {number} y1 - Start Y
     * @param {number} x2 - End X
     * @param {number} y2 - End Y
     */
    drawLine(x1, y1, x2, y2) {
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
    }

    /**
     * Draw rectangle
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} width - Width
     * @param {number} height - Height
     * @param {boolean} filled - Whether to fill
     */
    drawRectangle(x, y, width, height, filled = false) {
        if (filled) {
            this.ctx.fillRect(x, y, width, height);
        }
        this.ctx.strokeRect(x, y, width, height);
    }

    /**
     * Draw circle
     * @param {number} x - Center X
     * @param {number} y - Center Y
     * @param {number} radius - Radius
     * @param {boolean} filled - Whether to fill
     */
    drawCircle(x, y, radius, filled = false) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
        if (filled) {
            this.ctx.fill();
        }
        this.ctx.stroke();
    }

    /**
     * Draw arrow
     * @param {number} x1 - Start X
     * @param {number} y1 - Start Y
     * @param {number} x2 - End X
     * @param {number} y2 - End Y
     */
    drawArrow(x1, y1, x2, y2) {
        const headLength = 15;
        const angle = Math.atan2(y2 - y1, x2 - x1);
        
        // Draw line
        this.drawLine(x1, y1, x2, y2);
        
        // Draw arrowhead
        this.ctx.beginPath();
        this.ctx.moveTo(x2, y2);
        this.ctx.lineTo(
            x2 - headLength * Math.cos(angle - Math.PI / 6),
            y2 - headLength * Math.sin(angle - Math.PI / 6)
        );
        this.ctx.moveTo(x2, y2);
        this.ctx.lineTo(
            x2 - headLength * Math.cos(angle + Math.PI / 6),
            y2 - headLength * Math.sin(angle + Math.PI / 6)
        );
        this.ctx.stroke();
    }

    /**
     * Erase at position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} size - Eraser size
     */
    erase(x, y, size) {
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'destination-out';
        this.ctx.beginPath();
        this.ctx.arc(x, y, size / 2, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.restore();
    }

    /**
     * Clear entire canvas
     */
    clear() {
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    }

    /**
     * Get canvas state for undo/redo
     * @returns {ImageData} Canvas state
     */
    getCanvasState() {
        return this.ctx.getImageData(0, 0, this.canvasWidth, this.canvasHeight);
    }

    /**
     * Restore canvas state for undo/redo
     * @param {ImageData} state - Canvas state
     */
    restoreState(state) {
        this.ctx.putImageData(state, 0, 0);
    }

    /**
     * Get current zoom level
     * @returns {number} Zoom level
     */
    getZoom() {
        return this.zoom;
    }

    /**
     * Reset canvas transform
     */
    resetTransform() {
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.updateTransform();
        this.eventBus.emit('zoom:changed', this.zoom);
    }
}
