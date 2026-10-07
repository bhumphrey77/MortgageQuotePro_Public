# Plan: Italicized "Example / Ex." placeholders in calculator inputs

## Goal
Add italicized placeholder text to every numeric input in the main mortgage calculator form, prefixed with `Example` for dollar/price amounts and `Ex.` for rates, percentages, years, and scores — matching the two examples you gave:
- Sales Price → `$ Example 450,000` (the `$` is the existing prefix icon; placeholder reads `Example 450,000`)
- Annual Property Tax → `Ex. 1.25`

## Scope
All input boxes rendered by `MortgageCalculatorForm.tsx` and its child components (`NumericInput`, `DualModeInput`, `CombinedDownPaymentInput`). Other calculator pages (Buydown, Early Payoff, etc.) are not changed in this pass but can follow the same pattern later.

## Changes

### 1. Italicize placeholders (scoped to the calculator form)
- Add a CSS rule in `src/index.css`:
  ```css
  .calculator-form input::placeholder { font-style: italic; }
  ```
- Add the `calculator-form` class to the `<form>` root in `MortgageCalculatorForm.tsx` (currently `className="space-y-2"`).
- This scopes italics to the calculator only, so auth/settings/other pages keep their current placeholder style.

### 2. Prefix placeholder text across fields

**NumericInput fields** (`MortgageCalculatorForm.tsx`) — dollar amounts get `Example`, rates/years/scores get `Ex.`:

| Field | Current | New |
|---|---|---|
| Property Address | `123 Main St, City, ST 12345` | `Example 123 Main St, City, ST 12345` |
| Appraised Value | `450,000` | `Example 450,000` |
| Sales Price | `450,000` | `Example 450,000` |
| Loan Amount (purchase) | `340,000` | `Example 340,000` |
| New Loan Amount (refi) | `340,000` | `Example 340,000` |
| Existing 1st Mortgage Balance | `250,000` | `Example 250,000` |
| Existing 1st Mortgage P&I | `1,500` | `Example 1,500` |
| Interest-Only Period | `10` | `Ex. 10` |
| Interest Rate | `6.5` | `Ex. 6.5` |
| Loan Term | `30` | `Ex. 30` |
| Estimated Closing Costs | `12,750` | `Example 12,750` |
| Monthly HOA Fees | `150` | `Example 150` |
| FICO Score | `740` | `Ex. 740` |

**CombinedDownPaymentInput** (`CombinedDownPaymentInput.tsx`):
- Percentage placeholder `20` → `Ex. 20`
- Amount placeholder `85,000` → `Example 85,000`

**DualModeInput fields** (`MortgageCalculatorForm.tsx`) — set both `percentagePlaceholder` (`Ex.`) and `dollarPlaceholder` (`Example`). For fee fields that currently pass a single `placeholder`, split it into both with a sensible dollar example:

| Field | percentagePlaceholder | dollarPlaceholder |
|---|---|---|
| Annual Property Tax | `Ex. 1.25` | `Example 3,600` |
| Annual Insurance | `Ex. 0.5` | `Example 1,200` |
| PMI | `Ex. 0.5` | `Example 142` |
| UFMIP (FHA) | `Ex. 1.75` | `Example 5,950` |
| Monthly MIP (FHA) | `Ex. 0.55` | `Example 156` |
| VA Funding Fee | `Ex. 2.3` | `Example 7,820` |
| UGF (USDA) | `Ex. 1.0` | `Example 3,400` |
| AGF (USDA) | `Ex. 0.35` | `Example 1,190` |

The Loan Type `<Select>` placeholder (`Select loan type`) is left unchanged.

## Notes
- The `$` on price fields stays as the existing prefix icon; it is not part of the placeholder string.
- No business logic, calculations, or validation change — placeholder strings only.
