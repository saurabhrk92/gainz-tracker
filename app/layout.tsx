import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AuthProvider from '@/lib/auth/AuthProvider';
import PageTransition from './components/layout/PageTransition';
import AppShell from './components/layout/AppShell';
import WorkoutPersistenceProvider from './components/workout/WorkoutPersistenceProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Gainz Tracker - Weight Lifting Progress',
  description: 'Track your weight lifting progress with advanced analytics and Google Drive sync',
  keywords: 'weight lifting, fitness tracker, workout log, exercise tracker, gainz',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#667eea',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <WorkoutPersistenceProvider>
            <AppShell>
              <PageTransition>
                {children}
              </PageTransition>
            </AppShell>
          </WorkoutPersistenceProvider>
        </AuthProvider>
      </body>
    </html>
  );
}