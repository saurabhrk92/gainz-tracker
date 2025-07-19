'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'gradient';
  gradient?: 'primary' | 'secondary' | 'success' | 'accent' | 'warm';
  onClick?: () => void;
  style?: React.CSSProperties;
}

export default function Card({
  children,
  className,
  variant = 'default',
  gradient = 'primary',
  onClick,
  style,
}: CardProps) {
  const baseClasses = 'rounded-lg p-4 transition-all duration-200';
  
  const variants = {
    default: 'bg-white border border-gray-100 shadow-sm hover:shadow-md',
    glass: 'bg-gray-50/50 border border-gray-100',
    gradient: 'text-white border-0',
  };
  
  const gradients = {
    primary: 'bg-gradient-primary',
    secondary: 'bg-gradient-secondary',
    success: 'bg-gradient-success',
    accent: 'bg-gradient-accent',
    warm: 'bg-gradient-warm',
  };
  
  const classes = cn(
    baseClasses,
    variants[variant],
    variant === 'gradient' ? `${gradients[gradient]} text-white border-white/20` : '',
    onClick ? 'cursor-pointer hover:shadow-hover hover:-translate-y-1 transform' : '',
    className
  );
  
  return (
    <div className={classes} onClick={onClick} style={style}>
      {children}
    </div>
  );
}