/**
 * Utility functions for saving and loading projects
 */
export class ProjectUtils {
    /**
     * Save project as JSON file
     * @param {HTMLCanvasElement} canvas - Canvas to save
     * @param {Object} projectData - Additional project data
     * @param {string} filename - Optional filename
     */
    static saveProject(canvas, projectData = {}, filename = null) {
        if (!filename) {
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
            filename = `drawing-project-${timestamp}.json`;
        }

        // Create project data structure
        const project = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            canvas: {
                width: canvas.width,
                height: canvas.height,
                dataURL: canvas.toDataURL('image/png')
            },
            metadata: {
                title: projectData.title || 'Untitled Drawing',
                description: projectData.description || '',
                tags: projectData.tags || [],
                author: projectData.author || ''
            },
            settings: {
                zoom: projectData.zoom || 1,
                panX: projectData.panX || 0,
                panY: projectData.panY || 0,
                backgroundColor: projectData.backgroundColor || '#ffffff',
                gridVisible: projectData.gridVisible || true
            },
            tools: {
                lastUsedTool: projectData.lastUsedTool || 'pen',
                toolSettings: projectData.toolSettings || {}
            }
        };

        // Convert to JSON and download
        const jsonString = JSON.stringify(project, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        this.downloadBlob(blob, filename);
        
        return project;
    }

    /**
     * Load project from JSON file
     * @param {File} file - JSON file to load
     * @returns {Promise<Object>} Project data
     */
    static loadProject(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error('No file provided'));
                return;
            }

            if (!file.name.toLowerCase().endsWith('.json')) {
                reject(new Error('Invalid file type. Please select a JSON file.'));
                return;
            }

            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const projectData = JSON.parse(e.target.result);
                    
                    // Validate project structure
                    if (!this.validateProject(projectData)) {
                        reject(new Error('Invalid project file format'));
                        return;
                    }

                    resolve(projectData);
                } catch (error) {
                    reject(new Error('Failed to parse project file: ' + error.message));
                }
            };

            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };

            reader.readAsText(file);
        });
    }

    /**
     * Apply loaded project to canvas
     * @param {Object} projectData - Project data to apply
     * @param {HTMLCanvasElement} canvas - Canvas to apply to
     * @param {Object} canvasManager - Canvas manager instance
     * @returns {Promise<void>}
     */
    static applyProject(projectData, canvas, canvasManager) {
        return new Promise((resolve, reject) => {
            try {
                // Create image from saved data
                const img = new Image();
                
                img.onload = () => {
                    // Clear canvas and set size
                    canvasManager.setCanvasSize(
                        projectData.canvas.width, 
                        projectData.canvas.height
                    );
                    
                    // Draw the saved image
                    const ctx = canvas.getContext('2d');
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0);
                    
                    // Apply settings
                    if (projectData.settings) {
                        canvasManager.zoom = projectData.settings.zoom || 1;
                        canvasManager.panX = projectData.settings.panX || 0;
                        canvasManager.panY = projectData.settings.panY || 0;
                        canvasManager.updateTransform();
                    }
                    
                    resolve(projectData);
                };
                
                img.onerror = () => {
                    reject(new Error('Failed to load project image data'));
                };
                
                img.src = projectData.canvas.dataURL;
                
            } catch (error) {
                reject(new Error('Failed to apply project: ' + error.message));
            }
        });
    }

    /**
     * Validate project data structure
     * @param {Object} projectData - Project data to validate
     * @returns {boolean} True if valid
     */
    static validateProject(projectData) {
        if (!projectData || typeof projectData !== 'object') {
            return false;
        }

        // Check required fields
        const requiredFields = ['version', 'canvas'];
        for (const field of requiredFields) {
            if (!(field in projectData)) {
                console.warn(`Missing required field: ${field}`);
                return false;
            }
        }

        // Check canvas data
        if (!projectData.canvas.dataURL || !projectData.canvas.width || !projectData.canvas.height) {
            console.warn('Invalid canvas data');
            return false;
        }

        return true;
    }

    /**
     * Get project info without loading full data
     * @param {File} file - JSON file to read
     * @returns {Promise<Object>} Project metadata
     */
    static getProjectInfo(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const projectData = JSON.parse(e.target.result);
                    
                    const info = {
                        filename: file.name,
                        fileSize: file.size,
                        lastModified: new Date(file.lastModified),
                        version: projectData.version,
                        timestamp: projectData.timestamp,
                        title: projectData.metadata?.title || 'Untitled',
                        description: projectData.metadata?.description || '',
                        canvasSize: {
                            width: projectData.canvas?.width,
                            height: projectData.canvas?.height
                        }
                    };
                    
                    resolve(info);
                } catch (error) {
                    reject(new Error('Failed to read project info: ' + error.message));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };
            
            reader.readAsText(file);
        });
    }

    /**
     * Create a quick save of current state
     * @param {HTMLCanvasElement} canvas - Canvas to save
     * @param {Object} appState - Current application state
     * @returns {Object} Quick save data
     */
    static createQuickSave(canvas, appState) {
        const quickSave = {
            timestamp: Date.now(),
            canvas: {
                width: canvas.width,
                height: canvas.height,
                dataURL: canvas.toDataURL('image/png')
            },
            state: {
                zoom: appState.zoom || 1,
                panX: appState.panX || 0,
                panY: appState.panY || 0,
                currentTool: appState.currentTool || 'pen'
            }
        };

        // Store in localStorage
        localStorage.setItem('drawingApp_quickSave', JSON.stringify(quickSave));
        return quickSave;
    }

    /**
     * Load quick save from localStorage
     * @returns {Object|null} Quick save data or null
     */
    static loadQuickSave() {
        try {
            const data = localStorage.getItem('drawingApp_quickSave');
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.warn('Failed to load quick save:', error);
            return null;
        }
    }

    /**
     * Clear quick save
     */
    static clearQuickSave() {
        localStorage.removeItem('drawingApp_quickSave');
    }

    /**
     * Download blob as file
     * @param {Blob} blob - Blob to download
     * @param {string} filename - Filename for download
     */
    static downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        URL.revokeObjectURL(url);
    }

    /**
     * Export project metadata only
     * @param {Object} projectData - Project data
     * @returns {Object} Metadata summary
     */
    static exportMetadata(projectData) {
        return {
            title: projectData.metadata?.title,
            description: projectData.metadata?.description,
            timestamp: projectData.timestamp,
            version: projectData.version,
            canvasSize: {
                width: projectData.canvas?.width,
                height: projectData.canvas?.height
            },
            fileSize: JSON.stringify(projectData).length
        };
    }
}