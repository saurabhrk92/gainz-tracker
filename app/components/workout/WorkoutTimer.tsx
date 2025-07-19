'use client';

import { useState, useEffect, useRef } from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';

interface WorkoutTimerProps {
  isActive: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
}

export default function WorkoutTimer({ isActive, onStart, onPause, onReset }: WorkoutTimerProps) {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleReset = () => {
    setSeconds(0);
    onReset();
  };

  return (
    <Card className="text-center transform hover:scale-[1.02] transition-all duration-200">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-2 font-display">⏱️ Workout Timer</h3>
          <div className="text-4xl font-bold text-primary-600 font-mono tracking-wide">
            {formatTime(seconds)}
          </div>
        </div>
        
        <div className="flex gap-2">
          {!isActive ? (
            <Button
              onClick={onStart}
              className="flex-1"
              size="sm"
            >
              ▶️ Start
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
          
          <Button
            onClick={handleReset}
            variant="glass"
            size="sm"
            disabled={seconds === 0}
          >
            🔄 Reset
          </Button>
        </div>
      </div>
    </Card>
  );
}