import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import FieldTooltip from './FieldTooltip';
import { cn } from '@/lib/utils';

interface CombinedDownPaymentInputProps {
  percentageValue: string;
  amountValue: string;
  onPercentageChange: (value: string) => void;
  onAmountChange: (value: string) => void;
  error?: string;
  className?: string;
}

const CombinedDownPaymentInput: React.FC<CombinedDownPaymentInputProps> = ({
  percentageValue,
  amountValue,
  onPercentageChange,
  onAmountChange,
  error,
  className
}) => {
  const [percentageFocused, setPercentageFocused] = useState(false);
  const [amountFocused, setAmountFocused] = useState(false);
  const [localPercentage, setLocalPercentage] = useState(percentageValue);
  const [localAmount, setLocalAmount] = useState(amountValue);

  // Update local state when external values change and we're not focused
  useEffect(() => {
    if (!percentageFocused) {
      setLocalPercentage(percentageValue);
    }
  }, [percentageValue, percentageFocused]);

  useEffect(() => {
    if (!amountFocused) {
      setLocalAmount(amountValue);
    }
  }, [amountValue, amountFocused]);

  const handlePercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalPercentage(newValue);
    onPercentageChange(newValue);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalAmount(newValue);
    onAmountChange(newValue);
  };
  return (
    <div className={cn("mb-4", className)}>
      <div className="flex items-center mb-1">
        <Label htmlFor="down-payment-combined">
          Down Payment
        </Label>
        <FieldTooltip text="Your down payment as a percentage of the home price or dollar amount" className="ml-2" />
      </div>
      
      <div className={cn(
        "rounded-md border bg-background overflow-hidden flex",
        error && "border-destructive"
      )}>
        {/* Percentage Input */}
        <div className="relative flex-1">
          <Input
            id="down-payment-percentage"
            type="text"
            inputMode="decimal"
            value={localPercentage}
            onChange={handlePercentageChange}
            onFocus={() => setPercentageFocused(true)}
            onBlur={() => setPercentageFocused(false)}
            placeholder="Ex. 20"
            className="border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 pr-8"
          />
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
            %
          </span>
        </div>
        
        {/* Vertical Divider */}
        <div className="border-r" />
        
        {/* Amount Input */}
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
            $
          </span>
          <Input
            id="down-payment-amount"
            type="text"
            inputMode="decimal"
            value={localAmount}
            onChange={handleAmountChange}
            onFocus={() => setAmountFocused(true)}
            onBlur={() => setAmountFocused(false)}
            placeholder="Example 85,000"
            className="border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 pl-7"
          />
        </div>
      </div>
      
      {error && <p className="text-destructive text-xs mt-1">{error}</p>}
    </div>
  );
};

export default CombinedDownPaymentInput;
