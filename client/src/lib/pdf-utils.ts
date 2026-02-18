/**
 * PDF Utilities - Unified PDF generation from HTML views
 * Ensures PDF downloads match PDF views exactly
 */

/**
 * Generate a PDF from a DOM element using html-to-image and jsPDF
 */
export async function generatePDFFromElement(
    elementId: string,
    filename: string
): Promise<void> {
    let originalDisplay = '';
    let originalVisibility = '';
    let originalOpacity = '';
    let element: HTMLElement | null = null;

    try {
        // Dynamically import libraries
        const { toPng } = await import('html-to-image');
        const { jsPDF } = await import('jspdf');

        // Get the element to convert
        element = document.getElementById(elementId);
        if (!element) {
            throw new Error(`Element with id "${elementId}" not found`);
        }

        // Check if element has content
        if (!element.innerHTML.trim()) {
            throw new Error(`Element with id "${elementId}" has no content to generate PDF`);
        }

        // Store original styles and ensure element is visible for capturing
        originalDisplay = element.style.display;
        originalVisibility = element.style.visibility;
        originalOpacity = element.style.opacity;

        element.style.display = 'block';
        element.style.visibility = 'visible';
        element.style.opacity = '1';

        // Brief delay to ensure rendering
        await new Promise(resolve => setTimeout(resolve, 300));


        // Create a clone and container for rendering to avoid polluting the UI
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '-10000px';
        // Convert 210mm to pixels (at 96 DPI: 210mm = 793.7px)
        container.style.width = '794px'; // A4 width in pixels
        container.style.backgroundColor = '#ffffff';
        document.body.appendChild(container);

        const clonedElement = element.cloneNode(true) as HTMLElement;
        clonedElement.style.border = 'none';
        clonedElement.style.boxShadow = 'none';
        clonedElement.style.margin = '0';
        // Don't reset padding - preserve it from the original element
        clonedElement.style.width = '100%';
        clonedElement.style.backgroundColor = '#ffffff';
        clonedElement.style.minHeight = '0'; // Fix: Clear possible min-height that could cause overflow
        container.appendChild(clonedElement);

        // Ensure images and fonts are ready
        await new Promise(resolve => setTimeout(resolve, 800));

        // Generate high-quality PNG
        const dataUrl = await toPng(clonedElement, {
            backgroundColor: '#ffffff',
            quality: 1,
            pixelRatio: 2,
            width: container.offsetWidth,
            height: clonedElement.offsetHeight,
            style: {
                transform: 'none',
                margin: '0'
                // Don't override padding here - let it inherit from clonedElement
            }
        });

        // Calculate dimensions for A4
        const pdfWidth = 210; // mm
        const pdfHeight = 297; // mm
        const contentWidth = clonedElement.offsetWidth;
        const contentHeight = clonedElement.offsetHeight;
        const imgWidth = pdfWidth;
        const imgHeight = (contentHeight * pdfWidth) / contentWidth;

        // Clean up immediately after capture
        document.body.removeChild(container);

        // Create PDF
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
            compress: true,
        });

        // Handle multi-page
        if (imgHeight <= pdfHeight) {
            pdf.addImage(dataUrl, 'PNG', 0, 0, imgWidth, imgHeight, '', 'FAST');
        } else {
            let heightLeft = imgHeight;
            let page = 0;

            while (heightLeft > 2) { // Use 2mm tolerance to avoid extra blank pages
                if (page > 0) {
                    pdf.addPage();
                }

                // Slice the image by shifting its y coordinate
                const position = -(page * pdfHeight);
                pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight, '', 'FAST');

                heightLeft -= pdfHeight;
                page++;
            }
        }

        // Save file
        pdf.save(filename);

        // Restore original element styles
        if (element) {
            element.style.display = originalDisplay;
            element.style.visibility = originalVisibility;
            element.style.opacity = originalOpacity;
        }
    } catch (error) {
        if (element) {
            element.style.display = originalDisplay || '';
            element.style.visibility = originalVisibility || '';
            element.style.opacity = originalOpacity || '';
        }
        console.error('Unified PDF generation error:', error);
        throw error;
    }
}

/**
 * Print the PDF view directly using browser print dialog
 */
export async function printPDFView(elementId: string, title: string): Promise<void> {
    const printContent = document.getElementById(elementId);
    if (!printContent) {
        throw new Error(`Print element not found: ${elementId}`);
    }

    try {
        const { toPng } = await import('html-to-image');

        // Create a clone and container for rendering to avoid polluting the UI
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '-10000px';
        // Convert 210mm to pixels (at 96 DPI: 210mm = 793.7px)
        container.style.width = '794px'; // A4 width in pixels
        container.style.backgroundColor = '#ffffff';
        document.body.appendChild(container);

        const clonedElement = printContent.cloneNode(true) as HTMLElement;
        clonedElement.style.border = 'none';
        clonedElement.style.boxShadow = 'none';
        clonedElement.style.margin = '0';
        // Don't reset padding - preserve it from the original element
        clonedElement.style.width = '100%';
        clonedElement.style.backgroundColor = '#ffffff';
        clonedElement.style.position = 'relative';
        clonedElement.style.left = 'auto';
        clonedElement.style.top = 'auto';
        container.appendChild(clonedElement);

        // Ensure images and fonts are ready
        await new Promise(resolve => setTimeout(resolve, 800));

        // Generate high-quality PNG
        const dataUrl = await toPng(clonedElement, {
            backgroundColor: '#ffffff',
            quality: 1,
            pixelRatio: 2,
            width: container.offsetWidth,
            height: clonedElement.offsetHeight,
            style: {
                transform: 'none',
                margin: '0'
                // Don't override padding here - let it inherit from clonedElement
            }
        });

        // Clean up
        document.body.removeChild(container);

        const printWindow = window.open('', '_blank', 'width=1000,height=800');
        if (!printWindow) {
            throw new Error('Failed to open print window. Please allow popups.');
        }

        const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title}</title>
            <meta charset="utf-8">
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { background: #fff; text-align: center; }
              @media print { 
                @page { margin: 0; size: auto; } 
                body { margin: 0; }
                img { width: 100%; height: auto; display: block; }
              }
              img { max-width: 100%; height: auto; }
            </style>
          </head>
          <body>
            <img src="${dataUrl}" style="width: 100%; height: auto;" />
          </body>
        </html>
      `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();

        printWindow.onload = () => {
            setTimeout(() => {
                printWindow.print();
                // printWindow.close();
            }, 500);
        };
    } catch (error) {
        console.error('Print generation error:', error);
        throw error;
    }
}
