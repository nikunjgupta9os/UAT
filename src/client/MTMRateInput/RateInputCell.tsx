import React, { useState, useEffect } from 'react';
import type { RateInputCellProps } from './Data.d';

const RateInputCell: React.FC<RateInputCellProps> = ({
  value,
  onChange,
  placeholder,
  disabled = false
}) => {
  const [displayValue, setDisplayValue] = useState<string>('');

  useEffect(() => {
    setDisplayValue(value === '' ? '' : String(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setDisplayValue(inputValue);
    
    // Only convert to number when user stops typing or on blur
    // This allows typing decimal numbers like "83.4"
    if (inputValue === '') {
      onChange('');
    }
  };

  const handleBlur = () => {
    if (displayValue === '') {
      onChange('');
    } else {
      const numericValue = parseFloat(displayValue);
      if (!isNaN(numericValue)) {
        onChange(numericValue);
      } else {
        onChange('');
        setDisplayValue('');
      }
    }
  };

  return (
    <input
      type="text"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
    />
  );
};

export default RateInputCell;