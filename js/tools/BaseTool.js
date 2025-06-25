/**
 * Base class for all drawing tools
 */
export class BaseTool {
    constructor(eventBus, canvasManager) {
        this.eventBus = eventBus;
        this.canvasManager = canvasManager;
        this.isActive = false;
        this.isDrawing = false;
        
        // Tool properties
        this.properties = {
            strokeColor: '#000000',
            fillColor: '#ffffff',
            strokeWidth: 2,
            opacity: 1.0
        };
        
        this.boundEventHandlers = {
            onMouseDown: this.onMouseDown.bind(this),
            onMouseMove: this.onMouseMove.bind(this),
            onMouseUp: this.onMouseUp.bind(this),
            onPropertiesChange: this.onPropertiesChange.bind(this)
        };
    }

    /**
     * Activate the tool
     */
    activate() {
        this.isActive = true;
        this.setupEventListeners();
        this.requestCurrentProperties();
    }

    /**
     * Deactivate the tool
     */
    deactivate() {
        this.isActive = false;
        this.removeEventListeners();
        this.isDrawing = false;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        this.eventBus.on('canvas:mousedown', this.boundEventHandlers.onMouseDown);
        this.eventBus.on('canvas:mousemove', this.boundEventHandlers.onMouseMove);
        this.eventBus.on('canvas:mouseup', this.boundEventHandlers.onMouseUp);
        this.eventBus.on('properties:change', this.boundEventHandlers.onPropertiesChange);
    }

    /**
     * Remove event listeners
     */
    removeEventListeners() {
        this.eventBus.off('canvas:mousedown');
        this.eventBus.off('canvas:mousemove');
        this.eventBus.off('canvas:mouseup');
        this.eventBus.off('properties:change');
    }

    /**
     * Request current properties from properties panel
     */
    requestCurrentProperties() {
        this.eventBus.emit('properties:request');
        
        // Listen for response
        const unsubscribe = this.eventBus.on('properties:response', (properties) => {
            this.updateProperties(properties);
            unsubscribe();
        });
    }

    /**
     * Handle mouse down event
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {MouseEvent} event - Original mouse event
     */
    onMouseDown(x, y, event) {
        if (!this.isActive) return;
        
        this.isDrawing = true;
        this.startDrawing(x, y, event);
    }

    /**
     * Handle mouse move event
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {MouseEvent} event - Original mouse event
     */
    onMouseMove(x, y, event) {
        if (!this.isActive) return;
        
        if (this.isDrawing) {
            this.continueDrawing(x, y, event);
        } else {
            this.onHover(x, y, event);
        }
    }

    /**
     * Handle mouse up event
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {MouseEvent} event - Original mouse event
     */
    onMouseUp(x, y, event) {
        if (!this.isActive || !this.isDrawing) return;
        
        this.isDrawing = false;
        this.endDrawing(x, y, event);
    }

    /**
     * Handle properties change
     * @param {Object} properties - Changed properties
     */
    onPropertiesChange(properties) {
        this.updateProperties(properties);
    }

    /**
     * Update tool properties
     * @param {Object} properties - Properties to update
     */
    updateProperties(properties) {
        Object.assign(this.properties, properties);
        this.canvasManager.updateProperties(this.properties);
    }

    /**
     * Start drawing operation (to be implemented by subclasses)
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {MouseEvent} event - Original mouse event
     */
    startDrawing(x, y, event) {
        // To be implemented by subclasses
    }

    /**
     * Continue drawing operation (to be implemented by subclasses)
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {MouseEvent} event - Original mouse event
     */
    continueDrawing(x, y, event) {
        // To be implemented by subclasses
    }

    /**
     * End drawing operation (to be implemented by subclasses)
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {MouseEvent} event - Original mouse event
     */
    endDrawing(x, y, event) {
        // To be implemented by subclasses
    }

    /**
     * Handle hover when not drawing (to be implemented by subclasses)
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {MouseEvent} event - Original mouse event
     */
    onHover(x, y, event) {
        // To be implemented by subclasses
    }

    /**
     * Get tool cursor style
     * @returns {string} CSS cursor value
     */
    getCursor() {
        return 'crosshair';
    }

    /**
     * Set canvas cursor
     */
    setCursor() {
        const canvas = this.canvasManager.canvas;
        if (canvas) {
            canvas.style.cursor = this.getCursor();
        }
    }
}
