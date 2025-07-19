'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Navigation from '../shared/Navigation';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 300);
    return () => clearTimeout(timer);
  }, [pathname]);

  // Don't show navigation on certain pages
  const hideNavigation = pathname === '/auth/signin' || pathname?.startsWith('/workout');

  return (
    <div className="relative min-h-screen bg-gray-50">
      {/* Loading bar */}
      {isTransitioning && (
        <div className="fixed top-0 left-0 right-0 z-[9999]">
          <div className="h-1 bg-gradient-to-r from-primary-500 to-primary-600 animate-pulse" />
        </div>
      )}
      
      {/* Main content */}
      <main className={`${!hideNavigation ? 'pb-28' : ''}`}>
        {children}
      </main>
      
      {/* Navigation */}
      {!hideNavigation && <Navigation />}
    </div>
  );
}