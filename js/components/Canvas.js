/**
 * Canvas component with drawing area and controls
 */
export class Canvas {
    constructor(eventBus, canvasManager) {
        this.eventBus = eventBus;
        this.canvasManager = canvasManager;
        this.zoom = 1;
        this.isPanning = false;
        this.lastPanPoint = null;
        
        this.setupEventListeners();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        this.eventBus.on('zoom:changed', (zoom) => {
            this.zoom = zoom;
            this.updateZoomDisplay();
        });
    }

    /**
     * Create and mount canvas component
     * @returns {HTMLElement} Canvas container element
     */
    mount() {
        this.element = this.createElement();
        return this.element;
    }

    /**
     * Create canvas container element
     * @returns {HTMLElement} Created element
     */
    createElement() {
        const container = document.createElement('div');
        container.className = 'canvas-container';
        
        container.innerHTML = `
            <div class="canvas-wrapper">
                <canvas class="drawing-canvas"></canvas>
            </div>
            
            <div class="zoom-controls">
                <button class="zoom-btn" data-action="zoom-out" title="Zoom Out">
                    <i data-feather="minus"></i>
                </button>
                <span class="zoom-level">${Math.round(this.zoom * 100)}%</span>
                <button class="zoom-btn" data-action="zoom-in" title="Zoom In">
                    <i data-feather="plus"></i>
                </button>
                <button class="zoom-btn" data-action="zoom-reset" title="Reset Zoom">
                    <i data-feather="maximize"></i>
                </button>
            </div>
            
            <div class="canvas-controls">
                <button class="control-btn" data-action="fit-canvas" title="Fit to Screen">
                    <i data-feather="maximize-2"></i>
                </button>
            </div>
        `;
        
        this.attachEventListeners(container);
        
        // Initialize feather icons
        setTimeout(() => {
            if (window.feather) {
                window.feather.replace();
            }
        }, 0);
        
        return container;
    }

    /**
     * Attach event listeners to canvas container
     * @param {HTMLElement} container - Container element
     */
    attachEventListeners(container) {
        const canvas = container.querySelector('.drawing-canvas');
        const wrapper = container.querySelector('.canvas-wrapper');
        
        // Mouse events for drawing
        canvas.addEventListener('mousedown', (e) => {
            this.handleMouseDown(e);
        });
        
        canvas.addEventListener('mousemove', (e) => {
            this.handleMouseMove(e);
        });
        
        canvas.addEventListener('mouseup', (e) => {
            this.handleMouseUp(e);
        });
        
        canvas.addEventListener('mouseleave', (e) => {
            this.handleMouseUp(e);
        });
        
        // Touch events for mobile
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.handleMouseDown(mouseEvent);
        });
        
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.handleMouseMove(mouseEvent);
        });
        
        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const mouseEvent = new MouseEvent('mouseup', {});
            this.handleMouseUp(mouseEvent);
        });
        
        // Zoom with mouse wheel
        wrapper.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            this.canvasManager.zoomCanvas(delta, x, y);
        });
        
        // Pan with middle mouse button or space+drag
        wrapper.addEventListener('mousedown', (e) => {
            if (e.button === 1 || (e.button === 0 && e.ctrlKey)) { // Middle button or Ctrl+Left
                e.preventDefault();
                this.startPanning(e);
            }
        });
        
        wrapper.addEventListener('mousemove', (e) => {
            if (this.isPanning) {
                e.preventDefault();
                this.continuePanning(e);
            }
        });
        
        wrapper.addEventListener('mouseup', (e) => {
            if (e.button === 1 || this.isPanning) {
                e.preventDefault();
                this.stopPanning();
            }
        });
        
        // Control buttons
        container.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (btn) {
                this.handleControlAction(btn.dataset.action);
            }
        });
        
        // Keyboard events for panning
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !e.repeat) {
                e.preventDefault();
                wrapper.style.cursor = 'grab';
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (e.code === 'Space') {
                wrapper.style.cursor = '';
            }
        });
    }

    /**
     * Handle mouse down events
     * @param {MouseEvent} e - Mouse event
     */
    handleMouseDown(e) {
        const coords = this.canvasManager.screenToCanvas(e.clientX, e.clientY);
        this.eventBus.emit('canvas:mousedown', coords.x, coords.y, e);
    }

    /**
     * Handle mouse move events
     * @param {MouseEvent} e - Mouse event
     */
    handleMouseMove(e) {
        const coords = this.canvasManager.screenToCanvas(e.clientX, e.clientY);
        this.eventBus.emit('canvas:mousemove', coords.x, coords.y, e);
    }

    /**
     * Handle mouse up events
     * @param {MouseEvent} e - Mouse event
     */
    handleMouseUp(e) {
        const coords = this.canvasManager.screenToCanvas(e.clientX, e.clientY);
        this.eventBus.emit('canvas:mouseup', coords.x, coords.y, e);
    }

    /**
     * Start panning operation
     * @param {MouseEvent} e - Mouse event
     */
    startPanning(e) {
        this.isPanning = true;
        this.lastPanPoint = { x: e.clientX, y: e.clientY };
        this.element.querySelector('.canvas-wrapper').style.cursor = 'grabbing';
    }

    /**
     * Continue panning operation
     * @param {MouseEvent} e - Mouse event
     */
    continuePanning(e) {
        if (!this.isPanning || !this.lastPanPoint) return;
        
        const deltaX = e.clientX - this.lastPanPoint.x;
        const deltaY = e.clientY - this.lastPanPoint.y;
        
        this.canvasManager.panCanvas(deltaX, deltaY);
        this.lastPanPoint = { x: e.clientX, y: e.clientY };
    }

    /**
     * Stop panning operation
     */
    stopPanning() {
        this.isPanning = false;
        this.lastPanPoint = null;
        this.element.querySelector('.canvas-wrapper').style.cursor = '';
    }

    /**
     * Handle control actions
     * @param {string} action - Action name
     */
    handleControlAction(action) {
        switch (action) {
            case 'zoom-in':
                this.canvasManager.zoomCanvas(0.2);
                break;
            case 'zoom-out':
                this.canvasManager.zoomCanvas(-0.2);
                break;
            case 'zoom-reset':
                this.canvasManager.resetTransform();
                break;
            case 'fit-canvas':
                this.fitCanvasToScreen();
                break;
        }
    }

    /**
     * Fit canvas to screen
     */
    fitCanvasToScreen() {
        const container = this.element.querySelector('.canvas-wrapper');
        const containerRect = container.getBoundingClientRect();
        
        // Make canvas fill the available space
        this.canvasManager.canvasWidth = Math.max(1200, containerRect.width);
        this.canvasManager.canvasHeight = Math.max(800, containerRect.height);
        this.canvasManager.setCanvasSize(this.canvasManager.canvasWidth, this.canvasManager.canvasHeight);
        
        this.canvasManager.zoom = 1;
        this.canvasManager.panX = 0;
        this.canvasManager.panY = 0;
        this.canvasManager.updateTransform();
        this.eventBus.emit('zoom:changed', 1);
    }

    /**
     * Update zoom display
     */
    updateZoomDisplay() {
        const zoomLevel = this.element.querySelector('.zoom-level');
        if (zoomLevel) {
            zoomLevel.textContent = `${Math.round(this.zoom * 100)}%`;
        }
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Resize canvas to fit new container size
        this.canvasManager.autoSizeCanvas();
        this.canvasManager.updateTransform();
    }

    /**
     * Get canvas element
     * @returns {HTMLCanvasElement} Canvas element
     */
    getCanvasElement() {
        return this.element.querySelector('.drawing-canvas');
    }
}
