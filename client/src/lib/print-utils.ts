export const printElement = (elementId: string, title?: string) => {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error(`Element not found: ${elementId}`);
        return;
    }

    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.top = '0';
    iframe.style.left = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.style.visibility = 'hidden';

    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    // Get all style sheets and style tags from current document
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
        .map(node => node.outerHTML)
        .join('');

    // Write content
    doc.open();
    doc.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${title || 'Print'}</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            ${styles}
            <style>
                body { 
                    margin: 0; 
                    padding: 0; 
                    background: white;
                }
                #${elementId} {
                    margin: 0 !important;
                    padding: 0 !important;
                    border: none !important;
                    box-shadow: none !important;
                    width: 100% !important;
                    position: relative !important;
                }
                /* Hide scrollbars during print */
                ::-webkit-scrollbar { display: none; }
            </style>
        </head>
        <body>
            <div id="print-mount">${element.outerHTML}</div>
            <script>
                window.onload = function() {
                    // Small delay to ensure styles are applied
                    setTimeout(function() {
                        window.print();
                        window.parent.postMessage('print-complete', '*');
                    }, 500);
                }
            </script>
        </body>
        </html>
    `);
    doc.close();

    // Cleanup listener
    const cleanup = () => {
        if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
        }
        window.removeEventListener('message', handleMessage);
    };

    const handleMessage = (event: MessageEvent) => {
        if (event.data === 'print-complete') {
            // Wait for print dialog to potentially close (browser dependent)
            setTimeout(cleanup, 1000);
        }
    };

    window.addEventListener('message', handleMessage);
};
