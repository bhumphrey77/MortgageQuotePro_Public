import React from 'react';
import ReactDOM from 'react-dom/client';
import { PreApprovalPrintView } from '@/components/print/PreApprovalPrintView';
import { generatePdfFromElement } from './screenshotPdfExport';

interface ProfileData {
  full_name?: string;
  title?: string;
  company_name?: string;
  nmls_license?: string;
  nmls_company?: string;
  phone?: string;
  email?: string;
  work_email?: string;
  company_address?: string;
  company_phone?: string;
  website?: string;
  avatar_url?: string;
  logo_url?: string;
  state_license_text?: string;
}

interface PreApprovalData {
  applicantName: string;
  coBorrowerName?: string;
  propertyAddress: string;
  program: string;
  term: string;
  salesPrice: number;
  loanAmount: number;
  downPayment: number;
  downPaymentPct?: number;
  ltv: number;
  interestRate: number;
  occupancy: string;
  expiryDays: number;
  expiryDate: string;
}

/**
 * Generate a PDF from the Pre-Approval print view using html2canvas
 */
export const generatePreApprovalPdfScreenshot = async (
  data: PreApprovalData,
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
        React.createElement(PreApprovalPrintView, {
          data,
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

    // Generate filename
    const sanitizedAddress = data.propertyAddress
      .replace(/[^a-z0-9]/gi, '-')
      .replace(/-+/g, '-')
      .toLowerCase()
      .substring(0, 50);
    const filename = `pre-approval-${sanitizedAddress || 'letter'}.pdf`;

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
