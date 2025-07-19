'use client';

import { useEffect, useState } from 'react';
import { WorkoutSession } from '@/lib/types';
import { getDB } from '@/lib/storage/indexedDB';

interface WorkoutTimerState {
  startTime: string;
  isActive: boolean;
  lastUpdate: string;
}

export function useWorkoutPersistence() {
  const [activeWorkout, setActiveWorkout] = useState<WorkoutSession | null>(null);
  const [timerState, setTimerState] = useState<WorkoutTimerState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkForActiveWorkout = async () => {
      try {
        const db = await getDB();
        const activeWorkout = await db.getActiveWorkout();
        
        if (activeWorkout) {
          setActiveWorkout(activeWorkout);
          
          // Try to restore timer state from localStorage
          const storageKey = `workout_timer_${activeWorkout.id}`;
          const savedTimer = localStorage.getItem(storageKey);
          
          if (savedTimer) {
            try {
              const timerData = JSON.parse(savedTimer);
              setTimerState(timerData);
            } catch (error) {
              console.error('Failed to parse timer state:', error);
              localStorage.removeItem(storageKey);
            }
          }
        }
      } catch (error) {
        console.error('Failed to check for active workout:', error);
      } finally {
        setLoading(false);
      }
    };

    checkForActiveWorkout();
  }, []);

  const clearWorkoutPersistence = (workoutId: string) => {
    const storageKey = `workout_timer_${workoutId}`;
    localStorage.removeItem(storageKey);
    setActiveWorkout(null);
    setTimerState(null);
  };

  return {
    activeWorkout,
    timerState,
    loading,
    clearWorkoutPersistence,
  };
}