'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Exercise, WorkoutTemplate } from '@/lib/types';
import { getDB } from '@/lib/storage/indexedDB';
import { formatTime } from '@/lib/utils';
import { MUSCLE_GROUPS } from '@/lib/constants';
import RestTimer from './RestTimer';
import WorkoutTimer from './WorkoutTimer';
import PlateCalculator from './PlateCalculator';
import SetInputForm from './SetInputForm';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Modal from '../ui/Modal';
import ConfirmModal from '../ui/ConfirmModal';
import { MuscleGroupIcon, ActionIcon } from '../ui/Icon';
import { useSync } from '@/lib/hooks/useSync';

interface WorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateId?: string;
  workoutId?: string;
}

export default function WorkoutModal({ isOpen, onClose, templateId, workoutId }: WorkoutModalProps) {
  const router = useRouter();
  const { syncWorkoutEvent } = useSync();
  
  const [template, setTemplate] = useState<WorkoutTemplate | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [sets, setSets] = useState<{ [exerciseId: string]: Array<{ reps: number; weight: number }> }>({});
  const [loading, setLoading] = useState(true);
  const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null);
  const [isWorkoutTimerActive, setIsWorkoutTimerActive] = useState(false);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restTime, setRestTime] = useState(0);
  const [showPlateCalculator, setShowPlateCalculator] = useState(false);
  const [currentWeight, setCurrentWeight] = useState(0);
  const [isProgressing, setIsProgressing] = useState(false);
  const [workoutSessionId, setWorkoutSessionId] = useState<string | null>(null);
  const [totalSetsLogged, setTotalSetsLogged] = useState(0);
  const [lastSetTime, setLastSetTime] = useState<Date | null>(null);
  const [timeoutWarningShown, setTimeoutWarningShown] = useState(false);
  const [editingSet, setEditingSet] = useState<{exerciseId: string, setIndex: number} | null>(null);
  const [editReps, setEditReps] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [showEndWorkoutConfirm, setShowEndWorkoutConfirm] = useState(false);
  const [showDeleteSetConfirm, setShowDeleteSetConfirm] = useState(false);
  const [setToDelete, setSetToDelete] = useState<{exerciseId: string, setIndex: number} | null>(null);

  useEffect(() => {
    if (isOpen && (templateId || workoutId)) {
      loadWorkoutData();
    }
  }, [isOpen, templateId, workoutId]);

  // Auto-timeout workout after 60 minutes of inactivity
  useEffect(() => {
    if (!isOpen || !workoutSessionId || !lastSetTime) return;

    const TIMEOUT_MINUTES = 60;
    const checkInterval = setInterval(async () => {
      const now = new Date();
      const minutesSinceLastSet = (now.getTime() - lastSetTime.getTime()) / (1000 * 60);

      if (minutesSinceLastSet >= TIMEOUT_MINUTES) {
        console.log(`Auto-ending workout after ${TIMEOUT_MINUTES} minutes of inactivity`);
        
        try {
          const db = await getDB();
          
          // Calculate volume for completed sets
          const totalVolume = Object.values(sets).reduce((total, exerciseSets) => {
            return total + exerciseSets.reduce((exTotal, set) => exTotal + (set.reps * set.weight), 0);
          }, 0);
          
          // Auto-end workout as ended_early
          await db.updateWorkout(workoutSessionId, {
            status: 'ended_early',
            duration: Math.floor((now.getTime() - workoutStartTime!.getTime()) / 1000),
            totalVolume
          });
          
          // Clean up timer localStorage data
          const storageKey = `workout_timer_${workoutSessionId}`;
          localStorage.removeItem(storageKey);
          
          // Sync auto-ended workout
          syncWorkoutEvent('workout_auto_timeout');
          
          alert('Workout automatically ended due to 60 minutes of inactivity.');
          onClose();
          router.push('/history');
        } catch (error) {
          console.error('Failed to auto-end workout:', error);
        }
        
        clearInterval(checkInterval);
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkInterval);
  }, [isOpen, workoutSessionId, lastSetTime, sets, workoutStartTime, syncWorkoutEvent, onClose, router]);

  const loadWorkoutData = async () => {
    if (!templateId && !workoutId) {
      return;
    }

    try {
      const db = await getDB();
      
      if (workoutId) {
        // Resuming existing workout
        const existingWorkout = await db.getWorkoutById(workoutId);
        if (!existingWorkout) {
          onClose();
          return;
        }
        
        // Load template for the workout
        const templateData = await db.getTemplateById(existingWorkout.templateId);
        if (!templateData) {
          onClose();
          return;
        }
        
        setTemplate(templateData);
        setWorkoutSessionId(workoutId);
        setWorkoutStartTime(new Date(existingWorkout.date));
        setLastSetTime(new Date()); // Reset timeout tracking for resumed workout
        setIsWorkoutTimerActive(true);
        
        // Restore existing sets
        const restoredSets: { [exerciseId: string]: Array<{ reps: number; weight: number }> } = {};
        existingWorkout.exercises.forEach(sessionEx => {
          restoredSets[sessionEx.exerciseId] = sessionEx.sets;
        });
        setSets(restoredSets);
        
        // Find current exercise index (first incomplete exercise)
        let currentIndex = 0;
        for (let i = 0; i < templateData.exercises.length; i++) {
          const templateEx = templateData.exercises[i];
          const completedSets = restoredSets[templateEx.exerciseId]?.length || 0;
          if (completedSets < templateEx.targetSets) {
            currentIndex = i;
            break;
          }
          if (i === templateData.exercises.length - 1) {
            // All exercises completed, should auto-complete workout
            currentIndex = i;
          }
        }
        setCurrentExerciseIndex(currentIndex);
        
      } else if (templateId) {
        // Starting new workout
        const templateData = await db.getTemplateById(templateId);
        
        if (!templateData) {
          onClose();
          return;
        }

        setTemplate(templateData);
        
        // Initialize sets tracking for new workout
        const initialSets: { [exerciseId: string]: Array<{ reps: number; weight: number }> } = {};
        templateData.exercises.forEach(ex => {
          initialSets[ex.exerciseId] = [];
        });
        setSets(initialSets);
        const startTime = new Date();
        setWorkoutStartTime(startTime);
        setLastSetTime(startTime); // Initialize timeout tracking
        setIsWorkoutTimerActive(true); // Auto-start the workout timer
        
        // Create workout session in database (but not marked as in_progress yet)
        const sessionId = crypto.randomUUID();
        const workoutSession = {
          id: sessionId,
          templateId: templateId!,
          date: startTime,
          status: 'paused' as const, // Start as paused, mark in_progress when first set logged
          exercises: templateData.exercises.map(templateEx => ({
            exerciseId: templateEx.exerciseId,
            targetSets: templateEx.targetSets,
            completedSets: 0,
            sets: []
          })),
          duration: 0,
          totalVolume: 0
        };
        
        await db.createWorkout(workoutSession);
        setWorkoutSessionId(sessionId);
      }
      
      // Load exercise data for the current template
      const currentTemplate = template || await db.getTemplateById(workoutId ? (await db.getWorkoutById(workoutId))!.templateId : templateId!);
      if (currentTemplate) {
        const exerciseData = await Promise.all(
          currentTemplate.exercises.map(async (templateEx) => {
            return await db.getExerciseById(templateEx.exerciseId);
          })
        );
        setExercises(exerciseData.filter(Boolean) as Exercise[]);
      }
      
    } catch (error) {
      console.error('Failed to load workout data:', error);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleSetSubmit = async (reps: number, weight: number) => {
    if (!template || !exercises[currentExerciseIndex] || isProgressing || !workoutSessionId) return;
    
    const exerciseId = template.exercises[currentExerciseIndex].exerciseId;
    const newSet = { reps, weight };
    
    // Add the new set first
    const currentSets = sets[exerciseId] || [];
    const updatedSets = [...currentSets, newSet];
    const targetSets = template.exercises[currentExerciseIndex].targetSets;
    
    // Update sets state
    setSets(prev => ({
      ...prev,
      [exerciseId]: updatedSets
    }));
    
    // Save to database after each set
    try {
      const db = await getDB();
      const currentWorkout = await db.getWorkoutById(workoutSessionId);
      
      if (currentWorkout) {
        // Update the specific exercise's sets
        const updatedExercises = currentWorkout.exercises.map(ex => {
          if (ex.exerciseId === exerciseId) {
            return {
              ...ex,
              sets: updatedSets,
              completedSets: updatedSets.length
            };
          }
          return ex;
        });
        
        // Calculate total volume
        const totalVolume = updatedExercises.reduce((total, ex) => {
          return total + ex.sets.reduce((exTotal, set) => exTotal + (set.reps * set.weight), 0);
        }, 0);
        
        // Check if this is the first set ever logged (workout should be marked as in_progress)
        const totalSetsLogged = updatedExercises.reduce((total, ex) => total + ex.sets.length, 0);
        const shouldMarkInProgress = currentWorkout.status === 'paused' && totalSetsLogged === 1;
        
        // Update the workout in database
        await db.updateWorkout(workoutSessionId, {
          exercises: updatedExercises,
          duration: Math.floor((Date.now() - workoutStartTime!.getTime()) / 1000),
          totalVolume,
          ...(shouldMarkInProgress && { status: 'in_progress' as const })
        });
        
        if (shouldMarkInProgress) {
          console.log('Workout marked as in_progress after first set logged');
          setIsWorkoutTimerActive(true);
        }
        
        // Update total sets counter and check for batched sync
        setTotalSetsLogged(totalSetsLogged);
        setLastSetTime(new Date()); // Track when the last set was logged
        
        if (totalSetsLogged % 10 === 0 && totalSetsLogged > 0) {
          console.log(`Triggering batched sync after ${totalSetsLogged} sets`);
          syncWorkoutEvent('sets_batched');
        }
        
        console.log('Saved set to database:', { exerciseId, set: newSet, totalSets: updatedSets.length });
      }
    } catch (error) {
      console.error('Failed to save set:', error);
    }
    
    // Check if target sets completed after this set
    console.log(`Set submitted. Current sets: ${updatedSets.length}, Target sets: ${targetSets}, Exercise index: ${currentExerciseIndex}`);
    
    if (updatedSets.length >= targetSets && currentExerciseIndex < exercises.length - 1) {
      // Prevent multiple rapid progressions
      setIsProgressing(true);
      console.log(`Target sets completed! Auto-progressing from exercise ${currentExerciseIndex} to ${currentExerciseIndex + 1}`);
      
      // Auto-progress to next exercise
      setTimeout(() => {
        setCurrentExerciseIndex(prev => {
          const newIndex = prev + 1;
          console.log(`Actually progressing from ${prev} to ${newIndex}`);
          return newIndex;
        });
        setShowRestTimer(false); // Cancel rest timer when moving to next exercise
        setIsProgressing(false); // Reset progression flag
      }, 500); // Longer delay to prevent race conditions
    } else if (updatedSets.length >= targetSets && currentExerciseIndex === exercises.length - 1) {
      // Last exercise completed, auto-complete workout
      console.log('All exercises completed! Auto-completing workout...');
      setTimeout(async () => {
        await handleCompleteWorkout();
      }, 1000);
    } else {
      // Only start rest timer if we're not moving to next exercise
      const currentExercise = exercises[currentExerciseIndex];
      const restTimeToUse = template.exercises[currentExerciseIndex].restTime || currentExercise?.defaultRestTime || 60;
      
      // Start rest timer after UI updates
      setTimeout(() => {
        setRestTime(restTimeToUse);
        setShowRestTimer(true);
      }, 200);
    }
    
    // Check if ALL exercises have completed their target sets (alternative completion check)
    const allExercisesCompleted = template.exercises.every((templateEx, index) => {
      const exerciseSets = index === currentExerciseIndex ? updatedSets : (sets[templateEx.exerciseId] || []);
      return exerciseSets.length >= templateEx.targetSets;
    });
    
    if (allExercisesCompleted) {
      console.log('All target sets completed across all exercises! Auto-completing workout...');
      setTimeout(async () => {
        await handleCompleteWorkout();
      }, 1500);
    }
  };

  const handleNextExercise = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
      setShowRestTimer(false);
    }
  };

  const handlePreviousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(prev => prev - 1);
      setShowRestTimer(false);
    }
  };

  const handleCompleteWorkout = async () => {
    if (!workoutSessionId) return;
    
    try {
      const db = await getDB();
      
      // Calculate final total volume
      const totalVolume = Object.values(sets).reduce((total, exerciseSets) => {
        return total + exerciseSets.reduce((exTotal, set) => exTotal + (set.reps * set.weight), 0);
      }, 0);
      
      // Update workout status to completed
      await db.updateWorkout(workoutSessionId, {
        status: 'completed',
        duration: Math.floor((Date.now() - workoutStartTime!.getTime()) / 1000),
        totalVolume
      });
      
      // Clean up timer localStorage data
      const storageKey = `workout_timer_${workoutSessionId}`;
      localStorage.removeItem(storageKey);
      
      // Sync completed workout to cloud
      syncWorkoutEvent('workout_completed');
      
      console.log('Workout completed:', workoutSessionId);
      onClose();
      router.push('/history');
    } catch (error) {
      console.error('Failed to complete workout:', error);
    }
  };

  const handleEndWorkoutEarly = () => {
    setShowEndWorkoutConfirm(true);
  };

  const confirmEndWorkoutEarly = async () => {
    if (!workoutSessionId) return;
    
    try {
      const db = await getDB();
      
      // Calculate volume for completed sets only
      const totalVolume = Object.values(sets).reduce((total, exerciseSets) => {
        return total + exerciseSets.reduce((exTotal, set) => exTotal + (set.reps * set.weight), 0);
      }, 0);
      
      // Update workout status to ended_early
      await db.updateWorkout(workoutSessionId, {
        status: 'ended_early',
        duration: Math.floor((Date.now() - workoutStartTime!.getTime()) / 1000),
        totalVolume
      });
      
      // Clean up timer localStorage data
      const storageKey = `workout_timer_${workoutSessionId}`;
      localStorage.removeItem(storageKey);
      
      // Sync ended workout to cloud
      syncWorkoutEvent('workout_ended_early');
      
      console.log('Workout ended early:', workoutSessionId);
      onClose();
      router.push('/history');
    } catch (error) {
      console.error('Failed to end workout early:', error);
      alert('Failed to end workout. Please try again.');
    }
  };

  const handleTimerStart = () => {
    setIsWorkoutTimerActive(true);
  };

  const handleTimerPause = () => {
    setIsWorkoutTimerActive(false);
  };


  const handleRestComplete = () => {
    setShowRestTimer(false);
  };

  const handlePlateCalculator = (weight: number) => {
    setCurrentWeight(weight);
    setShowPlateCalculator(true);
  };

  const handleEditSet = (exerciseId: string, setIndex: number, currentSet: { reps: number; weight: number }) => {
    setEditingSet({ exerciseId, setIndex });
    setEditReps(currentSet.reps.toString());
    setEditWeight(currentSet.weight.toString());
  };

  const handleSaveEdit = async () => {
    if (!editingSet || !workoutSessionId) return;
    
    const newReps = parseInt(editReps);
    const newWeight = parseFloat(editWeight);
    
    if (isNaN(newReps) || isNaN(newWeight) || newReps <= 0) {
      alert('Please enter valid reps and weight values');
      return;
    }
    
    // Check weight validation based on exercise type
    const currentExercise = exercises[currentExerciseIndex];
    if (currentExercise && currentExercise.type !== 'bodyweight' && newWeight <= 0) {
      alert('Please enter a valid weight greater than 0');
      return;
    }
    
    try {
      const db = await getDB();
      const currentWorkout = await db.getWorkoutById(workoutSessionId);
      
      if (currentWorkout) {
        // Update the specific set
        const updatedExercises = currentWorkout.exercises.map(ex => {
          if (ex.exerciseId === editingSet.exerciseId) {
            const updatedSets = [...ex.sets];
            updatedSets[editingSet.setIndex] = { reps: newReps, weight: newWeight };
            return {
              ...ex,
              sets: updatedSets,
              completedSets: updatedSets.length
            };
          }
          return ex;
        });
        
        // Calculate total volume
        const totalVolume = updatedExercises.reduce((total, ex) => {
          return total + ex.sets.reduce((exTotal, set) => exTotal + (set.reps * set.weight), 0);
        }, 0);
        
        // Update the workout in database
        await db.updateWorkout(workoutSessionId, {
          exercises: updatedExercises,
          duration: Math.floor((Date.now() - workoutStartTime!.getTime()) / 1000),
          totalVolume
        });
        
        // Update local state
        const updatedLocalSets = { ...sets };
        updatedLocalSets[editingSet.exerciseId][editingSet.setIndex] = { reps: newReps, weight: newWeight };
        setSets(updatedLocalSets);
        
        console.log('Set updated successfully');
      }
    } catch (error) {
      console.error('Failed to update set:', error);
      alert('Failed to update set. Please try again.');
    }
    
    // Close edit mode
    setEditingSet(null);
    setEditReps('');
    setEditWeight('');
  };

  const handleDeleteSet = (exerciseId: string, setIndex: number) => {
    setSetToDelete({ exerciseId, setIndex });
    setShowDeleteSetConfirm(true);
  };

  const confirmDeleteSet = async () => {
    if (!workoutSessionId || !setToDelete) return;
    
    try {
      const db = await getDB();
      const currentWorkout = await db.getWorkoutById(workoutSessionId);
      
      if (currentWorkout) {
        // Remove the specific set
        const updatedExercises = currentWorkout.exercises.map(ex => {
          if (ex.exerciseId === setToDelete.exerciseId) {
            const updatedSets = ex.sets.filter((_, index) => index !== setToDelete.setIndex);
            return {
              ...ex,
              sets: updatedSets,
              completedSets: updatedSets.length
            };
          }
          return ex;
        });
        
        // Calculate total volume
        const totalVolume = updatedExercises.reduce((total, ex) => {
          return total + ex.sets.reduce((exTotal, set) => exTotal + (set.reps * set.weight), 0);
        }, 0);
        
        // Update the workout in database
        await db.updateWorkout(workoutSessionId, {
          exercises: updatedExercises,
          duration: Math.floor((Date.now() - workoutStartTime!.getTime()) / 1000),
          totalVolume
        });
        
        // Update local state
        const updatedLocalSets = { ...sets };
        updatedLocalSets[setToDelete.exerciseId] = updatedLocalSets[setToDelete.exerciseId].filter((_, index) => index !== setToDelete.setIndex);
        setSets(updatedLocalSets);
        
        console.log('Set deleted successfully');
      }
    } catch (error) {
      console.error('Failed to delete set:', error);
      alert('Failed to delete set. Please try again.');
    } finally {
      setSetToDelete(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingSet(null);
    setEditReps('');
    setEditWeight('');
  };

  if (!isOpen) return null;

  if (loading || !template || exercises.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center">
        <div className="bg-white rounded-lg p-8">
          <div className="text-center">
            <div className="spinner mb-4" />
            <p className="text-gray-600">Starting your workout...</p>
          </div>
        </div>
      </div>
    );
  }

  const currentExercise = exercises[currentExerciseIndex];
  const templateExercise = template.exercises[currentExerciseIndex];
  const currentSets = sets[templateExercise.exerciseId] || [];
  const muscleGroupInfo = MUSCLE_GROUPS[currentExercise.muscleGroup];
  const isLastExercise = currentExerciseIndex >= exercises.length - 1;
  const completedExercises = template.exercises.filter(ex => (sets[ex.exerciseId]?.length || 0) > 0).length;
  const progress = Math.round((completedExercises / template.exercises.length) * 100);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999]">
      <div className="bg-white h-full flex flex-col">
        {/* Header with Close Button */}
        <header className="bg-gradient-primary text-white p-4 safe-top relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h1 className="text-xl font-bold font-display">{template.name}</h1>
                <p className="text-white/90 text-sm">Workout in progress</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm text-white/80">Progress</div>
                  <div className="text-2xl font-bold">{progress}%</div>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
                >
                  <span className="text-white text-xl font-bold">×</span>
                </button>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-3 bg-white/20 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-white h-full transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -translate-y-4 translate-x-4"></div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 space-y-4 pb-4 overflow-y-auto">
          {/* Workout Timer */}
          <WorkoutTimer
            isActive={isWorkoutTimerActive}
            onStart={handleTimerStart}
            onPause={handleTimerPause}
            workoutId={workoutSessionId || undefined}
            startTime={workoutStartTime || undefined}
          />

          {/* Current Exercise */}
          <Card className="relative overflow-hidden border-l-4" style={{ borderLeftColor: muscleGroupInfo.color }}>
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold shadow-md"
                    style={{ backgroundColor: muscleGroupInfo.color }}
                  >
                    <MuscleGroupIcon 
                      name={muscleGroupInfo.icon as any} 
                      size={24} 
                      color="white"
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 font-display">{currentExercise.name}</h3>
                    <p className="text-sm" style={{ color: muscleGroupInfo.color }}>
                      Exercise {currentExerciseIndex + 1} of {exercises.length}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-600">Target</div>
                  <div className="font-bold text-gray-800">{templateExercise.targetSets} sets</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Set Input - Moved up for easier access */}
          <SetInputForm 
            onSubmit={handleSetSubmit} 
            previousSets={currentSets} 
            barWeight={currentExercise.barWeight || 45}
            exerciseId={templateExercise.exerciseId}
            exerciseType={currentExercise.type}
          />

          {/* Previous Sets */}
          {currentSets.length > 0 && (
            <Card>
              <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl p-4">
                <h4 className="font-bold text-gray-800 mb-3">Completed Sets:</h4>
                <div className="space-y-2">
                  {currentSets.map((set, index) => {
                    const isEditing = editingSet?.exerciseId === templateExercise.exerciseId && editingSet?.setIndex === index;
                    
                    if (isEditing) {
                      return (
                        <div key={index} className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-blue-800">Edit Set {index + 1}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Reps</label>
                              <input
                                type="number"
                                value={editReps}
                                onChange={(e) => setEditReps(e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                min="1"
                                max="100"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Weight (lbs)</label>
                              <input
                                type="number"
                                value={editWeight}
                                onChange={(e) => setEditWeight(e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                min="0"
                                step="2.5"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={handleSaveEdit}
                              className="flex-1 text-xs"
                            >
                              Save
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={handleCancelEdit}
                              className="flex-1 text-xs"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      );
                    }
                    
                    return (
                      <div key={index} className="flex items-center justify-between bg-white/80 rounded-xl p-3">
                        <span className="font-semibold text-gray-700">Set {index + 1}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{set.reps} reps</span>
                          <span className="text-sm font-medium">{set.weight} lbs</span>
                          
                          {/* Action Buttons */}
                          <div className="flex items-center gap-1">
                            {currentExercise.type === 'barbell' && (
                              <Button
                                variant="glass"
                                size="sm"
                                onClick={() => handlePlateCalculator(set.weight)}
                                className="text-xs"
                                title="Plate Calculator"
                              >
                                <ActionIcon name="calculator" size={12} />
                              </Button>
                            )}
                            <Button
                              variant="glass"
                              size="sm"
                              onClick={() => handleEditSet(templateExercise.exerciseId, index, set)}
                              className="text-xs"
                              title="Edit Set"
                            >
                              ✏️
                            </Button>
                            <Button
                              variant="glass"
                              size="sm"
                              onClick={() => handleDeleteSet(templateExercise.exerciseId, index)}
                              className="text-xs text-red-600"
                              title="Delete Set"
                            >
                              <ActionIcon name="delete" size={12} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          )}

          {/* Navigation and Actions */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handlePreviousExercise}
                variant="secondary"
                disabled={currentExerciseIndex === 0}
                className="w-full"
              >
                <ActionIcon name="previous" size={16} className="mr-1" />
                Previous
              </Button>
              <Button
                onClick={handleNextExercise}
                disabled={isLastExercise}
                className="w-full"
              >
                {isLastExercise ? (
                  <>
                    <ActionIcon name="finish" size={16} className="mr-1" />
                    Last Exercise
                  </>
                ) : (
                  <>
                    <ActionIcon name="next" size={16} className="mr-1" />
                    Next
                  </>
                )}
              </Button>
            </div>
            
            {/* End Workout Early - Compact */}
            <div className="flex justify-center">
              <Button
                onClick={handleEndWorkoutEarly}
                variant="secondary"
                size="sm"
                className="px-4"
              >
                <ActionIcon name="stop" size={14} className="mr-1" />
                End Early
              </Button>
            </div>
          </div>

          {/* Exercise Overview */}
          <Card>
            <h3 className="text-lg font-bold text-gray-800 mb-4 font-display">Exercise Overview</h3>
            <div className="space-y-3">
              {template.exercises.map((templateEx, index) => {
                const exercise = exercises[index];
                const exerciseSets = sets[templateEx.exerciseId] || [];
                const muscleInfo = MUSCLE_GROUPS[exercise?.muscleGroup || 'chest'];
                
                return (
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                      index === currentExerciseIndex
                        ? 'bg-blue-50 border-2 border-blue-200'
                        : exerciseSets.length > 0
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === currentExerciseIndex
                        ? 'bg-blue-600 text-white'
                        : exerciseSets.length > 0
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-400 text-white'
                    }`}>
                      {exerciseSets.length > 0 ? <ActionIcon name="finish" size={14} color="white" /> : index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{exercise?.name || 'Unknown Exercise'}</p>
                      <p className="text-sm text-gray-600">
                        {exerciseSets.length}/{templateEx.targetSets} sets
                      </p>
                    </div>
                    <div className="text-lg">
                      <MuscleGroupIcon 
                        name={muscleInfo.icon as any} 
                        size={18} 
                        color={muscleInfo.color}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </main>

        {/* Rest Timer Modal */}
        {showRestTimer && (
          <Modal isOpen={showRestTimer} onClose={handleRestComplete} title="Rest Timer" size="md">
            <RestTimer
              duration={restTime}
              onComplete={handleRestComplete}
              onCancel={handleRestComplete}
            />
          </Modal>
        )}

        {/* Plate Calculator Modal */}
        <Modal 
          isOpen={showPlateCalculator} 
          onClose={() => setShowPlateCalculator(false)} 
          title="Plate Calculator" 
          size="lg"
        >
          <PlateCalculator
            barWeight={currentExercise?.barWeight || 45}
            onClose={() => setShowPlateCalculator(false)}
          />
        </Modal>

        {/* End Workout Early Confirmation */}
        <ConfirmModal
          isOpen={showEndWorkoutConfirm}
          onClose={() => setShowEndWorkoutConfirm(false)}
          onConfirm={confirmEndWorkoutEarly}
          title="End Workout Early"
          message="Are you sure you want to end this workout early? This workout will be marked as ended and cannot be resumed."
          confirmText="End Workout"
          variant="warning"
        />

        {/* Delete Set Confirmation */}
        <ConfirmModal
          isOpen={showDeleteSetConfirm}
          onClose={() => setShowDeleteSetConfirm(false)}
          onConfirm={confirmDeleteSet}
          title="Delete Set"
          message="Are you sure you want to delete this set?"
          confirmText="Delete"
          variant="danger"
        />
      </div>
    </div>
  );
}