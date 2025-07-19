'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'glass' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const baseClasses = 'font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 border';
  
  const variants = {
    primary: 'bg-gradient-primary text-white border-transparent hover:opacity-90',
    secondary: 'bg-white text-gray-900 border-gray-200 hover:bg-gray-50', 
    glass: 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100',
    danger: 'bg-red-500 text-white border-transparent hover:bg-red-600',
  };
  
  const sizes = {
    sm: 'py-2 px-3 text-sm min-h-[36px]',
    md: 'py-3 px-4 text-sm min-h-[44px]',
    lg: 'py-4 px-6 text-base min-h-[48px]',
  };
  
  return (
    <button
      className={cn(
        baseClasses,
        variants[variant],
        sizes[size],
        loading || disabled ? 'opacity-50 cursor-not-allowed' : '',
        className
      )}
      disabled={loading || disabled}
      {...props}
    >
      {loading ? (
        <>
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>Loading...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}