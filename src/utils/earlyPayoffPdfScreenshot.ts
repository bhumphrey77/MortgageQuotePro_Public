import React from 'react';
import ReactDOM from 'react-dom/client';
import { EarlyPayoffInputs, PayoffResults } from '@/utils/earlyPayoffCalculations';
import { EarlyPayoffPrintView } from '@/components/print/EarlyPayoffPrintView';
import { generatePdfFromElement, generateFilename } from './screenshotPdfExport';

interface ProfileData {
  full_name?: string;
  company_name?: string;
  nmls_license?: string;
  phone?: string;
  email?: string;
  avatar_url?: string;
  logo_url?: string;
}

/**
 * Generate a PDF from the Early Payoff print view using html2canvas
 */
export const generateEarlyPayoffPdfScreenshot = async (
  inputs: EarlyPayoffInputs,
  results: PayoffResults,
  profile?: ProfileData | null
): Promise<void> => {
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
        React.createElement(EarlyPayoffPrintView, {
          inputs,
          results,
          profile,
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

    // Generate the PDF
    const filename = generateFilename('early-payoff', inputs.propertyAddress);
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
