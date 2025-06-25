/**
 * Manages application state including undo/redo functionality
 */
export class StateManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.states = [];
        this.currentIndex = -1;
        this.maxStates = 50;
        
        this.setupEventListeners();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        this.eventBus.on('state:save', (state) => {
            this.saveState(state);
        });

        this.eventBus.on('state:undo', () => {
            return this.undo();
        });

        this.eventBus.on('state:redo', () => {
            return this.redo();
        });
    }

    /**
     * Save current state
     * @param {any} state - State to save
     */
    saveState(state) {
        // Remove any states after current index (when undoing then making new changes)
        this.states = this.states.slice(0, this.currentIndex + 1);
        
        // Add new state
        this.states.push(this.cloneState(state));
        this.currentIndex++;
        
        // Limit number of stored states
        if (this.states.length > this.maxStates) {
            this.states.shift();
            this.currentIndex--;
        }
        
        this.eventBus.emit('state:changed', {
            canUndo: this.canUndo(),
            canRedo: this.canRedo()
        });
    }

    /**
     * Undo to previous state
     * @returns {any} Previous state or null
     */
    undo() {
        if (!this.canUndo()) {
            return null;
        }
        
        this.currentIndex--;
        const state = this.states[this.currentIndex];
        
        this.eventBus.emit('state:changed', {
            canUndo: this.canUndo(),
            canRedo: this.canRedo()
        });
        
        return this.cloneState(state);
    }

    /**
     * Redo to next state
     * @returns {any} Next state or null
     */
    redo() {
        if (!this.canRedo()) {
            return null;
        }
        
        this.currentIndex++;
        const state = this.states[this.currentIndex];
        
        this.eventBus.emit('state:changed', {
            canUndo: this.canUndo(),
            canRedo: this.canRedo()
        });
        
        return this.cloneState(state);
    }

    /**
     * Check if undo is possible
     * @returns {boolean} Can undo
     */
    canUndo() {
        return this.currentIndex > 0;
    }

    /**
     * Check if redo is possible
     * @returns {boolean} Can redo
     */
    canRedo() {
        return this.currentIndex < this.states.length - 1;
    }

    /**
     * Clone state to prevent mutations
     * @param {any} state - State to clone
     * @returns {any} Cloned state
     */
    cloneState(state) {
        if (state instanceof ImageData) {
            // For ImageData, create a copy
            const cloned = new ImageData(state.width, state.height);
            cloned.data.set(state.data);
            return cloned;
        }
        
        // For other objects, use JSON serialization
        return JSON.parse(JSON.stringify(state));
    }

    /**
     * Clear all states
     */
    clear() {
        this.states = [];
        this.currentIndex = -1;
        
        this.eventBus.emit('state:changed', {
            canUndo: false,
            canRedo: false
        });
    }

    /**
     * Get current state info
     * @returns {Object} State information
     */
    getStateInfo() {
        return {
            totalStates: this.states.length,
            currentIndex: this.currentIndex,
            canUndo: this.canUndo(),
            canRedo: this.canRedo()
        };
    }
}
