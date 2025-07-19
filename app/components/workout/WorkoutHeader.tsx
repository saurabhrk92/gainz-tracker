'use client';

import { useState, useEffect } from 'react';
import { WorkoutSession } from '@/lib/types';
import { formatTime } from '@/lib/utils';
import { ActionIcon } from '../ui/Icon';

interface WorkoutHeaderProps {
  workout: WorkoutSession;
  progress: number;
  onPause: () => void;
  onResume: () => void;
  onComplete: () => void;
  canComplete: boolean;
}

export default function WorkoutHeader({
  workout,
  progress,
  onPause,
  onResume,
  onComplete,
  canComplete,
}: WorkoutHeaderProps) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      if (workout.status === 'in_progress') {
        // TODO: Calculate elapsed time if needed
        setElapsedTime(0);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [workout.status]);

  return (
    <header className="bg-gradient-primary text-white p-6 safe-top relative overflow-hidden">
      <div className="relative z-10">
        {/* Status and Time */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold font-display">Live Workout</h1>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  workout.status === 'in_progress' ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'
                }`} />
                <span className="text-white/90 text-sm font-medium">
                  {workout.status === 'in_progress' ? 'In Progress' : 'Paused'}
                </span>
              </div>
              <span className="text-white/70 text-sm">•</span>
              <span className="text-white/90 text-sm font-mono">
                {formatTime(elapsedTime)}
              </span>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex gap-2">
            {workout.status === 'in_progress' ? (
              <button
                onClick={onPause}
                className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-200"
              >
                <ActionIcon name="pause" size={20} color="white" />
              </button>
            ) : (
              <button
                onClick={onResume}
                className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-200"
              >
                <ActionIcon name="play" size={20} color="white" />
              </button>
            )}
            
            {canComplete && (
              <button
                onClick={onComplete}
                className="w-10 h-10 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center transition-all duration-200"
              >
                <ActionIcon name="finish" size={20} color="white" />
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-white/90 text-sm font-medium">Progress</span>
            <span className="text-white/90 text-sm font-mono">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Exercise Counter */}
        <div className="mt-4 flex items-center gap-2">
          <span className="text-white/70 text-sm">Exercise</span>
          <span className="text-white font-bold">
            {workout.exercises.length} total
          </span>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-4 -translate-x-4"></div>
    </header>
  );
}