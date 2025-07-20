'use client';

import { useState, useEffect, useRef } from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { ActionIcon, UIIcon } from '../ui/Icon';
import { showTimerNotification, vibratePhone, requestNotificationPermission } from '@/lib/utils/notifications';

interface RestTimerProps {
  duration: number; // in seconds
  onComplete?: () => void;
  onCancel?: () => void;
}

export default function RestTimer({ duration, onComplete, onCancel }: RestTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isActive, setIsActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setTimeLeft(duration);
    setIsActive(true); // Auto-start timer when component mounts
    setIsCompleted(false);
    
    // Request notification permission when timer starts
    requestNotificationPermission();
  }, [duration]);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsActive(false);
            setIsCompleted(true);
            onComplete?.();
            
            // Multi-modal notification: vibration + browser notification + audio
            console.log('Rest timer complete - triggering notifications');
            
            // 1. Vibrate phone (works even when app is in background)
            vibratePhone([500, 200, 500, 200, 500]);
            
            // 2. Show browser notification (works when app is in background)
            showTimerNotification('Rest timer finished! Time to get back to your workout.');
            
            // 3. Play notification sound (if available and app is in foreground)
            try {
              const audio = new Audio('/notification.mp3');
              audio.play().catch(() => {
                console.log('Audio notification failed, but vibration and notification should still work');
              });
            } catch (error) {
              console.log('Audio not available, relying on vibration and notifications');
            }
            
            return 0;
          }
          return prev - 1;
        });
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
  }, [isActive, timeLeft, onComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    return ((duration - timeLeft) / duration) * 100;
  };

  const getTimeColor = () => {
    const percentage = (timeLeft / duration) * 100;
    if (percentage > 50) return 'text-green-600';
    if (percentage > 25) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleStart = () => {
    setIsActive(true);
    setIsCompleted(false);
  };

  const handlePause = () => {
    setIsActive(false);
  };

  const handleReset = () => {
    setTimeLeft(duration);
    setIsActive(false);
    setIsCompleted(false);
  };

  const handleAddTime = (seconds: number) => {
    setTimeLeft(prev => Math.max(0, prev + seconds));
  };

  const handleCancel = () => {
    setIsActive(false);
    setIsCompleted(false);
    onCancel?.();
  };

  return (
    <Card className={`text-center transform transition-all duration-200 ${
      isCompleted ? 'ring-2 ring-green-500 bg-green-50' : 'hover:scale-[1.02]'
    }`}>
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-2 font-display">
            {isCompleted ? (
              <span className="flex items-center justify-center gap-2">
                <UIIcon name="checkmark" size={20} color="#10B981" />
                Rest Complete!
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <ActionIcon name="timer" size={20} color="#6B7280" />
                Rest Timer
              </span>
            )}
          </h3>
          
          {/* Progress Circle */}
          <div className="relative w-32 h-32 mx-auto mb-4">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-gray-200"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - getProgress() / 100)}`}
                className={`transition-all duration-1000 ${
                  isCompleted ? 'text-green-500' : 'text-primary-500'
                }`}
                strokeLinecap="round"
              />
            </svg>
            
            {/* Time display */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`text-3xl font-bold font-mono ${getTimeColor()}`}>
                {formatTime(timeLeft)}
              </div>
            </div>
          </div>
        </div>

        {!isCompleted ? (
          <div className="space-y-3">
            {/* Main controls */}
            <div className="flex gap-2">
              {!isActive ? (
                <Button
                  onClick={handleStart}
                  className="flex-1"
                  size="sm"
                  disabled={timeLeft === 0}
                >
                  <ActionIcon name="play" size={16} className="mr-1" />
                  Start
                </Button>
              ) : (
                <Button
                  onClick={handlePause}
                  variant="secondary"
                  className="flex-1"
                  size="sm"
                >
                  <ActionIcon name="pause" size={16} className="mr-1" />
                  Pause
                </Button>
              )}
              
              <Button
                onClick={handleReset}
                variant="glass"
                size="sm"
              >
                Reset
              </Button>
            </div>

            {/* Time adjustment controls */}
            <div className="flex gap-1 justify-center">
              <Button
                onClick={() => handleAddTime(-15)}
                variant="glass"
                size="sm"
                disabled={timeLeft <= 15}
                className="text-xs px-2"
              >
                -15s
              </Button>
              <Button
                onClick={() => handleAddTime(15)}
                variant="glass"
                size="sm"
                className="text-xs px-2"
              >
                +15s
              </Button>
              <Button
                onClick={() => handleAddTime(30)}
                variant="glass"
                size="sm"
                className="text-xs px-2"
              >
                +30s
              </Button>
            </div>

            {/* Cancel button */}
            <Button
              onClick={handleCancel}
              variant="danger"
              size="sm"
              className="w-full"
            >
              <ActionIcon name="delete" size={16} className="mr-1" />
              Skip Rest
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-green-600 font-semibold">
              Rest period finished! Ready for your next set.
            </div>
            <Button
              onClick={handleCancel}
              className="w-full"
              size="sm"
            >
              Continue Workout
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}