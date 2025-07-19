'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useWorkout } from '@/lib/hooks/useWorkout';
import { Exercise, WorkoutTemplate } from '@/lib/types';
import { getDB } from '@/lib/storage/indexedDB';
import { formatTime } from '@/lib/utils';
import { MUSCLE_GROUPS } from '@/lib/constants';
import RestTimer from '../components/workout/RestTimer';
import WorkoutTimer from '../components/workout/WorkoutTimer';
import PlateCalculator from '../components/workout/PlateCalculator';
import SetInputForm from '../components/workout/SetInputForm';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import { MuscleGroupIcon } from '../components/ui/Icon';

function WorkoutPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get('templateId');
  const workoutId = searchParams.get('workoutId');
  
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

  useEffect(() => {
    loadWorkoutData();
  }, [templateId, workoutId]);

  const loadWorkoutData = async () => {
    if (!templateId && !workoutId) {
      router.push('/');
      return;
    }

    try {
      const db = await getDB();
      
      if (workoutId) {
        // Resuming existing workout
        const existingWorkout = await db.getWorkoutById(workoutId);
        if (!existingWorkout) {
          router.push('/');
          return;
        }
        
        // Load template for the workout
        const templateData = await db.getTemplateById(existingWorkout.templateId);
        if (!templateData) {
          router.push('/');
          return;
        }
        
        setTemplate(templateData);
        setWorkoutSessionId(workoutId);
        setWorkoutStartTime(new Date(existingWorkout.date));
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
          router.push('/');
          return;
        }

        setTemplate(templateData);
        
        // Initialize sets tracking for new workout
        const initialSets: { [exerciseId: string]: Array<{ reps: number; weight: number }> } = {};
        templateData.exercises.forEach(ex => {
          initialSets[ex.exerciseId] = [];
        });
        setSets(initialSets);
        setWorkoutStartTime(new Date());
        
        // Create workout session in database (but not marked as in_progress yet)
        const sessionId = crypto.randomUUID();
        const workoutSession = {
          id: sessionId,
          templateId: templateId!,
          date: new Date(),
          status: 'paused' as const, // Start as paused, mark in_progress when first set logged
          exercises: templateData.exercises.map(templateEx => ({
            exerciseId: templateEx.exerciseId,
            targetSets: templateEx.targetSets,
            targetReps: templateEx.targetReps,
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
      router.push('/');
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
      
      console.log('Workout completed:', workoutSessionId);
      router.push('/history');
    } catch (error) {
      console.error('Failed to complete workout:', error);
    }
  };

  const handleEndWorkoutEarly = async () => {
    if (!workoutSessionId) return;

    // Show confirmation dialog
    const confirmed = confirm(
      'Are you sure you want to end this workout early? This workout will be marked as ended and cannot be resumed.'
    );
    
    if (!confirmed) return;
    
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
      
      console.log('Workout ended early:', workoutSessionId);
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

  const handleTimerReset = () => {
    setWorkoutStartTime(new Date());
  };

  const handleRestComplete = () => {
    setShowRestTimer(false);
  };

  const handlePlateCalculator = (weight: number) => {
    setCurrentWeight(weight);
    setShowPlateCalculator(true);
  };

  if (loading || !template || exercises.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="spinner mb-4" />
          <p className="text-gray-600">Starting your workout...</p>
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
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-primary text-white p-4 safe-top relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold font-display">{template.name}</h1>
              <p className="text-white/90 text-sm">Workout in progress</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-white/80">Progress</div>
              <div className="text-2xl font-bold">{progress}%</div>
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
      <main className="flex-1 p-4 space-y-4 pb-20">
        {/* Workout Timer */}
        <WorkoutTimer
          isActive={isWorkoutTimerActive}
          onStart={handleTimerStart}
          onPause={handleTimerPause}
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
                  <MuscleGroupIcon name={muscleGroupInfo.icon as any} size={20} color="white" />
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
                <div className="text-xs text-gray-600">{templateExercise.targetReps} reps</div>
              </div>
            </div>

            {/* Previous Sets */}
            {currentSets.length > 0 && (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl p-4">
                <h4 className="font-bold text-gray-800 mb-3">Completed Sets:</h4>
                <div className="space-y-2">
                  {currentSets.map((set, index) => (
                    <div key={index} className="flex items-center justify-between bg-white/80 rounded-xl p-3">
                      <span className="font-semibold text-gray-700">Set {index + 1}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium">{set.reps} reps</span>
                        <span className="text-sm font-medium">{set.weight} lbs</span>
                        {currentExercise.type === 'barbell' && (
                          <Button
                            variant="glass"
                            size="sm"
                            onClick={() => handlePlateCalculator(set.weight)}
                            className="text-xs"
                          >
                            🧮
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Set Input */}
        <SetInputForm 
          onSubmit={handleSetSubmit} 
          previousSets={currentSets} 
          barWeight={currentExercise.barWeight || 45}
          exerciseId={templateExercise.exerciseId}
          exerciseType={currentExercise.type}
        />

        {/* Navigation */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={handlePreviousExercise}
            variant="secondary"
            disabled={currentExerciseIndex === 0}
            className="w-full"
          >
            ⬅️ Previous
          </Button>
          <Button
            onClick={handleNextExercise}
            disabled={isLastExercise}
            className="w-full"
          >
            {isLastExercise ? '🏁 Last Exercise' : '➡️ Next'}
          </Button>
        </div>

        {/* Workout Actions */}
        {currentSets.length > 0 && (
          <Button
            onClick={handleEndWorkoutEarly}
            variant="secondary"
            className="w-full"
            size="sm"
          >
            ⏹️ End Workout Early
          </Button>
        )}

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
                    {exerciseSets.length > 0 ? '✓' : index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{exercise?.name || 'Unknown Exercise'}</p>
                    <p className="text-sm text-gray-600">
                      {exerciseSets.length}/{templateEx.targetSets} sets • {templateEx.targetReps} reps
                    </p>
                  </div>
                  <div className="text-lg">
                    <MuscleGroupIcon name={muscleInfo.icon as any} size={18} />
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
    </div>
  );
}

export default function WorkoutPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-gray-50"><div className="spinner" /></div>}>
      <WorkoutPageContent />
    </Suspense>
  );
}