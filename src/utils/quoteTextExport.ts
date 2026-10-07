import { MortgageCalculatorInputs, MortgageResults } from '@/types/calculator';
import { formatCurrency } from '@/utils/calculatorUtils';

interface UserProfile {
  full_name?: string | null;
  company_name?: string | null;
  phone?: string | null;
  email?: string | null;
  nmls_license?: string | null;
}

interface BuildQuoteTextArgs {
  inputs: MortgageCalculatorInputs;
  results: MortgageResults;
  userProfile?: UserProfile | null;
}

const round = (n: number) => Math.round(n);
const pct = (n: number) => `${n.toFixed(3)}%`;

export function buildQuoteText({ inputs, results, userProfile }: BuildQuoteTextArgs): string {
  const lines: string[] = [];

  const header = inputs.propertyAddress
    ? `Mortgage Quote — ${inputs.propertyAddress}`
    : 'Mortgage Quote';
  lines.push(header);

  if (userProfile?.full_name) {
    const bits = [userProfile.full_name];
    if (userProfile.company_name) bits.push(userProfile.company_name);
    let prep = `Prepared by ${bits.join(', ')}`;
    if (userProfile.nmls_license) prep += ` (NMLS# ${userProfile.nmls_license})`;
    lines.push(prep);
    if (userProfile.phone || userProfile.email) {
      lines.push([userProfile.phone, userProfile.email].filter(Boolean).join(' • '));
    }
  }

  lines.push('');
  lines.push(`Loan Type: ${inputs.loanType || 'Conventional'} ${inputs.loanTerm}-year`);
  lines.push(`Purchase Price: ${formatCurrency(inputs.homePrice)}`);
  lines.push(`Down Payment: ${formatCurrency(inputs.downPaymentAmount)} (${inputs.downPaymentPercentage.toFixed(2)}%)`);
  lines.push(`Loan Amount: ${formatCurrency(results.loanAmount)}`);
  lines.push(`Interest Rate: ${pct(inputs.interestRate)}`);
  if (results.apr > 0) lines.push(`APR: ${pct(results.apr)}`);
  lines.push(`LTV: ${results.ltv.toFixed(1)}%`);

  lines.push('');
  lines.push(`Monthly Payment: ${formatCurrency(round(results.totalMonthlyPayment))}`);
  lines.push(`  Principal & Interest: ${formatCurrency(round(results.principalAndInterest))}`);
  lines.push(`  Property Tax: ${formatCurrency(round(results.propertyTax))}`);
  lines.push(`  Home Insurance: ${formatCurrency(round(results.homeInsurance))}`);
  if (results.pmi > 0) lines.push(`  PMI: ${formatCurrency(round(results.pmi))}`);
  if (results.hoaFees > 0) lines.push(`  HOA: ${formatCurrency(round(results.hoaFees))}`);

  const closingCosts = inputs.estimatedClosingCosts || results.estimatedClosingCosts || 0;
  if (closingCosts > 0) {
    lines.push('');
    lines.push(`Closing Costs: ${formatCurrency(round(closingCosts))}`);
    const upfront = inputs.financeUpfrontFee
      ? 0
      : (inputs.ufmipAmount || inputs.fundingFeeAmount || inputs.ugfAmount || 0);
    const cashToClose = inputs.downPaymentAmount + closingCosts + upfront;
    lines.push(`Est. Cash to Close: ${formatCurrency(round(cashToClose))}`);
  }

  return lines.join('\n');
}

export function isClipboardLikelyBlocked(): boolean {
  return typeof navigator === 'undefined' || !navigator.clipboard?.writeText;
}

const isIOS = () =>
  typeof navigator !== 'undefined' &&
  /iP(ad|hone|od)/.test(navigator.userAgent) &&
  !(window as any).MSStream;

function legacyCopy(text: string): boolean {
  try {
    const prev = document.activeElement as HTMLElement | null;
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.contentEditable = 'true';
    ta.style.position = 'fixed';
    ta.style.top = '0';
    ta.style.left = '0';
    ta.style.width = '1px';
    ta.style.height = '1px';
    ta.style.padding = '0';
    ta.style.border = 'none';
    ta.style.outline = 'none';
    ta.style.boxShadow = 'none';
    ta.style.background = 'transparent';
    ta.style.opacity = '0';
    document.body.appendChild(ta);

    if (isIOS()) {
      const range = document.createRange();
      range.selectNodeContents(ta);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
      ta.setSelectionRange(0, text.length);
    } else {
      ta.focus();
      ta.select();
      ta.setSelectionRange(0, text.length);
    }

    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }

    document.body.removeChild(ta);
    prev?.focus?.();
    return ok;
  } catch {
    return false;
  }
}

/**
 * Copy text to the clipboard. Call this SYNCHRONOUSLY from a user-gesture
 * handler (no awaits before it) so mobile browsers preserve user activation.
 */
export async function copyQuoteText(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through to legacy
    }
  }
  return legacyCopy(text);
}
