'use client';

import { ReactNode, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  console.log('Modal component rendered with isOpen:', isOpen);
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) {
    console.log('Modal not showing because isOpen is false');
    return null;
  }
  
  console.log('Modal should be visible now');

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center animate-fadeIn">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm glass-effect"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={cn(
        'relative bg-white rounded-3xl shadow-glass mx-4 w-full animate-slideUp',
        'border border-white/20 backdrop-blur-md',
        sizeClasses[size]
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100/50">
          <h2 className="text-xl font-bold text-gray-900 font-display">{title}</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-gray-100/80 hover:bg-gray-200/80 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
          >
            <span className="text-gray-600 text-lg">✕</span>
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 max-h-[80vh] overflow-y-auto scrollbar-hide">
          {children}
        </div>
      </div>
    </div>
  );
}