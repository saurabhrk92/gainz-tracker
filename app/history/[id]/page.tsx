'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { WorkoutSession, Exercise } from '@/lib/types';
import { getDB } from '@/lib/storage/indexedDB';
import { formatDate, calculateVolume } from '@/lib/utils';

export default function WorkoutDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workoutId = params.id as string;
  
  const [workout, setWorkout] = useState<WorkoutSession | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkoutDetail();
  }, [workoutId]);

  const loadWorkoutDetail = async () => {
    try {
      const db = await getDB();
      
      // Load workout session
      const workoutData = await db.getWorkoutById(workoutId);
      if (!workoutData) {
        router.push('/history');
        return;
      }
      setWorkout(workoutData);

      // Load exercise details for each exercise in the workout
      const exercisePromises = workoutData.exercises.map(sessionExercise => 
        db.getExerciseById(sessionExercise.exerciseId)
      );
      const exerciseData = await Promise.all(exercisePromises);
      setExercises(exerciseData.filter(Boolean) as Exercise[]);
      
    } catch (error) {
      console.error('Failed to load workout detail:', error);
      router.push('/history');
    } finally {
      setLoading(false);
    }
  };

  const getWorkoutDuration = (): string => {
    if (!workout) return '';
    if (workout.status === 'in_progress') return 'In progress';
    const minutes = Math.floor(workout.duration / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getWorkoutVolume = (): number => {
    if (!workout) return 0;
    let totalVolume = 0;
    workout.exercises.forEach(exercise => {
      totalVolume += calculateVolume(exercise.sets);
    });
    return totalVolume;
  };

  const getExerciseName = (exerciseId: string): string => {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    return exercise?.name || 'Unknown Exercise';
  };

  const getExerciseType = (exerciseId: string): string => {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    return exercise?.type || 'unknown';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner" />
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="text-center">
          <h2 className="text-lg font-bold text-black mb-2">Workout Not Found</h2>
          <p className="text-gray-600 mb-4">This workout could not be found.</p>
          <Button onClick={() => router.push('/history')}>
            Back to History
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="pt-12 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="glass"
            size="sm"
            onClick={() => router.back()}
            className="w-10 h-10 p-0"
          >
            ←
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-black">Workout Details</h1>
            <p className="text-gray-500 text-sm">{formatDate(new Date(workout.date), 'MMM d, yyyy')}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="space-y-6">
        {/* Workout Summary */}
        <Card>
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-black">Workout Summary</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-purple-600">{getWorkoutDuration()}</div>
                <div className="text-xs text-gray-600">Duration</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-purple-600">{getWorkoutVolume().toLocaleString()}</div>
                <div className="text-xs text-gray-600">Total Volume (lbs)</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-purple-600">{workout.exercises.length}</div>
                <div className="text-xs text-gray-600">Exercises</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {workout.exercises.reduce((total, ex) => total + ex.sets.length, 0)}
                </div>
                <div className="text-xs text-gray-600">Total Sets</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                workout.status === 'completed' ? 'bg-green-500' : 
                workout.status === 'in_progress' ? 'bg-yellow-500' : 
                workout.status === 'ended_early' ? 'bg-orange-500' : 'bg-gray-500'
              }`} />
              <span className="text-sm text-gray-600 capitalize">
                {workout.status === 'ended_early' ? 'Ended Early' : workout.status.replace('_', ' ')}
              </span>
            </div>
          </div>
        </Card>

        {/* Exercise Details */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-black">Exercise Breakdown</h2>
          
          {workout.exercises.map((sessionExercise, exerciseIndex) => {
            const exerciseName = getExerciseName(sessionExercise.exerciseId);
            const exerciseType = getExerciseType(sessionExercise.exerciseId);
            const exerciseVolume = calculateVolume(sessionExercise.sets);

            return (
              <Card key={sessionExercise.exerciseId}>
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-base font-bold text-black">{exerciseName}</h3>
                      <p className="text-sm text-gray-500 capitalize">
                        {exerciseType} • {sessionExercise.sets.length} sets • {exerciseVolume.toLocaleString()} lbs volume
                      </p>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      Exercise {exerciseIndex + 1}
                    </div>
                  </div>

                  {/* Sets Table */}
                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    <div className="bg-gray-50 px-4 py-2 grid grid-cols-3 gap-4 text-xs font-semibold text-gray-700">
                      <div>Set</div>
                      <div className="text-center">Reps</div>
                      <div className="text-right">Weight (lbs)</div>
                    </div>
                    {sessionExercise.sets.map((set, setIndex) => (
                      <div key={setIndex} className="px-4 py-3 grid grid-cols-3 gap-4 text-sm border-t border-gray-100">
                        <div className="font-medium text-gray-900">{setIndex + 1}</div>
                        <div className="text-center text-gray-600">{set.reps}</div>
                        <div className="text-right text-gray-600">{set.weight}</div>
                      </div>
                    ))}
                  </div>

                  {/* Set Summary */}
                  {sessionExercise.sets.length > 0 && (
                    <div className="bg-purple-50 rounded-lg p-3">
                      <div className="grid grid-cols-3 gap-4 text-xs">
                        <div>
                          <div className="text-purple-600 font-semibold">Best Set</div>
                          <div className="text-gray-700">
                            {Math.max(...sessionExercise.sets.map(s => s.reps))} reps @ {Math.max(...sessionExercise.sets.map(s => s.weight))} lbs
                          </div>
                        </div>
                        <div>
                          <div className="text-purple-600 font-semibold">Avg Weight</div>
                          <div className="text-gray-700">
                            {Math.round(sessionExercise.sets.reduce((sum, s) => sum + s.weight, 0) / sessionExercise.sets.length)} lbs
                          </div>
                        </div>
                        <div>
                          <div className="text-purple-600 font-semibold">Total Reps</div>
                          <div className="text-gray-700">
                            {sessionExercise.sets.reduce((sum, s) => sum + s.reps, 0)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-4">
          <Button
            variant="glass"
            onClick={() => router.push('/history')}
            className="w-full"
          >
            Back to History
          </Button>
          <Button
            onClick={() => router.push('/')}
            className="w-full"
          >
            Home
          </Button>
        </div>
      </main>
    </div>
  );
}