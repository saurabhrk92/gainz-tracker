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
  const baseClasses = 'rounded-3xl p-4 md:p-6 transition-all duration-200 border border-gray-100/50';
  
  const variants = {
    default: 'bg-white/95 backdrop-blur-md shadow-lg hover:shadow-xl',
    glass: 'bg-white/25 backdrop-blur-md border-white/20 shadow-glass',
    gradient: 'shadow-xl',
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