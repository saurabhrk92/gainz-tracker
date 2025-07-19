'use client';

import { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import { WorkoutSession } from '@/lib/types';
import { getDB } from '@/lib/storage/indexedDB';
import { formatDate, calculateVolume } from '@/lib/utils';

export default function HistoryPage() {
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkoutHistory();
  }, []);

  const loadWorkoutHistory = async () => {
    try {
      const db = await getDB();
      const allWorkouts = await db.getWorkouts();
      // Sort by date, newest first
      const sorted = allWorkouts.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setWorkouts(sorted);
    } catch (error) {
      console.error('Failed to load workout history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWorkoutDuration = (workout: WorkoutSession): string => {
    if (workout.status === 'in_progress') return 'In progress';
    const minutes = Math.floor(workout.duration / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getWorkoutVolume = (workout: WorkoutSession): number => {
    let totalVolume = 0;
    workout.exercises.forEach(exercise => {
      totalVolume += calculateVolume(exercise.sets);
    });
    return totalVolume;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-gradient-primary text-white p-6 safe-top">
        <h1 className="text-2xl font-bold">📖 Workout History</h1>
        <p className="text-white/80 mt-1">Your complete workout log</p>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 space-y-6">
        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-4">
          <Card variant="glass" className="p-4 text-center">
            <p className="text-3xl font-bold text-primary-600">{workouts.length}</p>
            <p className="text-sm text-gray-600">Total Workouts</p>
          </Card>
          
          <Card variant="glass" className="p-4 text-center">
            <p className="text-3xl font-bold text-primary-600">
              {workouts.filter(w => w.status === 'completed').length}
            </p>
            <p className="text-sm text-gray-600">Completed</p>
          </Card>
        </div>

        {/* Workout History List */}
        <div className="space-y-4">
          {workouts.length > 0 ? (
            workouts.map((workout) => {
              const volume = getWorkoutVolume(workout);
              const duration = getWorkoutDuration(workout);
              const isCompleted = workout.status === 'completed';
              
              return (
                <Card 
                  key={workout.id}
                  className="p-4"
                  onClick={() => window.location.href = `/history/${workout.id}`}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold flex items-center gap-2">
                          📅 {formatDate(new Date(workout.date), 'EEE, MMM d')}
                          {isCompleted && <span className="text-green-600">✅</span>}
                        </p>
                        <p className="text-sm text-gray-600">
                          {workout.exercises.length} exercises • {duration}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary-600">
                          {(volume / 1000).toFixed(1)}k
                        </p>
                        <p className="text-xs text-gray-600">volume</p>
                      </div>
                    </div>
                    
                    {/* Exercise preview */}
                    <div className="text-sm text-gray-500">
                      {workout.exercises.slice(0, 2).map((_, index) => (
                        <span key={index}>
                          Exercise {index + 1}
                          {index < 1 && workout.exercises.length > 2 && ', '}
                        </span>
                      ))}
                      {workout.exercises.length > 2 && (
                        <span> +{workout.exercises.length - 2} more</span>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          ) : (
            <Card className="p-8 text-center text-gray-600">
              <p className="text-lg mb-2">No workout history yet</p>
              <p className="text-sm">Complete your first workout to see it here!</p>
            </Card>
          )}
        </div>
      </main>

    </div>
  );
}