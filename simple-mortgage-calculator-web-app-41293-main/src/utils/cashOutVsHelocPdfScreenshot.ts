import React from 'react';
import ReactDOM from 'react-dom/client';
import { CashOutVsHelocInputs, CashOutVsHelocResults } from '@/types/cashOutVsHeloc';
import { CashOutVsHelocPrintView } from '@/components/print/CashOutVsHelocPrintView';
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

export const generateCashOutVsHelocPdfScreenshot = async (
  inputs: CashOutVsHelocInputs,
  results: CashOutVsHelocResults,
  profile?: ProfileData | null
): Promise<void> => {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '816px';
  container.style.backgroundColor = '#ffffff';
  document.body.appendChild(container);

  try {
    const root = ReactDOM.createRoot(container);
    await new Promise<void>((resolve) => {
      root.render(
        React.createElement(CashOutVsHelocPrintView, { inputs, results, profile })
      );
      setTimeout(resolve, 200);
    });

    const images = container.querySelectorAll('img');
    await Promise.all(
      Array.from(images).map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) resolve();
            else {
              img.onload = () => resolve();
              img.onerror = () => resolve();
            }
          })
      )
    );
    await new Promise((r) => setTimeout(r, 100));

    const printElement = container.firstElementChild as HTMLElement;
    if (!printElement) throw new Error('Failed to render print view');

    const filename = generateFilename('cash-out-vs-heloc');
    await generatePdfFromElement(printElement, {
      filename,
      orientation: 'portrait',
      format: 'letter',
      margin: 0,
      scale: 2,
      quality: 0.95,
    });

    root.unmount();
  } finally {
    document.body.removeChild(container);
  }
};
