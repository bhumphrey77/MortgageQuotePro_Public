
import React from 'react';
import { cn } from '@/lib/utils';
import { HelpCircle } from 'lucide-react';

interface FieldTooltipProps {
  text: string;
  className?: string;
  isPMI?: boolean;
}

const FieldTooltip: React.FC<FieldTooltipProps> = ({ text, className, isPMI = false }) => {
  const tooltipText = isPMI 
    ? `${text} This is only an estimate and is based on your credit. Contact your lender for more details.`
    : text;
  
  return (
    <div className={cn("tooltip inline-block", className)}>
      <HelpCircle size={16} className="text-accentRed cursor-help" />
      <span className="tooltip-text">
        {tooltipText}
      </span>
    </div>
  );
};

export default FieldTooltip;
