'use client'

import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  categories?: 'Large' | 'Medium';
  color?: 'Green' | 'NonPrimary' | 'Disable' | 'Blue' | 'Fade';
};

const COLOR_CLASSES = {
  Green: 'bg-primary hover:bg-primary-hover text-white border-2 border-primary',
  NonPrimary: 'bg-primary-fade hover:bg-primary-lt text-white',
  Disable: 'text-primary-fade hover:text-primary bg-[#13595407] border-2 border-primary-fade cursor-not-allowed',
  Fade: 'text-primary-fade hover:text-primary bg-[#13595407] border-2 border-primary-fade',
  Blue: 'bg-blue-500 hover:bg-blue-700 text-white',
};

const CATEGORY_CLASSES = {
  Large: 'px-4 py-2 font-bold w-full',
  Medium: 'px-4 py-1.5 text-sm font-medium w-full',
};

const Button: React.FC<ButtonProps> = ({
  children,
  categories = 'Large',
  color = 'Green',
  className = '',
  disabled,
  ...props
}) => {
  const baseColor = COLOR_CLASSES[color] || COLOR_CLASSES.Green;
  const baseCategory = CATEGORY_CLASSES[categories] || CATEGORY_CLASSES.Large;
  const finalClassName = [
    baseColor,
    baseCategory,
    'text-center rounded transition',
    className,
    disabled ? 'opacity-60 pointer-events-none' : '',
  ].join(' ');

  return (
    <button
      className={finalClassName}
      disabled={color === 'Disable' ? true : disabled}
      aria-disabled={color === 'Disable' ? true : disabled}
      tabIndex={color === 'Disable' || disabled ? -1 : 0}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
