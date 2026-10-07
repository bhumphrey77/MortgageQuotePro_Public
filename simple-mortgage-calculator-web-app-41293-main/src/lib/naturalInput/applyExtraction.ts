import type { MortgageCalculatorInputs } from '@/types/calculator';
import type { ExtractedScenario } from './schema';

export type CalcField = keyof MortgageCalculatorInputs;

export interface ApplyResult {
  patch: Partial<MortgageCalculatorInputs>;
  appliedFields: CalcField[];
  skippedFields: { field: CalcField; reason: 'protected' }[];
  informational: string[]; // field labels that don't map to calc inputs
  missingRequired: string[]; // 'interestRate' | 'loanTermYears'
}

const TAX_KEYWORD_PATTERN = /\b(?:property\s+tax(?:es)?|annual\s+(?:property\s+)?tax(?:es)?|yearly\s+(?:property\s+)?tax(?:es)?|tax\s+bill|taxes|tax)\b/i;
const TIMEFRAME_MONTHLY_PATTERN = /\b(?:per\s+month|a\s+month|monthly|month)\b/i;
const TIMEFRAME_ANNUAL_PATTERN = /\b(?:per\s+year|a\s+year|annually|annual|yearly|year)\b/i;

const NUMBER_WORDS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
};

const SCALE_WORDS: Record<string, number> = {
  hundred: 100,
  thousand: 1000,
  million: 1000000,
};

function parseNumberWordPhrase(value: string): number | undefined {
  const words = value
    .toLowerCase()
    .replace(/-/g, ' ')
    .split(/\s+/)
    .filter((word) => word && word !== 'and' && word !== 'dollars');

  if (words.length === 0) return undefined;

  let total = 0;
  let current = 0;
  let sawNumber = false;

  for (const word of words) {
    if (word in NUMBER_WORDS) {
      current += NUMBER_WORDS[word];
      sawNumber = true;
      continue;
    }

    if (word === 'hundred') {
      current = (current || 1) * SCALE_WORDS.hundred;
      sawNumber = true;
      continue;
    }

    if (word === 'thousand' || word === 'million') {
      total += (current || 1) * SCALE_WORDS[word];
      current = 0;
      sawNumber = true;
      continue;
    }

    return undefined;
  }

  const parsed = total + current;
  return sawNumber && parsed > 0 ? parsed : undefined;
}

function parseAmountToken(value: string, multiplier?: string): number | undefined {
  const normalized = value.replace(/[$,]/g, '').trim();
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;

  const lowerMultiplier = multiplier?.toLowerCase();
  if (lowerMultiplier === 'k') return parsed * 1000;
  if (lowerMultiplier === 'm' || lowerMultiplier === 'million') return parsed * 1000000;
  return parsed;
}

function hasTaxContext(beforeText: string, afterText: string): boolean {
  const beforeSegment = beforeText.split(/\b(?:and|but|with|plus)\b/i).pop() ?? beforeText;
  const afterSegment = afterText.split(/\b(?:and|but|with|plus)\b/i)[0] ?? afterText;
  return TAX_KEYWORD_PATTERN.test(beforeSegment) || TAX_KEYWORD_PATTERN.test(afterSegment);
}

