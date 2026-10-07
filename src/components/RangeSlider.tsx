
import React from 'react';
import { Slider } from '@/components/ui/slider';

interface RangeSliderProps {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

const RangeSlider: React.FC<RangeSliderProps> = ({
  value,
  min,
  max,
  step,
  onChange,
  disabled = false
}) => {
  const handleSliderChange = (values: number[]) => {
    onChange(values[0]);
  };

  return (
    <Slider
      value={[value]}
      min={min}
      max={max}
      step={step}
      onValueChange={handleSliderChange}
      disabled={disabled}
      className="mt-2"
    />
  );
};

export default RangeSlider;
