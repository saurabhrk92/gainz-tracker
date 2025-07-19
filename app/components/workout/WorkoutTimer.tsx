'use client';

import { useState, useEffect, useRef } from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';

interface WorkoutTimerProps {
  isActive: boolean;
  onStart: () => void;
  onPause: () => void;
  workoutId?: string;
  startTime?: Date;
}

export default function WorkoutTimer({ isActive, onStart, onPause, workoutId, startTime }: WorkoutTimerProps) {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const storageKey = workoutId ? `workout_timer_${workoutId}` : 'workout_timer_active';

  // Load persisted timer state on mount
  useEffect(() => {
    if (startTime) {
      // Calculate elapsed time from start time
      const calculateElapsed = () => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        return Math.max(0, elapsed);
      };
      
      // Set initial elapsed time
      setSeconds(calculateElapsed());
      
      // Save timer state
      localStorage.setItem(storageKey, JSON.stringify({
        startTime: startTime.toISOString(),
        isActive,
        lastUpdate: new Date().toISOString()
      }));
    } else {
      // Try to restore from localStorage if no start time provided
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const data = JSON.parse(saved);
          const savedStartTime = new Date(data.startTime);
          const elapsed = Math.floor((new Date().getTime() - savedStartTime.getTime()) / 1000);
          setSeconds(Math.max(0, elapsed));
        } catch (error) {
          console.error('Failed to restore timer state:', error);
          localStorage.removeItem(storageKey);
        }
      }
    }
  }, [startTime, storageKey]);

  useEffect(() => {
    if (isActive && startTime) {
      intervalRef.current = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        setSeconds(Math.max(0, elapsed));
        
        // Update localStorage periodically
        localStorage.setItem(storageKey, JSON.stringify({
          startTime: startTime.toISOString(),
          isActive: true,
          lastUpdate: now.toISOString()
        }));
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      // Update localStorage when paused
      if (startTime) {
        localStorage.setItem(storageKey, JSON.stringify({
          startTime: startTime.toISOString(),
          isActive: false,
          lastUpdate: new Date().toISOString()
        }));
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, startTime, storageKey]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="text-center transform hover:scale-[1.02] transition-all duration-200">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-2 font-display">⏱️ Active Time</h3>
          <div className="text-4xl font-bold text-primary-600 font-mono tracking-wide">
            {formatTime(seconds)}
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {isActive ? 'Timer running' : 'Timer paused'}
          </p>
        </div>
        
        <div className="flex gap-2">
          {!isActive ? (
            <Button
              onClick={onStart}
              className="flex-1"
              size="sm"
            >
              ▶️ Resume
            </Button>
          ) : (
            <Button
              onClick={onPause}
              variant="secondary"
              className="flex-1"
              size="sm"
            >
              ⏸️ Pause
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}