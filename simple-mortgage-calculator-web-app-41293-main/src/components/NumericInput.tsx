
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import FieldTooltip from './FieldTooltip';
import { cn } from '@/lib/utils';

interface NumericInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  prefix?: string;
  suffix?: string;
  error?: string;
  warning?: string;
  tooltipText?: string;
  disabled?: boolean;
  className?: string;
}

const NumericInput: React.FC<NumericInputProps> = ({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  prefix,
  suffix,
  error,
  warning,
  tooltipText,
  disabled = false,
  className
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  // Update internal state when external value changes and we're not focused
  useEffect(() => {
    if (!isFocused) {
      setInputValue(value);
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (onBlur) onBlur();
  };

  return (
    <div className={cn("mb-4", className)}>
      <div className="flex items-center mb-1">
        <Label htmlFor={label.toLowerCase().replace(/\s/g, '-')}>
          {label}
        </Label>
        {tooltipText && <FieldTooltip text={tooltipText} className="ml-2" />}
      </div>
      
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
            {prefix}
          </span>
        )}
        
        <Input
          id={label.toLowerCase().replace(/\s/g, '-')}
          type="text"
          inputMode="decimal"
          value={inputValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "input-with-slider",
            prefix && "pl-7",
            suffix && "pr-7",
            error && "border-red-500 focus-visible:ring-red-500",
            warning && !error && "border-yellow-500 focus-visible:ring-yellow-500"
          )}
        />
        
        {suffix && (
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
            {suffix}
          </span>
        )}
      </div>
      
      {error && <p className="text-red-700 text-xs mt-1">{error}</p>}
      {warning && !error && <p className="text-yellow-500 text-xs mt-1">{warning}</p>}
    </div>
  );
};

export default NumericInput;
