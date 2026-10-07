import React from 'react';
import ReactDOM from 'react-dom/client';
import { BuydownInputs, BuydownResults } from '@/utils/buydownCalculations';
import { BuydownPrintView } from '@/components/print/BuydownPrintView';
import { generatePdfFromElement, generateFilename } from './screenshotPdfExport';

interface BuydownPdfData {
  inputs: BuydownInputs;
  results: BuydownResults;
}

/**
 * Generate a PDF from the Buydown print view using html2canvas
 */
export const generateBuydownPdfScreenshot = async (data: BuydownPdfData): Promise<void> => {
  const { inputs, results } = data;

  // Create a temporary container for rendering
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '816px';
  container.style.backgroundColor = '#ffffff';
  document.body.appendChild(container);

  try {
    // Create a root and render the print view
    const root = ReactDOM.createRoot(container);
    
    await new Promise<void>((resolve) => {
      root.render(
        React.createElement(BuydownPrintView, {
          inputs,
          results,
        })
      );
      // Wait for render to complete
      setTimeout(resolve, 200);
    });

    // Wait for images to load
    const images = container.querySelectorAll('img');
    await Promise.all(
      Array.from(images).map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) {
              resolve();
            } else {
              img.onload = () => resolve();
              img.onerror = () => resolve();
            }
          })
      )
    );

    // Additional wait for any async styling
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Get the rendered element
    const printElement = container.firstElementChild as HTMLElement;
    if (!printElement) {
      throw new Error('Failed to render print view');
    }

    // Generate filename
    const borrowerSlug = inputs.borrowerName?.replace(/[^a-z0-9]/gi, '-').toLowerCase() || 'borrower';
    const buydownSlug = inputs.buydownType?.replace(/[^a-z0-9]/gi, '-').toLowerCase() || '321';
    const filename = `buydown-${borrowerSlug}-${buydownSlug}-${new Date().toISOString().split('T')[0]}.pdf`;

    await generatePdfFromElement(printElement, {
      filename,
      orientation: 'portrait',
      format: 'letter',
      margin: 0,
      scale: 2,
      quality: 0.95,
    });

    // Cleanup
    root.unmount();
  } finally {
    document.body.removeChild(container);
  }
};
