'use client';

import { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import WorkoutDetailsModal from '../components/workout/WorkoutDetailsModal';
import { WorkoutSession, Exercise } from '@/lib/types';
import { getDB } from '@/lib/storage/indexedDB';
import { formatDate, calculateVolume } from '@/lib/utils';
import { MUSCLE_GROUPS } from '@/lib/constants';
import { UIIcon, ActionIcon, MuscleGroupIcon } from '../components/ui/Icon';

export default function HistoryPage() {
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [showWorkoutDetails, setShowWorkoutDetails] = useState(false);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);

  useEffect(() => {
    loadWorkoutHistory();
  }, []);

  const loadWorkoutHistory = async () => {
    try {
      const db = await getDB();
      const [allWorkouts, allExercises] = await Promise.all([
        db.getWorkouts(),
        db.getExercises()
      ]);
      
      // Sort by date, newest first
      const sorted = allWorkouts.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setWorkouts(sorted);
      setExercises(allExercises);
    } catch (error) {
      console.error('Failed to load workout history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWorkoutDuration = (workout: WorkoutSession): string => {
    if (workout.status === 'in_progress') return 'In progress';
    if (workout.status === 'ended_early') {
      const minutes = Math.floor(workout.duration / 60);
      const timeStr = minutes < 60 ? `${minutes}m` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
      return `${timeStr} (ended early)`;
    }
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

  const getExerciseName = (exerciseId: string): string => {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    return exercise?.name || 'Unknown Exercise';
  };

  const getWorkoutMuscleGroupVolumes = (workout: WorkoutSession) => {
    const muscleGroupTotals: { [key: string]: number } = {};
    
    workout.exercises.forEach(sessionExercise => {
      const exercise = exercises.find(ex => ex.id === sessionExercise.exerciseId);
      if (exercise) {
        const exerciseVolume = sessionExercise.sets.reduce((sum, set) => 
          sum + (set.reps * set.weight), 0
        );
        muscleGroupTotals[exercise.muscleGroup] = (muscleGroupTotals[exercise.muscleGroup] || 0) + exerciseVolume;
      }
    });
    
    // Sort by volume and return top 3 muscle groups for preview
    return Object.entries(muscleGroupTotals)
      .filter(([_, volume]) => volume > 0)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);
  };

  const openWorkoutDetails = (workoutId: string) => {
    setSelectedWorkoutId(workoutId);
    setShowWorkoutDetails(true);
  };

  const closeWorkoutDetails = () => {
    setShowWorkoutDetails(false);
    setSelectedWorkoutId(null);
  };

  const handleDeleteWorkout = async (workoutId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent opening workout details
    
    const confirmed = confirm('Are you sure you want to delete this workout? This action cannot be undone.');
    if (!confirmed) return;
    
    try {
      const db = await getDB();
      await db.deleteWorkout(workoutId);
      
      // Remove from local state
      setWorkouts(prevWorkouts => prevWorkouts.filter(w => w.id !== workoutId));
      
      console.log('Workout deleted successfully');
    } catch (error) {
      console.error('Failed to delete workout:', error);
      alert('Failed to delete workout. Please try again.');
    }
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
        <h1 className="text-2xl font-bold">Workout History</h1>
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
              const isEndedEarly = workout.status === 'ended_early';
              
              return (
                <Card 
                  key={workout.id}
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => openWorkoutDetails(workout.id)}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold flex items-center gap-2">
                          <UIIcon name="calendar" size={16} className="mr-1" />
                          {formatDate(new Date(workout.date), 'EEE, MMM d')}
                          {isCompleted && <UIIcon name="checkmark" size={16} color="#10B981" />}
                          {isEndedEarly && <ActionIcon name="stop" size={16} color="#F59E0B" />}
                        </p>
                        <p className="text-sm text-gray-600">
                          {workout.exercises.length} exercises • {duration}
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="text-right">
                          <div className="space-y-1">
                            {getWorkoutMuscleGroupVolumes(workout).map(([muscleGroup, mgVolume]) => {
                              const muscleInfo = MUSCLE_GROUPS[muscleGroup as keyof typeof MUSCLE_GROUPS];
                              return (
                                <div key={muscleGroup} className="flex items-center gap-1 justify-end">
                                  <span className="text-xs font-medium" style={{ color: muscleInfo.color }}>
                                    {Math.round(mgVolume)} lbs
                                  </span>
                                  <MuscleGroupIcon 
                                    name={muscleInfo.icon as any} 
                                    size={12} 
                                    color={muscleInfo.color}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        
                        {/* Delete Button - Only show for completed/ended workouts */}
                        {(isCompleted || isEndedEarly) && (
                          <button
                            onClick={(e) => handleDeleteWorkout(workout.id, e)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors rounded"
                            title="Delete Workout"
                          >
                            <ActionIcon name="delete" size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Exercise preview */}
                    <div className="text-sm text-gray-500">
                      {workout.exercises.slice(0, 2).map((sessionExercise, index) => (
                        <span key={index}>
                          {getExerciseName(sessionExercise.exerciseId)}
                          {index < 1 && workout.exercises.length > 1 && ', '}
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

      {/* Workout Details Modal */}
      <WorkoutDetailsModal
        isOpen={showWorkoutDetails}
        onClose={closeWorkoutDetails}
        workoutId={selectedWorkoutId}
      />
    </div>
  );
}