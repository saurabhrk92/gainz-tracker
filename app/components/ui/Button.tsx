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
  const baseClasses = 'font-semibold rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 no-select transform hover:-translate-y-1 active:scale-95 shadow-lg hover:shadow-xl';
  
  const variants = {
    primary: 'bg-gradient-success text-white',
    secondary: 'bg-gradient-accent text-white', 
    glass: 'bg-white/25 backdrop-blur-md border border-white/20 text-gray-700 hover:bg-white/35',
    danger: 'bg-gradient-to-r from-red-500 to-red-600 text-white',
  };
  
  const sizes = {
    sm: 'py-2 px-4 text-sm',
    md: 'py-3 px-6 text-base',
    lg: 'py-4 px-8 text-lg font-bold',
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