function extractTaxFromRawText(
  rawText?: string,
): { kind: 'dollar'; value: number } | { kind: 'rate'; value: number } | undefined {
  if (!rawText) return undefined;

  const normalized = rawText.replace(/\s+/g, ' ').trim();
  if (!TAX_KEYWORD_PATTERN.test(normalized)) return undefined;

  const firstTaxIndex = normalized.search(TAX_KEYWORD_PATTERN);

  // 1) Look for a percentage near a tax keyword: "1.25%", "1.25 percent"
  const pctPattern = /(\d+(?:\.\d+)?)\s*(?:%|percent|percentage|pct)\b/gi;
  const rateCandidates: { value: number; index: number }[] = [];
  for (const match of normalized.matchAll(pctPattern)) {
    const value = Number(match[1]);
    if (!Number.isFinite(value) || value <= 0 || value > 20) continue;
    const index = match.index ?? 0;
    const windowText = normalized.slice(Math.max(0, index - 45), index + match[0].length + 45);
    if (TAX_KEYWORD_PATTERN.test(windowText)) rateCandidates.push({ value, index });
  }
  const closestRate = rateCandidates.sort(
    (a, b) => Math.abs(a.index - firstTaxIndex) - Math.abs(b.index - firstTaxIndex),
  )[0];
  if (closestRate) return { kind: 'rate', value: closestRate.value };

  // 2) Look for a dollar amount near a tax keyword
  const numberPattern = /\$?\b(\d+(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)(?:\s*(k|m|million))?\b(?!\s*%)/gi;
  const candidates: { amount: number; beforeText: string; afterText: string; index: number }[] = [];

  for (const match of normalized.matchAll(numberPattern)) {
    const amountText = match[1];
    if (!amountText) continue;
    const index = match.index ?? 0;
    const previousChar = normalized.slice(index - 1, index);
    const nextChar = normalized.slice(index + match[0].length, index + match[0].length + 1);
    if (previousChar === '.' || nextChar === '.' || nextChar === '%') continue;

    const amount = parseAmountToken(amountText, match[2]);
    if (typeof amount !== 'number') continue;

    const beforeText = normalized.slice(Math.max(0, index - 35), index);
    const afterText = normalized.slice(index + match[0].length, index + match[0].length + 35);
    if (/^\s*(?:percent|percentage|pct)\b/i.test(afterText)) continue;
    if (hasTaxContext(beforeText, afterText)) {
      candidates.push({ amount, beforeText, afterText, index });
    }
  }

  const wordPattern = /\b((?:(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million|and|dollars?)(?:\s+|-)){0,8}(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million|dollars?))\b/gi;
  for (const match of normalized.matchAll(wordPattern)) {
    const phrase = match[1];
    if (!phrase) continue;
    const amount = parseNumberWordPhrase(phrase);
    if (typeof amount !== 'number') continue;

    const index = match.index ?? 0;
    const beforeText = normalized.slice(Math.max(0, index - 35), index);
    const afterText = normalized.slice(index + phrase.length, index + phrase.length + 35);
    if (hasTaxContext(beforeText, afterText)) {
      candidates.push({ amount, beforeText, afterText, index });
    }
  }

  const closest = candidates
    .filter((candidate) => candidate.amount >= 1)
    .sort((a, b) => Math.abs(a.index - firstTaxIndex) - Math.abs(b.index - firstTaxIndex))[0];

  if (!closest) return undefined;
  const beforeTimeframeBelongsToTax =
    TAX_KEYWORD_PATTERN.test(closest.beforeText) && !/\b(?:and|but|with)\b/i.test(closest.beforeText);
  const isMonthly =
    TIMEFRAME_MONTHLY_PATTERN.test(closest.afterText) ||
    (beforeTimeframeBelongsToTax && TIMEFRAME_MONTHLY_PATTERN.test(closest.beforeText));

  const value = isMonthly ? closest.amount * 12 : closest.amount;
  return { kind: 'dollar', value };
}

/**
 * Deterministically maps an extracted scenario into a partial MortgageCalculatorInputs patch.
 * Respects `protectedFields` (user-touched) — skips them unless override=true.
 */
export function applyExtraction(
  extracted: ExtractedScenario,
  current: MortgageCalculatorInputs,
  protectedFields: Set<CalcField> = new Set(),
  override = false,
  rawText = '',
): ApplyResult {
  const patch: Partial<MortgageCalculatorInputs> = {};
  const applied: CalcField[] = [];
  const skipped: { field: CalcField; reason: 'protected' }[] = [];
  const informational: string[] = [];

  const set = (field: CalcField, value: number | string | boolean) => {
    if (!override && protectedFields.has(field)) {
      skipped.push({ field, reason: 'protected' });
      return;
    }
    (patch as Record<string, unknown>)[field] = value;
    applied.push(field);
  };

  // Transaction type → calculatorMode (purchase / refinance tab). Set first so
  // downstream logic branches on the right mode.
  if (extracted.transactionType === 'purchase' || extracted.transactionType === 'refinance') {
    set('calculatorMode', extracted.transactionType);
  }

  const effectiveMode =
    (patch.calculatorMode as 'purchase' | 'refinance' | undefined) ?? current.calculatorMode;
  const isRefinance = effectiveMode === 'refinance';

  const hasPurchasePrice =
    typeof extracted.purchasePrice === 'number' && extracted.purchasePrice > 0;
  const hasDpAmount =
    typeof extracted.downPayment === 'number' && extracted.downPayment > 0;
  const hasDpPct =
    typeof extracted.downPaymentPercent === 'number' && extracted.downPaymentPercent > 0;
  const hasLoanAmount =
    typeof extracted.loanAmount === 'number' && extracted.loanAmount > 0;

  if (isRefinance) {
    // Refinance semantics:
    //   Home Value field  ↔ appraisedValue
    //   New Loan Amount   ↔ homePrice - downPaymentAmount (form sets homePrice = loanAmount, dp = 0)
    if (hasPurchasePrice) {
      set('appraisedValue', extracted.purchasePrice as number);
      // Mirror to homePrice as a fallback for any calc code that reads homePrice —
      // but only when no explicit loanAmount is provided (loanAmount overrides below).
      if (!hasLoanAmount) {
        set('homePrice', extracted.purchasePrice as number);
      }
    }
    if (hasLoanAmount) {
      set('homePrice', extracted.loanAmount as number);
      set('downPaymentAmount', 0);
      set('downPaymentPercentage', 0);
    }
    // downPayment / downPaymentPercent are not meaningful in refinance — surface as info
    if (hasDpAmount)
      informational.push(`Down Payment (ignored — refinance): $${(extracted.downPayment as number).toLocaleString()}`);
    if (hasDpPct)
      informational.push(`Down Payment % (ignored — refinance): ${extracted.downPaymentPercent}%`);
  } else {
    // Purchase semantics (original behavior)
    if (hasPurchasePrice) {
      set('homePrice', extracted.purchasePrice as number);
    }
    const effectiveHomePrice =
      (patch.homePrice as number | undefined) ?? current.homePrice ?? 0;

    if (hasDpAmount) {
      set('downPaymentAmount', extracted.downPayment as number);
      if (effectiveHomePrice > 0) {
        set(
          'downPaymentPercentage',
          ((extracted.downPayment as number) / effectiveHomePrice) * 100,
        );
      }
    } else if (hasDpPct) {
      set('downPaymentPercentage', extracted.downPaymentPercent as number);
      if (effectiveHomePrice > 0) {
        set(
          'downPaymentAmount',
          ((extracted.downPaymentPercent as number) / 100) * effectiveHomePrice,
        );
      }
    } else if (hasLoanAmount && effectiveHomePrice > 0) {
      const dpAmount = Math.max(0, effectiveHomePrice - (extracted.loanAmount as number));
      set('downPaymentAmount', dpAmount);
      set('downPaymentPercentage', (dpAmount / effectiveHomePrice) * 100);
    }
  }

  if (typeof extracted.interestRate === 'number' && extracted.interestRate > 0) {
    set('interestRate', extracted.interestRate);
  }
  if (typeof extracted.loanTermYears === 'number' && extracted.loanTermYears > 0) {
    set('loanTerm', extracted.loanTermYears);
  }
  const hasExtractedRate =
    typeof extracted.annualPropertyTaxRate === 'number' && extracted.annualPropertyTaxRate > 0;
  const hasExtractedTaxDollar =
    typeof extracted.annualPropertyTax === 'number' && extracted.annualPropertyTax >= 0;

  if (hasExtractedRate) {
    set('propertyTaxRate', extracted.annualPropertyTaxRate as number);
    set('propertyTax', 0);
  } else if (hasExtractedTaxDollar) {
    set('propertyTax', extracted.annualPropertyTax as number);
    set('propertyTaxRate', 0);
  } else {
    const fallback = extractTaxFromRawText(rawText);
    if (fallback?.kind === 'rate') {
      set('propertyTaxRate', fallback.value);
      set('propertyTax', 0);
    } else if (fallback?.kind === 'dollar') {
      set('propertyTax', fallback.value);
      set('propertyTaxRate', 0);
    }
  }
  if (typeof extracted.annualHomeInsurance === 'number' && extracted.annualHomeInsurance >= 0) {
    set('homeInsurance', extracted.annualHomeInsurance);
  }
  if (typeof extracted.monthlyHoa === 'number' && extracted.monthlyHoa >= 0) {
    set('hoaFees', extracted.monthlyHoa);
  }
  if (typeof extracted.creditScore === 'number' && extracted.creditScore > 0) {
    set('ficoScore', extracted.creditScore);
  }
  if (typeof extracted.monthlyIncome === 'number' && extracted.monthlyIncome > 0) {
    set('dtiGrossIncome', String(Math.round(extracted.monthlyIncome)));
  } else if (typeof extracted.annualIncome === 'number' && extracted.annualIncome > 0) {
    set('dtiGrossIncome', String(Math.round(extracted.annualIncome / 12)));
  }
  if (typeof extracted.monthlyDebt === 'number' && extracted.monthlyDebt >= 0) {
    set('dtiMonthlyDebts', String(extracted.monthlyDebt));
  }

  if (extracted.propertyType) informational.push(`Property Type: ${extracted.propertyType.replace('_', ' ')}`);
  if (extracted.occupancy) informational.push(`Occupancy: ${extracted.occupancy.replace('_', ' ')}`);
  if (typeof extracted.extraMonthlyPayment === 'number')
    informational.push(`Extra Monthly Payment: $${extracted.extraMonthlyPayment.toLocaleString()}`);
  if (typeof extracted.cashAvailable === 'number')
    informational.push(`Cash Available: $${extracted.cashAvailable.toLocaleString()}`);
  if (typeof extracted.desiredMonthlyPayment === 'number')
    informational.push(`Desired Monthly Payment: $${extracted.desiredMonthlyPayment.toLocaleString()}`);

  const missing: string[] = [];
  const nextRate = (patch.interestRate as number | undefined) ?? current.interestRate;
  const nextTerm = (patch.loanTerm as number | undefined) ?? current.loanTerm;
  if (!nextRate || nextRate <= 0) missing.push('interestRate');
  if (!nextTerm || nextTerm <= 0) missing.push('loanTermYears');

  return {
    patch,
    appliedFields: applied,
    skippedFields: skipped,
    informational,
    missingRequired: missing,
  };
}
