/**
 * Manages drawable objects for selection and manipulation
 */
export class ObjectManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.objects = [];
        this.selectedObject = null;
        this.nextId = 1;
        
        this.setupEventListeners();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        this.eventBus.on('object:add', (object) => {
            this.addObject(object);
        });

        this.eventBus.on('object:select', (objectId) => {
            this.selectObject(objectId);
        });

        this.eventBus.on('object:deselect', () => {
            this.deselectAll();
        });

        this.eventBus.on('object:delete', (objectId) => {
            this.deleteObject(objectId);
        });

        this.eventBus.on('object:move', (objectId, deltaX, deltaY) => {
            this.moveObject(objectId, deltaX, deltaY);
        });

        this.eventBus.on('object:resize', (objectId, scaleX, scaleY) => {
            this.resizeObject(objectId, scaleX, scaleY);
        });
    }

    /**
     * Add a new object
     * @param {Object} object - Object to add
     * @returns {string} Object ID
     */
    addObject(object) {
        const id = 'obj_' + this.nextId++;
        const fullObject = {
            id,
            type: object.type,
            x: object.x || 0,
            y: object.y || 0,
            width: object.width || 0,
            height: object.height || 0,
            rotation: object.rotation || 0,
            properties: { ...object.properties },
            path: object.path || null, // For freehand drawings
            points: object.points || null, // For lines/arrows
            radius: object.radius || null, // For circles
            timestamp: Date.now(),
            visible: true
        };

        this.objects.push(fullObject);
        this.eventBus.emit('objects:changed', this.objects);
        
        return id;
    }

    /**
     * Get object by ID
     * @param {string} objectId - Object ID
     * @returns {Object|null} Object or null
     */
    getObject(objectId) {
        return this.objects.find(obj => obj.id === objectId) || null;
    }

    /**
     * Get all objects
     * @returns {Array} All objects
     */
    getAllObjects() {
        return [...this.objects];
    }

    /**
     * Select an object
     * @param {string} objectId - Object ID to select
     */
    selectObject(objectId) {
        const object = this.getObject(objectId);
        if (object) {
            this.selectedObject = object;
            this.eventBus.emit('object:selected', object);
        }
    }

    /**
     * Deselect all objects
     */
    deselectAll() {
        this.selectedObject = null;
        this.eventBus.emit('object:deselected');
    }

    /**
     * Get selected object
     * @returns {Object|null} Selected object or null
     */
    getSelectedObject() {
        return this.selectedObject;
    }

    /**
     * Delete an object
     * @param {string} objectId - Object ID to delete
     */
    deleteObject(objectId) {
        const index = this.objects.findIndex(obj => obj.id === objectId);
        if (index !== -1) {
            const deletedObject = this.objects.splice(index, 1)[0];
            
            if (this.selectedObject && this.selectedObject.id === objectId) {
                this.selectedObject = null;
                this.eventBus.emit('object:deselected');
            }
            
            this.eventBus.emit('objects:changed', this.objects);
            this.eventBus.emit('object:deleted', deletedObject);
        }
    }

    /**
     * Move an object
     * @param {string} objectId - Object ID
     * @param {number} deltaX - X movement
     * @param {number} deltaY - Y movement
     */
    moveObject(objectId, deltaX, deltaY) {
        const object = this.getObject(objectId);
        if (object) {
            object.x += deltaX;
            object.y += deltaY;
            
            // Update path points for freehand drawings
            if (object.path) {
                object.path.forEach(point => {
                    point.x += deltaX;
                    point.y += deltaY;
                });
            }
            
            // Update line/arrow points
            if (object.points) {
                object.points.forEach(point => {
                    point.x += deltaX;
                    point.y += deltaY;
                });
            }
            
            this.eventBus.emit('objects:changed', this.objects);
            this.eventBus.emit('object:moved', object);
        }
    }

    /**
     * Resize an object
     * @param {string} objectId - Object ID
     * @param {number} scaleX - X scale factor
     * @param {number} scaleY - Y scale factor
     */
    resizeObject(objectId, scaleX, scaleY) {
        const object = this.getObject(objectId);
        if (object) {
            const centerX = object.x + object.width / 2;
            const centerY = object.y + object.height / 2;
            
            object.width *= scaleX;
            object.height *= scaleY;
            
            // Recalculate position to maintain center
            object.x = centerX - object.width / 2;
            object.y = centerY - object.height / 2;
            
            // Handle special cases
            if (object.radius) {
                object.radius *= Math.max(scaleX, scaleY);
            }
            
            this.eventBus.emit('objects:changed', this.objects);
            this.eventBus.emit('object:resized', object);
        }
    }

    /**
     * Find object at position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {Object|null} Object at position or null
     */
    getObjectAtPosition(x, y) {
        // Check from top to bottom (last drawn = on top)
        for (let i = this.objects.length - 1; i >= 0; i--) {
            const obj = this.objects[i];
            if (!obj.visible) continue;
            
            if (this.isPointInObject(x, y, obj)) {
                return obj;
            }
        }
        return null;
    }

    /**
     * Check if point is inside object
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {Object} obj - Object to check
     * @returns {boolean} True if point is inside object
     */
    isPointInObject(x, y, obj) {
        switch (obj.type) {
            case 'rectangle':
                return x >= obj.x && x <= obj.x + obj.width &&
                       y >= obj.y && y <= obj.y + obj.height;
                       
            case 'circle':
                const centerX = obj.x;
                const centerY = obj.y;
                const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
                return distance <= obj.radius;
                
            case 'line':
            case 'arrow':
                if (!obj.points || obj.points.length < 2) return false;
                return this.isPointNearLine(x, y, obj.points[0], obj.points[1], obj.properties.strokeWidth || 2);
                
            case 'freehand':
                if (!obj.path || obj.path.length === 0) return false;
                return this.isPointNearPath(x, y, obj.path, obj.properties.strokeWidth || 2);
                
            default:
                return false;
        }
    }

    /**
     * Check if point is near a line
     * @param {number} x - Point X
     * @param {number} y - Point Y
     * @param {Object} start - Line start point
     * @param {Object} end - Line end point
     * @param {number} tolerance - Distance tolerance
     * @returns {boolean} True if point is near line
     */
    isPointNearLine(x, y, start, end, tolerance = 5) {
        const A = x - start.x;
        const B = y - start.y;
        const C = end.x - start.x;
        const D = end.y - start.y;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        
        if (lenSq === 0) return Math.sqrt(A * A + B * B) <= tolerance;
        
        const param = dot / lenSq;
        let xx, yy;
        
        if (param < 0) {
            xx = start.x;
            yy = start.y;
        } else if (param > 1) {
            xx = end.x;
            yy = end.y;
        } else {
            xx = start.x + param * C;
            yy = start.y + param * D;
        }
        
        const dx = x - xx;
        const dy = y - yy;
        
        return Math.sqrt(dx * dx + dy * dy) <= tolerance;
    }

    /**
     * Check if point is near a path
     * @param {number} x - Point X
     * @param {number} y - Point Y
     * @param {Array} path - Path points
     * @param {number} tolerance - Distance tolerance
     * @returns {boolean} True if point is near path
     */
    isPointNearPath(x, y, path, tolerance = 5) {
        for (let i = 0; i < path.length - 1; i++) {
            if (this.isPointNearLine(x, y, path[i], path[i + 1], tolerance)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Get object bounds
     * @param {Object} obj - Object
     * @returns {Object} Bounds {x, y, width, height}
     */
    getObjectBounds(obj) {
        switch (obj.type) {
            case 'rectangle':
                return {
                    x: obj.x,
                    y: obj.y,
                    width: obj.width,
                    height: obj.height
                };
                
            case 'circle':
                return {
                    x: obj.x - obj.radius,
                    y: obj.y - obj.radius,
                    width: obj.radius * 2,
                    height: obj.radius * 2
                };
                
            case 'line':
            case 'arrow':
                if (!obj.points || obj.points.length < 2) {
                    return { x: obj.x, y: obj.y, width: 0, height: 0 };
                }
                const minX = Math.min(obj.points[0].x, obj.points[1].x);
                const maxX = Math.max(obj.points[0].x, obj.points[1].x);
                const minY = Math.min(obj.points[0].y, obj.points[1].y);
                const maxY = Math.max(obj.points[0].y, obj.points[1].y);
                return {
                    x: minX,
                    y: minY,
                    width: maxX - minX,
                    height: maxY - minY
                };
                
            case 'freehand':
                if (!obj.path || obj.path.length === 0) {
                    return { x: obj.x, y: obj.y, width: 0, height: 0 };
                }
                const xs = obj.path.map(p => p.x);
                const ys = obj.path.map(p => p.y);
                const pathMinX = Math.min(...xs);
                const pathMaxX = Math.max(...xs);
                const pathMinY = Math.min(...ys);
                const pathMaxY = Math.max(...ys);
                return {
                    x: pathMinX,
                    y: pathMinY,
                    width: pathMaxX - pathMinX,
                    height: pathMaxY - pathMinY
                };
                
            default:
                return { x: obj.x, y: obj.y, width: obj.width, height: obj.height };
        }
    }

    /**
     * Clear all objects
     */
    clear() {
        this.objects = [];
        this.selectedObject = null;
        this.nextId = 1;
        this.eventBus.emit('objects:changed', this.objects);
        this.eventBus.emit('object:deselected');
    }

    /**
     * Export objects as JSON
     * @returns {string} JSON string
     */
    exportObjects() {
        return JSON.stringify(this.objects, null, 2);
    }

    /**
     * Import objects from JSON
     * @param {string} jsonString - JSON string
     */
    importObjects(jsonString) {
        try {
            const objects = JSON.parse(jsonString);
            this.objects = objects;
            this.selectedObject = null;
            this.nextId = Math.max(...objects.map(obj => parseInt(obj.id.split('_')[1])), 0) + 1;
            this.eventBus.emit('objects:changed', this.objects);
        } catch (error) {
            console.error('Failed to import objects:', error);
        }
    }
}