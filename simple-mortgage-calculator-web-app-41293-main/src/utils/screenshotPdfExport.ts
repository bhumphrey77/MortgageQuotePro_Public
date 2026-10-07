import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface PdfExportOptions {
  filename?: string;
  orientation?: 'portrait' | 'landscape';
  format?: 'a4' | 'letter';
  margin?: number;
  quality?: number;
  scale?: number;
}

/**
 * Capture a DOM element as a high-quality image
 */
export const captureElementAsImage = async (
  element: HTMLElement,
  options: { scale?: number; quality?: number } = {}
): Promise<string> => {
  const { scale = 2, quality = 1 } = options;

  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
  });

  return canvas.toDataURL('image/jpeg', quality);
};

/**
 * Generate a PDF from a DOM element by capturing it as an image
 */
export const generatePdfFromElement = async (
  element: HTMLElement,
  options: PdfExportOptions = {}
): Promise<void> => {
  const {
    filename = 'document.pdf',
    orientation = 'portrait',
    format = 'letter',
    margin = 10,
    quality = 0.95,
    scale = 2,
  } = options;

  // Capture the element as an image
  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
  });

  // Create PDF with specified options
  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format,
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margin * 2;
  const contentHeight = pageHeight - margin * 2;

  // Calculate image dimensions to fit within page
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;
  const ratio = Math.min(contentWidth / imgWidth, contentHeight / imgHeight);
  
  const scaledWidth = imgWidth * ratio;
  const scaledHeight = imgHeight * ratio;

  // Handle multi-page if content is taller than one page
  const pagesNeeded = Math.ceil(scaledHeight / contentHeight);
  
  if (pagesNeeded <= 1) {
    // Single page - center vertically
    const imgData = canvas.toDataURL('image/jpeg', quality);
    pdf.addImage(imgData, 'JPEG', margin, margin, scaledWidth, scaledHeight);
  } else {
    // Multi-page - split the image across pages
    const singlePageHeight = contentHeight / ratio;
    
    for (let page = 0; page < pagesNeeded; page++) {
      if (page > 0) {
        pdf.addPage();
      }

      // Create a canvas for this page's portion
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = imgWidth;
      pageCanvas.height = Math.min(singlePageHeight, imgHeight - page * singlePageHeight);
      
      const ctx = pageCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(
          canvas,
          0, page * singlePageHeight,
          imgWidth, pageCanvas.height,
          0, 0,
          imgWidth, pageCanvas.height
        );
        
        const pageImgData = pageCanvas.toDataURL('image/jpeg', quality);
        const pageScaledHeight = pageCanvas.height * ratio;
        pdf.addImage(pageImgData, 'JPEG', margin, margin, scaledWidth, pageScaledHeight);
      }
    }
  }

  pdf.save(filename);
};

/**
 * Render a React component to a temporary container, capture it, and generate PDF
 */
export const renderAndCapturePdf = async (
  renderContent: () => HTMLElement,
  options: PdfExportOptions = {}
): Promise<void> => {
  // Create a hidden container for rendering
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '816px'; // Letter width in pixels at 96 DPI
  container.style.backgroundColor = '#ffffff';
  
  document.body.appendChild(container);

  try {
    // Render the content
    const element = renderContent();
    container.appendChild(element);

    // Wait for any images to load
    await new Promise(resolve => setTimeout(resolve, 100));

    // Generate the PDF
    await generatePdfFromElement(element, options);
  } finally {
    // Clean up
    document.body.removeChild(container);
  }
};

/**
 * Format currency for display
 */
export const formatCurrency = (value: number | undefined | null): string => {
  if (value === undefined || value === null) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Format percentage for display
 */
export const formatPercentage = (value: number | undefined | null, decimals: number = 3): string => {
  if (value === undefined || value === null) return '0%';
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format interest rate with up to 3 decimal places (no rounding)
 * Shows only as many decimals as needed (e.g., 6.5% not 6.500%)
 */
export const formatInterestRate = (value: number | undefined | null): string => {
  if (value === undefined || value === null) return '0%';
  // Remove trailing zeros after the decimal
  const formatted = value.toFixed(3).replace(/\.?0+$/, '');
  return `${formatted}%`;
};

/**
 * Generate a sanitized filename
 */
export const generateFilename = (prefix: string, identifier?: string): string => {
  const sanitizedId = identifier
    ? identifier.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 30).toLowerCase()
    : '';
  const timestamp = new Date().toISOString().split('T')[0];
  
  return sanitizedId
    ? `${prefix}-${sanitizedId}-${timestamp}.pdf`
    : `${prefix}-${timestamp}.pdf`;
};
