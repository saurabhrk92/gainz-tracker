'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Home', icon: '🏠' },
  { href: '/templates', label: 'Templates', icon: '📋' },
  { href: '/exercises', label: 'Exercises', icon: '💪' },
  { href: '/progress', label: 'Progress', icon: '📊' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 safe-bottom z-50">
      <div className="mx-3 mb-3">
        <div className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-3xl shadow-glass">
          <div className="flex justify-around items-center h-24 px-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  className={cn(
                    'flex flex-col items-center justify-center py-3 px-2 rounded-2xl transition-all duration-200 min-w-0 flex-1 transform min-h-[64px]',
                    isActive 
                      ? 'bg-gradient-primary text-white shadow-lg scale-105' 
                      : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50/80 hover:scale-105'
                  )}
                >
                  <span className={cn(
                    'text-2xl mb-1 transition-all duration-200',
                    isActive && 'drop-shadow-sm'
                  )}>
                    {item.icon}
                  </span>
                  <span className={cn(
                    'text-xs font-medium truncate transition-all duration-200 mt-1',
                    isActive ? 'font-semibold text-white' : 'text-gray-600'
                  )}>
                    {item.label}
                  </span>
                  {isActive && (
                    <div className="w-2 h-2 bg-white rounded-full mt-1 animate-pulse"></div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}