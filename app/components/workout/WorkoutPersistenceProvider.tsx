'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkoutPersistence } from '@/lib/hooks/useWorkoutPersistence';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Modal from '../ui/Modal';

export default function WorkoutPersistenceProvider({ children }: { children: React.ReactNode }) {
  const { activeWorkout, timerState, loading } = useWorkoutPersistence();
  const [showPrompt, setShowPrompt] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Disabled: User requested removal of problematic active workout notification
    // The notification had issues with inactive timer, no close button, and direct links
    // Users can access active workouts through the home page instead
  }, [loading, activeWorkout]);

  const handleContinueWorkout = () => {
    if (activeWorkout) {
      setShowPrompt(false);
      router.push(`/workout?workoutId=${activeWorkout.id}`);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (loading) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      
      {/* Active Workout Detection Modal */}
      <Modal
        isOpen={showPrompt}
        onClose={handleDismiss}
        title="Continue Workout?"
        size="sm"
      >
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-4xl mb-2">🏋️</div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              You have an active workout!
            </h3>
            <p className="text-gray-600 text-sm">
              {activeWorkout?.templateId ? 'Your workout is still in progress.' : 'Continue where you left off.'}
            </p>
            
            {timerState && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-800">
                  <div className="font-medium">Timer Status</div>
                  <div className="text-xs">
                    {timerState.isActive ? 'Running' : 'Paused'} • Last active: {new Date(timerState.lastUpdate).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex gap-3">
            <Button
              onClick={handleDismiss}
              variant="secondary"
              className="flex-1"
              size="sm"
            >
              Later
            </Button>
            <Button
              onClick={handleContinueWorkout}
              className="flex-1"
              size="sm"
            >
              Continue Workout
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}