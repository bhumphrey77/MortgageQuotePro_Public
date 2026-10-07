# Plan: Annual Property Tax toggle defaults to $ for Refinance

## Problem

The Annual Property Tax `taxMode` state in `MortgageCalculatorForm.tsx` is initialized via `useState` (line 87-91), which only runs **once** on mount. When the user switches from Purchase (where `taxMode = 'percentage'`) to Refinance, the state does not update — the toggle stays on `%` even though Refinance should default to `$`.

The existing `useEffect` (lines 93-99) only watches `propertyTaxRate` and `propertyTax`, not `calculatorMode`, so a tab switch with both values at 0 leaves `taxMode` unchanged.

## Fix

In `src/components/MortgageCalculatorForm.tsx`, update the `taxMode` effect (lines 93-99) to also respond to `inputs.calculatorMode`. The new priority order:

1. AI-extracted rate present (`propertyTaxRate > 0 && propertyTax === 0`) → `'percentage'`
2. AI-extracted dollar present (`propertyTax > 0 && propertyTaxRate === 0`) → `'dollar'`
3. No value set → default by mode: `purchase` → `'percentage'`, `refinance` → `'dollar'`

Add `inputs.calculatorMode` to the dependency array.

The `key` on the `DualModeInput` (`property-tax-${inputs.calculatorMode}-${taxMode}`, line 668) already remounts the component when either changes, so the toggle will correctly reflect the new mode after the effect runs.

## Files changed

- `src/components/MortgageCalculatorForm.tsx` — one effect update (lines 93-99)
