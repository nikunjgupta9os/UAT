
import React, { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

interface NumberInputProps {
  value: number;
  onChange? : (value: number) => void;
  step?: number;
  precision?: number;
  min?: number;
  onBlur?: (value: number) => void;
  max?: number;
  isStep? : boolean;
}

const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  onBlur,
  step = 1,
  precision = 2,
  min,
  isStep = true,
  max,
}) => {
  const [inputValue, setInputValue] = useState(value.toString());

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Only call onChange if the value is a valid number
    if (!isNaN(Number(newValue))) {
      onChange(Number(newValue));
    }
  };

  const handleBlur = () => {
    // Format the value on blur
    const numValue = Number(inputValue);
    const formattedValue = isNaN(numValue) ? value : numValue;
    setInputValue(formattedValue.toFixed(precision));
    onBlur(formattedValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      increment();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      decrement();
    }
  };

  const increment = () => {
    let current = Number(inputValue);
    if (isNaN(current)) current = value;
    let newValue = Number((current + step).toFixed(precision));
    if (max !== undefined && newValue > max) {
      newValue = max;
    }
    setInputValue(newValue.toString());
    onChange(newValue);
  };

  const decrement = () => {
    let current = Number(inputValue);
    if (isNaN(current)) current = value;
    let newValue = Number((current - step).toFixed(precision));
    if (min !== undefined && newValue < min) {
      newValue = min;
    }
    setInputValue(newValue.toString());
    onChange(newValue);
  };

  return (
    <div className="relative inline-block">
      <input
        type="text"
        className="w-full h-10 px-3 pr-8 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400"
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
      
      {/* Up/Down Arrow Buttons */}
      {
        isStep && (
          <div className="absolute right-0 top-0 h-full flex flex-col">
            <button
              type="button"
              onClick={increment}
              className="flex-1 flex items-center justify-center w-6 text-gray-400 hover:text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors duration-150 rounded-tr-md"
              tabIndex={-1}
            >
              <ChevronUp size={14} />
            </button>
            <button
              type="button"
              onClick={decrement}
              className="flex-1 flex items-center justify-center w-6 text-gray-400 hover:text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors duration-150 rounded-br-md"
              tabIndex={-1}
            >
              <ChevronDown size={14} />
            </button>
          </div>
        )
      }
      {/* <div className="absolute right-1 top-1 bottom-1 flex flex-col">
        <button
          type="button"
          onClick={increment}
          className="flex-1 flex items-center justify-center w-6 text-gray-400 hover:text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors duration-150 rounded-tr-md"
          tabIndex={-1}
        >
          <ChevronUp size={14} />
        </button>
        
        <button
          type="button"
          onClick={decrement}
          className="flex-1 flex items-center justify-center w-6 text-gray-400 hover:text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors duration-150 rounded-br-md"
          tabIndex={-1}
        >
          <ChevronDown size={14} />
        </button>
      </div> */}
    </div>
  );
};

export default NumberInput;
