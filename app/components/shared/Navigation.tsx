'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { UIIcon } from '../ui/Icon';

const navItems = [
  { href: '/', label: 'Home', icon: 'workout' },
  { href: '/templates', label: 'Templates', icon: 'templates' },
  { href: '/exercises', label: 'Exercises', icon: 'exercises' },
  { href: '/history', label: 'History', icon: 'history' },
  { href: '/progress', label: 'Progress', icon: 'progress' },
  { href: '/settings', label: 'Settings', icon: 'settings' },
];

export default function Navigation() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const activeItem = navItems.find(item => item.href === pathname);

  return (
    <>
      {/* Hamburger Menu Button */}
      <div className="fixed top-4 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center shadow-lg border border-gray-200"
        >
          <div className="w-5 h-5 flex flex-col justify-between">
            <div className={cn(
              "h-0.5 bg-purple-600 transition-all duration-300",
              isOpen ? "rotate-45 translate-y-2" : ""
            )} />
            <div className={cn(
              "h-0.5 bg-purple-600 transition-all duration-300",
              isOpen ? "opacity-0" : ""
            )} />
            <div className={cn(
              "h-0.5 bg-purple-600 transition-all duration-300",
              isOpen ? "-rotate-45 -translate-y-2" : ""
            )} />
          </div>
        </button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Side Menu */}
      <div className={cn(
        "fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold text-black">Gainz Tracker</h2>
              <p className="text-sm text-gray-500">Navigation</p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                    isActive 
                      ? 'bg-purple-600 text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <UIIcon name={item.icon as any} size={20} />
                  <span className="font-medium">{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="absolute bottom-6 left-6 right-6">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-600">
                Made with ❤️ for fitness enthusiasts
              </p>
            </div>
          </div>
        </div>
      </div>

    </>
  );
}