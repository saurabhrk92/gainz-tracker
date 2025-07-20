import { useState, useEffect } from 'react';
import { WorkoutSession, WorkoutTemplate, SessionExercise, WorkoutSet } from '@/lib/types';
import { getDB } from '@/lib/storage/indexedDB';
import { generateId } from '@/lib/utils';

export function useWorkout() {
  const [currentWorkout, setCurrentWorkout] = useState<WorkoutSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check for active workout on mount
    loadActiveWorkout();
  }, []);

  const loadActiveWorkout = async () => {
    try {
      const db = await getDB();
      const activeWorkout = await db.getActiveWorkout();
      setCurrentWorkout(activeWorkout);
    } catch (error) {
      console.error('Failed to load active workout:', error);
    }
  };

  const startWorkout = async (templateId: string) => {
    setIsLoading(true);
    try {
      const db = await getDB();
      const template = await db.getTemplateById(templateId);
      
      if (!template) {
        throw new Error('Template not found');
      }

      // Create session exercises from template
      const sessionExercises: SessionExercise[] = template.exercises.map(te => ({
        exerciseId: te.exerciseId,
        targetSets: te.targetSets,
        completedSets: 0,
        sets: [],
      }));

      const workout: WorkoutSession = {
        id: generateId(),
        templateId,
        date: new Date(),
        status: 'in_progress',
        exercises: sessionExercises,
        duration: 0,
        totalVolume: 0,
      };

      await db.createWorkout(workout);
      setCurrentWorkout(workout);
    } catch (error) {
      console.error('Failed to start workout:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const submitSet = async (reps: number, weight: number, plateConfig?: any) => {
    if (!currentWorkout) return;

    try {
      const db = await getDB();
      
      const set: WorkoutSet = {
        setNumber: 1, // TODO: Fix this when WorkoutSession interface is updated
        reps,
        weight,
        plateConfig: undefined,
        restTime: 0, // Will be set when rest starts
        completedAt: new Date(),
      };

      // Add set to current exercise
      const updatedExercises = [...currentWorkout.exercises];
      const currentExercise = updatedExercises[0]; // TODO: Fix with proper index
      currentExercise.sets.push(set);
      currentExercise.completedSets = currentExercise.sets.length;

      // Update workout
      const updatedWorkout = {
        ...currentWorkout,
        exercises: updatedExercises,
      };

      // TODO: Fix updateWorkout call when needed
      setCurrentWorkout(updatedWorkout);
    } catch (error) {
      console.error('Failed to submit set:', error);
      throw error;
    }
  };

  const nextExercise = async () => {
    // TODO: Implement when needed
    console.log('Legacy nextExercise called');
  };

  const completeWorkout = async () => {
    if (!currentWorkout) return;

    try {
      const db = await getDB();
      
      const updatedWorkout = {
        ...currentWorkout,
        status: 'completed' as const,
        endTime: new Date(),
      };

      await db.updateWorkout(currentWorkout.id, updatedWorkout);
      setCurrentWorkout(null);
    } catch (error) {
      console.error('Failed to complete workout:', error);
      throw error;
    }
  };

  const pauseWorkout = async () => {
    if (!currentWorkout) return;

    try {
      const db = await getDB();
      
      const updatedWorkout = {
        ...currentWorkout,
        status: 'paused' as const,
      };

      await db.updateWorkout(currentWorkout.id, updatedWorkout);
      setCurrentWorkout(updatedWorkout);
    } catch (error) {
      console.error('Failed to pause workout:', error);
      throw error;
    }
  };

  const resumeWorkout = async () => {
    if (!currentWorkout) return;

    try {
      const db = await getDB();
      
      const updatedWorkout = {
        ...currentWorkout,
        status: 'in_progress' as const,
      };

      await db.updateWorkout(currentWorkout.id, updatedWorkout);
      setCurrentWorkout(updatedWorkout);
    } catch (error) {
      console.error('Failed to resume workout:', error);
      throw error;
    }
  };

  const getCurrentExercise = () => {
    if (!currentWorkout || currentWorkout.exercises.length === 0) return null;
    // Return the first incomplete exercise or the first exercise if all are complete
    const incompleteExercise = currentWorkout.exercises.find(ex => ex.sets.length < ex.targetSets);
    return incompleteExercise || currentWorkout.exercises[0];
  };

  const canCompleteWorkout = () => {
    if (!currentWorkout) return false;
    return currentWorkout.exercises.some(ex => ex.sets.length > 0);
  };

  const getWorkoutProgress = () => {
    if (!currentWorkout) return 0;
    
    const totalSets = currentWorkout.exercises.reduce((total, ex) => total + ex.targetSets, 0);
    const completedSets = currentWorkout.exercises.reduce((total, ex) => total + ex.sets.length, 0);
    
    return totalSets > 0 ? (completedSets / totalSets) * 100 : 0;
  };

  return {
    currentWorkout,
    isLoading,
    startWorkout,
    submitSet,
    nextExercise,
    completeWorkout,
    pauseWorkout,
    resumeWorkout,
    getCurrentExercise,
    canCompleteWorkout,
    getWorkoutProgress,
    loadActiveWorkout,
  };
}