import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import FieldTooltip from './FieldTooltip';
import { formatCurrency, parseCurrencyToNumber } from '@/utils/calculatorUtils';

interface DualModeInputProps {
  label: string;
  percentageValue: number;
  dollarValue: number;
  onPercentageChange: (value: number) => void;
  onDollarChange: (value: number) => void;
  tooltipText?: string;
  baseAmount: number; // Used for converting between % and $
  className?: string;
  placeholder?: string;
  percentagePlaceholder?: string;
  dollarPlaceholder?: string;
  defaultMode?: 'percentage' | 'dollar';
}

const DualModeInput: React.FC<DualModeInputProps> = ({
  label,
  percentageValue,
  dollarValue,
  onPercentageChange,
  onDollarChange,
  tooltipText,
  baseAmount,
  className = '',
  placeholder,
  percentagePlaceholder,
  dollarPlaceholder,
  defaultMode = 'percentage'
}) => {
  const [mode, setMode] = useState<'percentage' | 'dollar'>(defaultMode);
  const [inputValue, setInputValue] = useState('');
  const [isUserEditing, setIsUserEditing] = useState(false);

  useEffect(() => {
    // Only update input value from props when user is not actively editing
    if (!isUserEditing) {
      if (mode === 'percentage') {
        setInputValue(percentageValue > 0 ? percentageValue.toFixed(6) : '');
      } else {
        const formatted = dollarValue > 0 ? formatCurrency(dollarValue).replace('$', '') : '';
        setInputValue(formatted);
      }
    }
  }, [mode, percentageValue, dollarValue, isUserEditing]);

  const handleModeToggle = () => {
    setIsUserEditing(false);
    const newMode = mode === 'percentage' ? 'dollar' : 'percentage';
    setMode(newMode);
    
    // Convert value when switching modes
    if (newMode === 'dollar') {
      const calculatedDollar = (baseAmount * percentageValue) / 100;
      onDollarChange(calculatedDollar);
      setInputValue(formatCurrency(calculatedDollar).replace('$', ''));
    } else {
      const calculatedPercent = baseAmount > 0 ? (dollarValue / baseAmount) * 100 : 0;
      onPercentageChange(calculatedPercent);
      setInputValue(calculatedPercent.toFixed(6));
    }
  };

  const handleChange = (value: string) => {
    setIsUserEditing(true);
    setInputValue(value);
    
    if (mode === 'percentage') {
      const numValue = parseFloat(value) || 0;
      onPercentageChange(numValue);
      // Auto-calculate dollar amount
      const calculatedDollar = (baseAmount * numValue) / 100;
      onDollarChange(calculatedDollar);
    } else {
      const numValue = parseCurrencyToNumber(value);
      onDollarChange(numValue);
      // Auto-calculate percentage
      const calculatedPercent = baseAmount > 0 ? (numValue / baseAmount) * 100 : 0;
      onPercentageChange(calculatedPercent);
    }
  };

  const handleBlur = () => {
    setIsUserEditing(false);
  };

  return (
    <div className={className}>
      <div className="flex items-center mb-1">
        <Label>{label}</Label>
        {tooltipText && <FieldTooltip text={tooltipText} className="ml-2" />}
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          {mode === 'dollar' && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              $
            </span>
          )}
          <Input
            type="text"
            inputMode="decimal"
            value={inputValue}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            className={mode === 'dollar' ? 'pl-7' : ''}
            placeholder={mode === 'percentage' ? (percentagePlaceholder || placeholder) : (dollarPlaceholder || placeholder)}
          />
          {mode === 'percentage' && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              %
            </span>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleModeToggle}
          className="shrink-0"
        >
          {mode === 'percentage' ? '%' : '$'}
        </Button>
      </div>
    </div>
  );
};

export default DualModeInput;
