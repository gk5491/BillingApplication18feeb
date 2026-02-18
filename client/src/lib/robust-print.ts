import { toPng } from 'html-to-image';

export const robustPrint = async (elementId: string, title?: string, existingWindow?: Window | null) => {
    let printWindow = existingWindow;

    // If no window provided, try to open one (might be blocked if not direct user action)
    if (!printWindow) {
        printWindow = window.open('', '_blank');
    }

    if (!printWindow) {
        alert("Please allow popups for this site to print invoices!");
        return;
    }

    // Ensure window is reachable
    if (printWindow.closed) {
        console.error("Print window was closed before content could be written");
        return;
    }

    const element = document.getElementById(elementId);
    if (!element) {
        printWindow.close();
        console.error(`Element not found: ${elementId}`);
        return;
    }

    try {
        // Capture the element as a high-quality image
        const dataUrl = await toPng(element, {
            quality: 0.95, // Slightly reduced for speed
            pixelRatio: 2,
            backgroundColor: 'white',
            skipFonts: false, // Changed to false to fix font spacing issues
            cacheBust: true, // Critical: helps with CORS images sometimes
            style: {
                margin: '0',
                padding: '0',
                height: 'auto', // Ensure full height is captured
                width: element.offsetWidth + 'px'
            }
        });

        // clear previous content
        printWindow.document.open();
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${title || 'Print'}</title>
                <style>
                    body {
                        margin: 0;
                        display: flex;
                        justify-content: center;
                    }
                    img {
                        max-width: 100%;
                        height: auto;
                        display: block;
                    }
                    @media print {
                        body {
                            margin: 0;
                            display: block;
                        }
                        img {
                            max-width: 100%;
                            width: 100%;
                        }
                        @page {
                            margin: 0;
                            size: auto;
                        }
                    }
                </style>
            </head>
            <body>
                <img src="${dataUrl}" onload="setTimeout(() => { window.print(); window.close(); }, 500)" />
            </body>
            </html>
        `);
        printWindow.document.close();

    } catch (error) {
        console.error('Robust print failed:', error);
        printWindow.close();
        throw error;
    }
};

// Silent print using invisible iframe - Best for UX (no new tabs)
export const robustIframePrint = async (elementId: string, title?: string) => {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error(`Element not found: ${elementId}`);
        return;
    }

    let cloneContainer: HTMLDivElement | null = null;

    try {
        // Create a dedicated container for the clone to ensure clean capture
        cloneContainer = document.createElement('div');
        cloneContainer.style.position = 'fixed';
        cloneContainer.style.top = '-10000px';
        cloneContainer.style.left = '-10000px';
        cloneContainer.style.zIndex = '-10000';
        // Force A4 width for the container context
        cloneContainer.style.width = '210mm';
        cloneContainer.style.backgroundColor = '#ffffff';
        document.body.appendChild(cloneContainer);

        // Clone the element
        const clone = element.cloneNode(true) as HTMLElement;

        // Sanitize the clone styles for print
        clone.style.margin = '0';
        clone.style.boxShadow = 'none'; // Remove shadows
        clone.style.minHeight = '0'; // Allow shrinking to content
        clone.style.height = 'auto';
        clone.style.width = '100%'; // Fill the 210mm container
        clone.style.transform = 'none';
        clone.style.display = 'block'; // FORCE DISPLAY
        clone.style.visibility = 'visible'; // FORCE VISIBILITY
        clone.style.opacity = '1';

        // Ensure the clone is positioned correctly within our container
        clone.style.position = 'relative';
        clone.style.left = 'auto';
        clone.style.top = 'auto';

        // Remove shadow classes if present (tailwind specific)
        if (clone.classList.contains('shadow-xl')) {
            clone.classList.remove('shadow-xl');
        }

        cloneContainer.appendChild(clone);

        // EXTRA WAIT: Give the clone time to settle and sub-components to render in the new container
        await new Promise(resolve => setTimeout(resolve, 800));

        // Capture image from the CLONE
        const dataUrl = await toPng(clone, {
            quality: 0.98, // High quality
            pixelRatio: 2,
            backgroundColor: 'white',
            skipFonts: false,
            cacheBust: true,
            style: {
                visibility: 'visible',
                display: 'block'
            }
        });

        // Create invisible iframe
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        iframe.style.visibility = 'hidden'; // Hide it
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow?.document;
        if (!doc) return;

        doc.open();
        doc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${title || 'Print'}</title>
                <style>
                    body { margin: 0; padding: 0; }
                    img { 
                        width: 100%; 
                        max-width: 210mm; /* Limit to A4 width */
                        height: auto; 
                        display: block;
                    }
                    @media print {
                        @page { 
                            margin: 0; 
                            size: auto; 
                        }
                        body { visibility: visible; }
                    }
                </style>
            </head>
            <body>
                <img src="${dataUrl}" onload="setTimeout(() => { window.print(); }, 500)" />
            </body>
            </html>
        `);
        doc.close();

        // Cleanup
        if (cloneContainer && document.body.contains(cloneContainer)) {
            document.body.removeChild(cloneContainer);
        }
        setTimeout(() => {
            if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
            }
        }, 60000);

    } catch (error) {
        console.error('Robust iframe print failed:', error);
        // Ensure cleanup happens even on error
        if (cloneContainer && document.body.contains(cloneContainer)) {
            document.body.removeChild(cloneContainer);
        }
        throw error;
    }
};
