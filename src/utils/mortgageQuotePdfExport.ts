import React from 'react';
import ReactDOM from 'react-dom/client';
import { MortgageCalculatorInputs, MortgageResults, MortgageScenario } from '@/types/calculator';
import { MortgageQuotePrintView } from '@/components/print/MortgageQuotePrintView';
import { generatePdfFromElement, generateFilename } from './screenshotPdfExport';

interface UserProfile {
  full_name: string;
  company_name: string | null;
  phone: string | null;
  email: string;
  nmls_license: string | null;
  avatar_url: string | null;
  logo_url: string | null;
  logo_aspect_ratio?: string | null;
  company_address: string | null;
  website: string | null;
}

interface MortgageQuotePdfData {
  inputs: MortgageCalculatorInputs;
  results: MortgageResults;
  scenarios?: MortgageScenario[];
  userProfile?: UserProfile | null;
}

/**
 * Generate a PDF from the Mortgage Quote print view using html2canvas
 */
export const generateMortgageQuotePdf = async (data: MortgageQuotePdfData): Promise<void> => {
  const { inputs, results, scenarios = [], userProfile } = data;

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
        React.createElement(MortgageQuotePrintView, {
          inputs,
          results,
          scenarios,
          userProfile,
        })
      );
      // Wait for render to complete
      setTimeout(resolve, 500);
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
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Get the rendered element
    const printElement = container.firstElementChild as HTMLElement;
    if (!printElement) {
      throw new Error('Failed to render print view');
    }

    // Generate the PDF
    const filename = generateFilename('mortgage-quote', inputs.propertyAddress);
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
