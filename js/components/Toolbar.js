/**
 * Main toolbar component
 */
export class Toolbar {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.selectedTool = 'pen';
        this.canUndo = false;
        this.canRedo = false;
        
        this.setupEventListeners();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        this.eventBus.on('tool:selected', (toolName) => {
            this.selectedTool = toolName;
            this.updateToolButtons();
        });

        this.eventBus.on('state:changed', (stateInfo) => {
            this.canUndo = stateInfo.canUndo;
            this.canRedo = stateInfo.canRedo;
            this.updateActionButtons();
        });
    }

    /**
     * Create and mount toolbar
     * @returns {HTMLElement} Toolbar element
     */
    mount() {
        this.element = this.createElement();
        return this.element;
    }

    /**
     * Create toolbar element
     * @returns {HTMLElement} Created element
     */
    createElement() {
        const toolbar = document.createElement('div');
        toolbar.className = 'toolbar';
        
        toolbar.innerHTML = `
            <div class="toolbar-left">
                <div class="logo">DrawingApp</div>
            </div>
            
            <div class="toolbar-center">
                ${this.createToolButtons()}
            </div>
            
            <div class="toolbar-right">
                ${this.createActionButtons()}
            </div>
        `;
        
        this.attachEventListeners(toolbar);
        return toolbar;
    }

    /**
     * Create tool buttons HTML
     * @returns {string} HTML string
     */
    createToolButtons() {
        const tools = [
            { name: 'pen', icon: 'edit-3', title: 'Pen (P)' },
            { name: 'eraser', icon: 'eraser', title: 'Eraser (E)' },
            { name: 'rectangle', icon: 'square', title: 'Rectangle (R)' },
            { name: 'circle', icon: 'circle', title: 'Circle (C)' },
            { name: 'line', icon: 'minus', title: 'Line (L)' },
            { name: 'arrow', icon: 'arrow-up-right', title: 'Arrow (A)' }
        ];
        
        return tools.map(tool => `
            <button class="tool-btn ${tool.name === this.selectedTool ? 'active' : ''}" 
                    data-tool="${tool.name}" 
                    title="${tool.title}">
                <i data-feather="${tool.icon}"></i>
            </button>
        `).join('');
    }

    /**
     * Create action buttons HTML
     * @returns {string} HTML string
     */
    createActionButtons() {
        return `
            <button class="btn btn-secondary" 
                    data-action="undo" 
                    title="Undo (Ctrl+Z)"
                    ${!this.canUndo ? 'disabled' : ''}>
                <i data-feather="rotate-ccw"></i>
            </button>
            
            <button class="btn btn-secondary" 
                    data-action="redo" 
                    title="Redo (Ctrl+Y)"
                    ${!this.canRedo ? 'disabled' : ''}>
                <i data-feather="rotate-cw"></i>
            </button>
            
            <button class="btn btn-secondary" 
                    data-action="clear" 
                    title="Clear Canvas">
                <i data-feather="trash-2"></i>
                Clear
            </button>
            
            <button class="btn btn-primary" 
                    data-action="export" 
                    title="Export (Ctrl+S)">
                <i data-feather="download"></i>
                Export
            </button>
        `;
    }

    /**
     * Attach event listeners to toolbar
     * @param {HTMLElement} toolbar - Toolbar element
     */
    attachEventListeners(toolbar) {
        // Tool selection
        toolbar.addEventListener('click', (e) => {
            const toolBtn = e.target.closest('.tool-btn');
            if (toolBtn) {
                const toolName = toolBtn.dataset.tool;
                this.eventBus.emit('tool:select', toolName);
                return;
            }
            
            const actionBtn = e.target.closest('[data-action]');
            if (actionBtn && !actionBtn.disabled) {
                const action = actionBtn.dataset.action;
                this.handleAction(action);
            }
        });
        
        // Initialize feather icons
        setTimeout(() => {
            if (window.feather) {
                window.feather.replace();
            }
        }, 0);
    }

    /**
     * Handle toolbar actions
     * @param {string} action - Action name
     */
    handleAction(action) {
        switch (action) {
            case 'undo':
                this.eventBus.emit('action:undo');
                break;
            case 'redo':
                this.eventBus.emit('action:redo');
                break;
            case 'clear':
                if (confirm('Are you sure you want to clear the canvas?')) {
                    this.eventBus.emit('action:clear');
                }
                break;
            case 'export':
                this.eventBus.emit('action:export', 'png');
                break;
        }
    }

    /**
     * Update tool button states
     */
    updateToolButtons() {
        if (!this.element) return;
        
        const toolButtons = this.element.querySelectorAll('.tool-btn');
        toolButtons.forEach(btn => {
            const isActive = btn.dataset.tool === this.selectedTool;
            btn.classList.toggle('active', isActive);
        });
    }

    /**
     * Update action button states
     */
    updateActionButtons() {
        if (!this.element) return;
        
        const undoBtn = this.element.querySelector('[data-action="undo"]');
        const redoBtn = this.element.querySelector('[data-action="redo"]');
        
        if (undoBtn) {
            undoBtn.disabled = !this.canUndo;
        }
        
        if (redoBtn) {
            redoBtn.disabled = !this.canRedo;
        }
    }
}
