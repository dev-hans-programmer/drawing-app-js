/**
 * Utility functions for exporting canvas content
 */
export class ExportUtils {
    /**
     * Export canvas as image
     * @param {HTMLCanvasElement} canvas - Canvas to export
     * @param {string} format - Export format (png, jpg, svg)
     * @param {string} filename - Filename for download
     * @param {number} quality - Image quality (0-1) for jpg
     */
    static exportCanvas(canvas, format = 'png', filename = null, quality = 0.9) {
        if (!filename) {
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
            filename = `drawing-${timestamp}.${format}`;
        }
        
        switch (format.toLowerCase()) {
            case 'png':
                this.exportAsPNG(canvas, filename);
                break;
            case 'jpg':
            case 'jpeg':
                this.exportAsJPEG(canvas, filename, quality);
                break;
            case 'svg':
                this.exportAsSVG(canvas, filename);
                break;
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }

    /**
     * Export canvas as PNG
     * @param {HTMLCanvasElement} canvas - Canvas to export
     * @param {string} filename - Filename for download
     */
    static exportAsPNG(canvas, filename) {
        canvas.toBlob((blob) => {
            this.downloadBlob(blob, filename);
        }, 'image/png');
    }

    /**
     * Export canvas as JPEG
     * @param {HTMLCanvasElement} canvas - Canvas to export
     * @param {string} filename - Filename for download
     * @param {number} quality - Image quality (0-1)
     */
    static exportAsJPEG(canvas, filename, quality) {
        // Create white background for JPEG (no transparency)
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.fillStyle = 'white';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        tempCtx.drawImage(canvas, 0, 0);
        
        tempCanvas.toBlob((blob) => {
            this.downloadBlob(blob, filename);
        }, 'image/jpeg', quality);
    }

    /**
     * Export canvas as SVG (simplified version)
     * @param {HTMLCanvasElement} canvas - Canvas to export
     * @param {string} filename - Filename for download
     */
    static exportAsSVG(canvas, filename) {
        // This is a simplified SVG export
        // For a full implementation, you'd need to track drawing operations
        const svgContent = `
            <svg width="${canvas.width}" height="${canvas.height}" xmlns="http://www.w3.org/2000/svg">
                <foreignObject width="100%" height="100%">
                    <img src="${canvas.toDataURL()}" />
                </foreignObject>
            </svg>
        `;
        
        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
        this.downloadBlob(blob, filename);
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
     * Copy canvas to clipboard
     * @param {HTMLCanvasElement} canvas - Canvas to copy
     */
    static async copyToClipboard(canvas) {
        try {
            const blob = await new Promise(resolve => {
                canvas.toBlob(resolve, 'image/png');
            });
            
            const clipboardItem = new ClipboardItem({ 'image/png': blob });
            await navigator.clipboard.write([clipboardItem]);
            
            return true;
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            return false;
        }
    }

    /**
     * Get canvas data URL
     * @param {HTMLCanvasElement} canvas - Canvas to convert
     * @param {string} format - Image format
     * @param {number} quality - Image quality for JPEG
     * @returns {string} Data URL
     */
    static getDataURL(canvas, format = 'png', quality = 0.9) {
        if (format.toLowerCase() === 'jpg' || format.toLowerCase() === 'jpeg') {
            // Create white background for JPEG
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.fillStyle = 'white';
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            tempCtx.drawImage(canvas, 0, 0);
            
            return tempCanvas.toDataURL(`image/${format}`, quality);
        }
        
        return canvas.toDataURL(`image/${format}`);
    }

    /**
     * Print canvas
     * @param {HTMLCanvasElement} canvas - Canvas to print
     */
    static printCanvas(canvas) {
        const dataURL = canvas.toDataURL();
        const windowContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Print Drawing</title>
                <style>
                    body { margin: 0; padding: 20px; }
                    img { max-width: 100%; height: auto; }
                    @media print {
                        body { margin: 0; padding: 0; }
                        img { width: 100%; height: auto; page-break-inside: avoid; }
                    }
                </style>
            </head>
            <body>
                <img src="${dataURL}" alt="Drawing" />
            </body>
            </html>
        `;
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(windowContent);
        printWindow.document.close();
        
        printWindow.onload = () => {
            printWindow.print();
            printWindow.close();
        };
    }
}
