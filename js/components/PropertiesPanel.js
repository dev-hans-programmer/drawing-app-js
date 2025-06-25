/**
 * Properties panel component for tool configuration
 */
export class PropertiesPanel {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.currentTool = 'pen';
        this.properties = {
            strokeColor: '#000000',
            fillColor: '#ffffff',
            strokeWidth: 2,
            opacity: 1.0
        };
        
        this.setupEventListeners();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        this.eventBus.on('tool:selected', (toolName) => {
            this.currentTool = toolName;
            this.updatePropertiesForTool();
        });

        this.eventBus.on('properties:request', () => {
            this.eventBus.emit('properties:response', this.properties);
        });
    }

    /**
     * Create and mount properties panel
     * @returns {HTMLElement} Properties panel element
     */
    mount() {
        this.element = this.createElement();
        return this.element;
    }

    /**
     * Create properties panel element
     * @returns {HTMLElement} Created element
     */
    createElement() {
        const panel = document.createElement('div');
        panel.className = 'properties-panel';
        
        panel.innerHTML = `
            <h3>Properties</h3>
            <div id="properties-content">
                ${this.createPropertiesContent()}
            </div>
        `;
        
        this.attachEventListeners(panel);
        return panel;
    }

    /**
     * Create properties content based on current tool
     * @returns {string} HTML string
     */
    createPropertiesContent() {
        return `
            ${this.createStrokeProperties()}
            ${this.createFillProperties()}
            ${this.createOpacityProperty()}
            ${this.createToolSpecificProperties()}
        `;
    }

    /**
     * Create stroke properties section
     * @returns {string} HTML string
     */
    createStrokeProperties() {
        return `
            <div class="property-group">
                <h4>Stroke</h4>
                <div class="property-row">
                    <label class="property-label">Color</label>
                    <input type="color" 
                           class="color-input" 
                           data-property="strokeColor" 
                           value="${this.properties.strokeColor}">
                </div>
                <div class="property-row">
                    <label class="property-label">Width</label>
                    <input type="range" 
                           class="range property-input" 
                           data-property="strokeWidth" 
                           min="1" 
                           max="50" 
                           value="${this.properties.strokeWidth}">
                    <span class="property-value">${this.properties.strokeWidth}px</span>
                </div>
            </div>
        `;
    }

    /**
     * Create fill properties section
     * @returns {string} HTML string
     */
    createFillProperties() {
        const showFill = ['rectangle', 'circle'].includes(this.currentTool);
        
        return `
            <div class="property-group ${showFill ? '' : 'hidden'}">
                <h4>Fill</h4>
                <div class="property-row">
                    <label class="property-label">Color</label>
                    <input type="color" 
                           class="color-input" 
                           data-property="fillColor" 
                           value="${this.properties.fillColor}">
                </div>
                <div class="property-row">
                    <label class="property-label">Enable</label>
                    <input type="checkbox" 
                           data-property="enableFill" 
                           ${this.properties.enableFill ? 'checked' : ''}>
                </div>
            </div>
        `;
    }

    /**
     * Create opacity property
     * @returns {string} HTML string
     */
    createOpacityProperty() {
        return `
            <div class="property-group">
                <h4>Opacity</h4>
                <div class="property-row">
                    <label class="property-label">Alpha</label>
                    <input type="range" 
                           class="range property-input" 
                           data-property="opacity" 
                           min="0.1" 
                           max="1" 
                           step="0.1" 
                           value="${this.properties.opacity}">
                    <span class="property-value">${Math.round(this.properties.opacity * 100)}%</span>
                </div>
            </div>
        `;
    }

    /**
     * Create tool-specific properties
     * @returns {string} HTML string
     */
    createToolSpecificProperties() {
        switch (this.currentTool) {
            case 'eraser':
                return this.createEraserProperties();
            case 'pen':
                return this.createPenProperties();
            default:
                return '';
        }
    }

    /**
     * Create eraser-specific properties
     * @returns {string} HTML string
     */
    createEraserProperties() {
        return `
            <div class="property-group">
                <h4>Eraser</h4>
                <div class="property-row">
                    <label class="property-label">Size</label>
                    <input type="range" 
                           class="range property-input" 
                           data-property="eraserSize" 
                           min="5" 
                           max="100" 
                           value="${this.properties.eraserSize || 20}">
                    <span class="property-value">${this.properties.eraserSize || 20}px</span>
                </div>
            </div>
        `;
    }

    /**
     * Create pen-specific properties
     * @returns {string} HTML string
     */
    createPenProperties() {
        return `
            <div class="property-group">
                <h4>Pen</h4>
                <div class="property-row">
                    <label class="property-label">Style</label>
                    <select data-property="penStyle" class="input">
                        <option value="round" ${this.properties.penStyle === 'round' ? 'selected' : ''}>Round</option>
                        <option value="square" ${this.properties.penStyle === 'square' ? 'selected' : ''}>Square</option>
                        <option value="butt" ${this.properties.penStyle === 'butt' ? 'selected' : ''}>Flat</option>
                    </select>
                </div>
            </div>
        `;
    }

    /**
     * Attach event listeners to properties panel
     * @param {HTMLElement} panel - Panel element
     */
    attachEventListeners(panel) {
        // Handle property changes
        panel.addEventListener('input', (e) => {
            const property = e.target.dataset.property;
            if (!property) return;
            
            let value = e.target.value;
            
            // Convert values to appropriate types
            if (e.target.type === 'range') {
                value = parseFloat(value);
            } else if (e.target.type === 'checkbox') {
                value = e.target.checked;
            }
            
            this.updateProperty(property, value);
            this.updatePropertyDisplay(property, value);
        });

        // Handle property changes on change event (for color inputs)
        panel.addEventListener('change', (e) => {
            const property = e.target.dataset.property;
            if (!property) return;
            
            let value = e.target.value;
            
            if (e.target.type === 'checkbox') {
                value = e.target.checked;
            }
            
            this.updateProperty(property, value);
        });
    }

    /**
     * Update a property value
     * @param {string} property - Property name
     * @param {any} value - Property value
     */
    updateProperty(property, value) {
        this.properties[property] = value;
        this.eventBus.emit('properties:change', { [property]: value });
    }

    /**
     * Update property display value
     * @param {string} property - Property name
     * @param {any} value - Property value
     */
    updatePropertyDisplay(property, value) {
        const input = this.element.querySelector(`[data-property="${property}"]`);
        if (!input) return;
        
        const valueSpan = input.parentElement.querySelector('.property-value');
        if (!valueSpan) return;
        
        switch (property) {
            case 'strokeWidth':
            case 'eraserSize':
                valueSpan.textContent = `${value}px`;
                break;
            case 'opacity':
                valueSpan.textContent = `${Math.round(value * 100)}%`;
                break;
        }
    }

    /**
     * Update properties panel for current tool
     */
    updatePropertiesForTool() {
        if (!this.element) return;
        
        const content = this.element.querySelector('#properties-content');
        content.innerHTML = this.createPropertiesContent();
        
        // Re-attach event listeners for new content
        this.attachEventListeners(this.element);
    }

    /**
     * Get current properties
     * @returns {Object} Current properties
     */
    getProperties() {
        return { ...this.properties };
    }

    /**
     * Set properties
     * @param {Object} properties - Properties to set
     */
    setProperties(properties) {
        Object.assign(this.properties, properties);
        this.updatePropertiesForTool();
        this.eventBus.emit('properties:change', properties);
    }
}
