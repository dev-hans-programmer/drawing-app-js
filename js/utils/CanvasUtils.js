/**
 * Utility functions for canvas operations
 */
export class CanvasUtils {
    /**
     * Calculate distance between two points
     * @param {Object} point1 - First point {x, y}
     * @param {Object} point2 - Second point {x, y}
     * @returns {number} Distance
     */
    static distance(point1, point2) {
        return Math.sqrt(
            Math.pow(point2.x - point1.x, 2) + 
            Math.pow(point2.y - point1.y, 2)
        );
    }

    /**
     * Calculate angle between two points
     * @param {Object} point1 - First point {x, y}
     * @param {Object} point2 - Second point {x, y}
     * @returns {number} Angle in radians
     */
    static angle(point1, point2) {
        return Math.atan2(point2.y - point1.y, point2.x - point1.x);
    }

    /**
     * Interpolate between two points
     * @param {Object} point1 - First point {x, y}
     * @param {Object} point2 - Second point {x, y}
     * @param {number} t - Interpolation factor (0-1)
     * @returns {Object} Interpolated point {x, y}
     */
    static lerp(point1, point2, t) {
        return {
            x: point1.x + (point2.x - point1.x) * t,
            y: point1.y + (point2.y - point1.y) * t
        };
    }

    /**
     * Clamp value between min and max
     * @param {number} value - Value to clamp
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Clamped value
     */
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    /**
     * Convert degrees to radians
     * @param {number} degrees - Degrees
     * @returns {number} Radians
     */
    static degToRad(degrees) {
        return degrees * (Math.PI / 180);
    }

    /**
     * Convert radians to degrees
     * @param {number} radians - Radians
     * @returns {number} Degrees
     */
    static radToDeg(radians) {
        return radians * (180 / Math.PI);
    }

    /**
     * Get normalized vector between two points
     * @param {Object} point1 - First point {x, y}
     * @param {Object} point2 - Second point {x, y}
     * @returns {Object} Normalized vector {x, y}
     */
    static normalize(point1, point2) {
        const distance = this.distance(point1, point2);
        if (distance === 0) return { x: 0, y: 0 };
        
        return {
            x: (point2.x - point1.x) / distance,
            y: (point2.y - point1.y) / distance
        };
    }

    /**
     * Rotate point around center
     * @param {Object} point - Point to rotate {x, y}
     * @param {Object} center - Center of rotation {x, y}
     * @param {number} angle - Rotation angle in radians
     * @returns {Object} Rotated point {x, y}
     */
    static rotatePoint(point, center, angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        
        const dx = point.x - center.x;
        const dy = point.y - center.y;
        
        return {
            x: center.x + dx * cos - dy * sin,
            y: center.y + dx * sin + dy * cos
        };
    }

    /**
     * Get bounding box of points
     * @param {Array} points - Array of points {x, y}
     * @returns {Object} Bounding box {x, y, width, height}
     */
    static getBoundingBox(points) {
        if (points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
        
        let minX = points[0].x;
        let maxX = points[0].x;
        let minY = points[0].y;
        let maxY = points[0].y;
        
        for (let i = 1; i < points.length; i++) {
            minX = Math.min(minX, points[i].x);
            maxX = Math.max(maxX, points[i].x);
            minY = Math.min(minY, points[i].y);
            maxY = Math.max(maxY, points[i].y);
        }
        
        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }

    /**
     * Check if point is inside rectangle
     * @param {Object} point - Point to check {x, y}
     * @param {Object} rect - Rectangle {x, y, width, height}
     * @returns {boolean} True if point is inside rectangle
     */
    static pointInRect(point, rect) {
        return point.x >= rect.x && 
               point.x <= rect.x + rect.width &&
               point.y >= rect.y && 
               point.y <= rect.y + rect.height;
    }

    /**
     * Check if point is inside circle
     * @param {Object} point - Point to check {x, y}
     * @param {Object} circle - Circle {x, y, radius}
     * @returns {boolean} True if point is inside circle
     */
    static pointInCircle(point, circle) {
        const distance = this.distance(point, { x: circle.x, y: circle.y });
        return distance <= circle.radius;
    }

    /**
     * Smooth path using quadratic curves
     * @param {Array} points - Array of points {x, y}
     * @param {number} smoothing - Smoothing factor (0-1)
     * @returns {Array} Smoothed path commands
     */
    static smoothPath(points, smoothing = 0.5) {
        if (points.length < 3) return points;
        
        const smoothedPath = [];
        smoothedPath.push(['moveTo', points[0].x, points[0].y]);
        
        for (let i = 1; i < points.length - 1; i++) {
            const current = points[i];
            const next = points[i + 1];
            
            const controlX = current.x + (next.x - current.x) * smoothing;
            const controlY = current.y + (next.y - current.y) * smoothing;
            
            smoothedPath.push(['quadraticCurveTo', current.x, current.y, controlX, controlY]);
        }
        
        // Add final point
        const lastPoint = points[points.length - 1];
        smoothedPath.push(['lineTo', lastPoint.x, lastPoint.y]);
        
        return smoothedPath;
    }

    /**
     * Get canvas pixel ratio for high DPI displays
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @returns {number} Pixel ratio
     */
    static getPixelRatio(ctx) {
        const dpr = window.devicePixelRatio || 1;
        const bsr = ctx.webkitBackingStorePixelRatio ||
                    ctx.mozBackingStorePixelRatio ||
                    ctx.msBackingStorePixelRatio ||
                    ctx.oBackingStorePixelRatio ||
                    ctx.backingStorePixelRatio || 1;
        
        return dpr / bsr;
    }

    /**
     * Setup high DPI canvas
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     */
    static setupHighDPICanvas(canvas, width, height) {
        const ctx = canvas.getContext('2d');
        const ratio = this.getPixelRatio(ctx);
        
        canvas.width = width * ratio;
        canvas.height = height * ratio;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        
        ctx.scale(ratio, ratio);
    }
}
