'use client';

import { useState, useEffect } from 'react';
import { WorkoutSession, Exercise } from '@/lib/types';
import { getDB } from '@/lib/storage/indexedDB';
import { formatDate, calculateVolume } from '@/lib/utils';
import { MUSCLE_GROUPS } from '@/lib/constants';
import Modal from '../ui/Modal';
import Card from '../ui/Card';
import { UIIcon, ActionIcon, MuscleGroupIcon } from '../ui/Icon';

interface WorkoutDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  workoutId: string | null;
}

export default function WorkoutDetailsModal({ isOpen, onClose, workoutId }: WorkoutDetailsModalProps) {
  const [workout, setWorkout] = useState<WorkoutSession | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && workoutId) {
      loadWorkoutDetails();
    }
  }, [isOpen, workoutId]);

  const loadWorkoutDetails = async () => {
    if (!workoutId) return;
    
    try {
      setLoading(true);
      const db = await getDB();
      const [workoutData, allExercises] = await Promise.all([
        db.getWorkoutById(workoutId),
        db.getExercises()
      ]);
      
      setWorkout(workoutData);
      setExercises(allExercises);
    } catch (error) {
      console.error('Failed to load workout details:', error);
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

  const getExerciseName = (exerciseId: string): string => {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    return exercise?.name || 'Unknown Exercise';
  };

  const getExerciseMuscleGroup = (exerciseId: string) => {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    return exercise ? MUSCLE_GROUPS[exercise.muscleGroup] : MUSCLE_GROUPS.chest;
  };

  const getTotalVolume = (workout: WorkoutSession): number => {
    return workout.exercises.reduce((total, exercise) => {
      return total + exercise.sets.reduce((exTotal, set) => exTotal + (set.reps * set.weight), 0);
    }, 0);
  };

  const getTotalSets = (workout: WorkoutSession): number => {
    return workout.exercises.reduce((total, exercise) => total + exercise.sets.length, 0);
  };

  const getTotalReps = (workout: WorkoutSession): number => {
    return workout.exercises.reduce((total, exercise) => {
      return total + exercise.sets.reduce((exTotal, set) => exTotal + set.reps, 0);
    }, 0);
  };

  if (!isOpen || !workoutId) return null;

  if (loading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Workout Details" size="lg">
        <div className="flex items-center justify-center py-8">
          <div className="spinner" />
        </div>
      </Modal>
    );
  }

  if (!workout) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Workout Details" size="lg">
        <div className="text-center py-8">
          <p className="text-gray-600">Workout not found</p>
        </div>
      </Modal>
    );
  }

  const isCompleted = workout.status === 'completed';
  const isEndedEarly = workout.status === 'ended_early';
  const isInProgress = workout.status === 'in_progress';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Workout Details" size="lg">
      <div className="space-y-6">
        {/* Header Info */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <UIIcon name="calendar" size={20} />
            <h2 className="text-xl font-bold">
              {formatDate(new Date(workout.date), 'EEEE, MMMM d, yyyy')}
            </h2>
            {isCompleted && <UIIcon name="checkmark" size={20} color="#10B981" />}
            {isEndedEarly && <ActionIcon name="stop" size={20} color="#F59E0B" />}
            {isInProgress && <ActionIcon name="pause" size={20} color="#EF4444" />}
          </div>
          <p className="text-gray-600">
            {getWorkoutDuration(workout)} • {workout.exercises.length} exercises
          </p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-4">
          <Card variant="glass" className="text-center p-4">
            <div className="text-2xl font-bold text-purple-600">{getTotalSets(workout)}</div>
            <div className="text-xs text-gray-600">Total Sets</div>
          </Card>
          <Card variant="glass" className="text-center p-4">
            <div className="text-2xl font-bold text-purple-600">{getTotalReps(workout)}</div>
            <div className="text-xs text-gray-600">Total Reps</div>
          </Card>
          <Card variant="glass" className="text-center p-4">
            <div className="text-2xl font-bold text-purple-600">
              {getTotalVolume(workout) >= 1000 
                ? `${(getTotalVolume(workout) / 1000).toFixed(1)}k` 
                : getTotalVolume(workout).toLocaleString()
              }
            </div>
            <div className="text-xs text-gray-600">Volume (lbs)</div>
          </Card>
        </div>

        {/* Exercise Details */}
        <div>
          <h3 className="text-lg font-bold mb-4">Exercises</h3>
          <div className="space-y-4">
            {workout.exercises.map((sessionExercise, index) => {
              const exerciseName = getExerciseName(sessionExercise.exerciseId);
              const muscleGroupInfo = getExerciseMuscleGroup(sessionExercise.exerciseId);
              const exerciseVolume = sessionExercise.sets.reduce((sum, set) => sum + (set.reps * set.weight), 0);
              
              return (
                <Card key={index} className="p-4">
                  <div className="space-y-3">
                    {/* Exercise Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                          style={{ backgroundColor: muscleGroupInfo.color }}
                        >
                          <MuscleGroupIcon 
                            name={muscleGroupInfo.icon as any} 
                            size={20} 
                            color="white"
                          />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">{exerciseName}</h4>
                          <p className="text-sm" style={{ color: muscleGroupInfo.color }}>
                            {muscleGroupInfo.label}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">{sessionExercise.sets.length} sets</div>
                        <div className="text-sm text-gray-600">
                          {exerciseVolume} lbs volume
                        </div>
                      </div>
                    </div>

                    {/* Sets Details */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="grid gap-2">
                        {sessionExercise.sets.map((set, setIndex) => (
                          <div 
                            key={setIndex}
                            className="flex items-center justify-between bg-white rounded-lg p-2"
                          >
                            <span className="font-semibold text-gray-700">Set {setIndex + 1}</span>
                            <div className="flex items-center gap-4">
                              <span className="text-sm font-medium">{set.reps} reps</span>
                              <span className="text-sm font-medium">{set.weight} lbs</span>
                              <span className="text-xs text-gray-500">
                                {set.reps * set.weight} vol
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
}