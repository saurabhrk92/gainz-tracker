'use client';

import { useState, useEffect } from 'react';
import Card from './components/ui/Card';
import Button from './components/ui/Button';
import Modal from './components/ui/Modal';
import WorkoutModal from './components/workout/WorkoutModal';
import WorkoutDetailsModal from './components/workout/WorkoutDetailsModal';
import { formatDate } from '@/lib/utils';
import { WorkoutTemplate, WorkoutSession } from '@/lib/types';
import { getDB } from '@/lib/storage/indexedDB';
import { seedSampleData } from '@/lib/seed-data';
import { useSync } from '@/lib/hooks/useSync';
import { useAuth } from '@/lib/auth/useAuth';
import { MUSCLE_GROUPS } from '@/lib/constants';
import { MuscleGroupIcon, ActionIcon, UIIcon } from './components/ui/Icon';

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const { syncStatus, lastSyncTime } = useSync();
  const [todayTemplate, setTodayTemplate] = useState<WorkoutTemplate | null>(null);
  const [todayExercises, setTodayExercises] = useState<Array<{id: string; name: string; muscleGroup: string}>>([]);
  const [activeWorkout, setActiveWorkout] = useState<WorkoutSession | null>(null);
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutSession[]>([]);
  const [stats, setStats] = useState({
    lastPR: null as { exercise: string; weight: number; date: Date } | null,
    weeklyVolume: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [workoutModalProps, setWorkoutModalProps] = useState<{ templateId?: string; workoutId?: string }>({});
  const [routineTemplates, setRoutineTemplates] = useState<WorkoutTemplate[]>([]);
  const [showRoutineSelector, setShowRoutineSelector] = useState(false);
  const [showWorkoutDetails, setShowWorkoutDetails] = useState(false);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);

  useEffect(() => {
    // Seed sample data on first load
    seedSampleData().then(() => {
      loadHomeData();
    });
  }, []);

  const calculateStats = async (db: any, workouts: WorkoutSession[]) => {
    try {
      // Calculate weekly volume (lbs * reps)
      const weeklyVolume = workouts.reduce((total, workout) => {
        return total + workout.exercises.reduce((workoutTotal, exercise) => {
          return workoutTotal + exercise.sets.reduce((exerciseTotal, set) => {
            return exerciseTotal + (set.weight * set.reps);
          }, 0);
        }, 0);
      }, 0);

      // Find the last PR (highest weight for any exercise)
      let lastPR: { exercise: string; weight: number; date: Date } | null = null;
      
      // Get all workouts from the last 30 days to find recent PRs
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentWorkouts = await db.getWorkouts(thirtyDaysAgo, new Date());
      
      for (const workout of recentWorkouts) {
        for (const workoutExercise of workout.exercises) {
          const exercise = await db.getExerciseById(workoutExercise.exerciseId);
          if (!exercise) continue;
          
          for (const set of workoutExercise.sets) {
            if (!lastPR || set.weight > lastPR.weight) {
              lastPR = {
                exercise: exercise.name,
                weight: set.weight,
                date: new Date(workout.date)
              };
            }
          }
        }
      }

      setStats({
        lastPR,
        weeklyVolume
      });
    } catch (error) {
      console.error('Failed to calculate stats:', error);
      setStats({
        lastPR: null,
        weeklyVolume: 0
      });
    }
  };

  const loadHomeData = async () => {
    try {
      const db = await getDB();
      
      // Check for active workout first
      const currentWorkout = await db.getActiveWorkout();
      
      // If there's an active workout, verify it's from today and template still exists
      if (currentWorkout) {
        const workoutDate = new Date(currentWorkout.date);
        const today = new Date();
        const isToday = workoutDate.toDateString() === today.toDateString();
        
        if (!isToday) {
          // Workout is from a previous day, mark as ended_early
          console.log('Workout from previous day found, marking as ended_early');
          await db.updateWorkout(currentWorkout.id, {
            status: 'ended_early',
            duration: Math.floor((Date.now() - workoutDate.getTime()) / 1000)
          });
          setActiveWorkout(null);
        } else {
          // Workout is from today, verify template still exists
          try {
            const template = await db.getTemplateById(currentWorkout.templateId);
            if (template) {
              setActiveWorkout(currentWorkout);
            } else {
              // Template was deleted, remove the orphaned workout
              console.log('Template deleted, removing orphaned workout');
              await db.deleteWorkout(currentWorkout.id);
              setActiveWorkout(null);
            }
          } catch (error) {
            // Template not found, clean up the workout
            console.log('Template not found, cleaning up workout');
            await db.deleteWorkout(currentWorkout.id);
            setActiveWorkout(null);
          }
        }
      }
      
      // Get today's template
      const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()];
      const template = await db.getTemplateByDay(dayOfWeek as any);
      setTodayTemplate(template);
      
      // If template exists, fetch the actual exercise names
      if (template && template.exercises.length > 0) {
        const exerciseDetails = await Promise.all(
          template.exercises.map(async (templateEx) => {
            const exercise = await db.getExerciseById(templateEx.exerciseId);
            return {
              id: templateEx.exerciseId,
              name: exercise?.name || 'Unknown Exercise',
              muscleGroup: exercise?.muscleGroup || 'chest'
            };
          })
        );
        setTodayExercises(exerciseDetails);
      } else {
        setTodayExercises([]);
      }
      
      // Get recent workouts (include in-progress workouts)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const workouts = await db.getWorkouts(oneWeekAgo, new Date());
      // Sort by date, newest first, and show in-progress workouts at the top
      const sortedWorkouts = workouts.sort((a, b) => {
        // Prioritize in-progress workouts
        if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
        if (b.status === 'in_progress' && a.status !== 'in_progress') return 1;
        // Then sort by date
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      setRecentWorkouts(sortedWorkouts.slice(0, 3));
      
      // Load routine templates for routine selector
      const allTemplates = await db.getTemplates();
      const routines = allTemplates.filter(t => t.day === 'routine');
      setRoutineTemplates(routines);
      
      // Calculate real stats from workout data
      await calculateStats(db, workouts);
    } catch (error) {
      console.error('Failed to load home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startWorkout = () => {
    if (todayTemplate) {
      setWorkoutModalProps({ templateId: todayTemplate.id });
      setShowWorkoutModal(true);
    }
  };

  const resumeWorkout = () => {
    if (activeWorkout) {
      setWorkoutModalProps({ workoutId: activeWorkout.id });
      setShowWorkoutModal(true);
    }
  };

  const handleWorkoutModalClose = () => {
    setShowWorkoutModal(false);
    setWorkoutModalProps({});
    // Refresh the home data to update active workout status
    loadHomeData();
  };

  const openRoutineSelector = () => {
    setShowRoutineSelector(true);
  };

  const startRoutineWorkout = (templateId: string) => {
    setShowRoutineSelector(false);
    setWorkoutModalProps({ templateId });
    setShowWorkoutModal(true);
  };

  const openWorkoutDetails = (workoutId: string) => {
    setSelectedWorkoutId(workoutId);
    setShowWorkoutDetails(true);
  };

  const closeWorkoutDetails = () => {
    setShowWorkoutDetails(false);
    setSelectedWorkoutId(null);
  };

  const today = new Date();
  const greeting = getGreeting();

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="pt-12 pb-8">
        <div className="flex justify-between items-start mb-1">
          <div>
            <h1 className="text-2xl font-bold text-black">Gainz Tracker</h1>
            <p className="text-gray-500 text-sm mt-1">{greeting}, ready to train?</p>
          </div>
          
          {/* Sync Status */}
          {isAuthenticated && (
            <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1">
              <div className={`w-2 h-2 rounded-full ${
                syncStatus === 'syncing' ? 'bg-yellow-400 animate-pulse' :
                syncStatus === 'success' ? 'bg-green-400' :
                syncStatus === 'error' ? 'bg-red-400' : 'bg-gray-400'
              }`} />
              <span className="text-xs text-gray-600 font-medium">
                {syncStatus === 'syncing' ? 'Syncing...' : 
                 syncStatus === 'success' ? 'Synced' :
                 syncStatus === 'error' ? 'Sync Error' : 'Offline'}
              </span>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-400 font-medium">{formatDate(today, 'EEEE, MMMM d')}</p>
      </div>

      {/* Main Content */}
      <main className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card variant="gradient" gradient="secondary" className="text-center">
            <div className="text-xs opacity-75 font-medium mb-1">Weekly PR</div>
            <div className="text-xl font-bold">
              {stats.lastPR ? `${stats.lastPR.weight} lbs` : 'No PR'}
            </div>
            <div className="text-xs opacity-90 font-medium mt-1">
              {stats.lastPR ? stats.lastPR.exercise : 'Set a PR!'}
            </div>
            {stats.lastPR && (
              <div className="text-xs opacity-75 mt-0.5">
                {formatDate(stats.lastPR.date, 'MMM d')}
              </div>
            )}
          </Card>
          
          <Card variant="gradient" gradient="accent" className="text-center">
            <div className="text-xl font-bold text-gray-900">
              {stats.weeklyVolume >= 1000 
                ? `${(stats.weeklyVolume / 1000).toFixed(1)}k` 
                : stats.weeklyVolume.toLocaleString()
              }
            </div>
            <div className="text-xs text-gray-600 font-medium mt-1">Weekly Volume</div>
            <div className="text-xs text-gray-500 mt-0.5">lbs × reps</div>
          </Card>
        </div>

        {/* Today's Workout */}
        {activeWorkout ? (
          <Card className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-bold text-black">Resume Workout</h2>
                <p className="text-orange-600 font-semibold mt-1">Workout in Progress</p>
              </div>
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <ActionIcon name="pause" size={18} color="white" />
              </div>
            </div>
            
            <div className="bg-orange-50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-orange-700">Progress</span>
                <span className="text-sm text-orange-600">
                  {activeWorkout.exercises.reduce((total, ex) => total + ex.sets.length, 0)} sets completed
                </span>
              </div>
              <div className="w-full bg-orange-200 rounded-full h-2">
                <div 
                  className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.min(100, (activeWorkout.exercises.reduce((total, ex) => total + ex.sets.length, 0) / activeWorkout.exercises.reduce((total, ex) => total + ex.targetSets, 0)) * 100)}%` 
                  }}
                />
              </div>
            </div>
            
            <Button 
              onClick={resumeWorkout}
              className="w-full"
              size="lg"
            >
              Resume Workout
            </Button>
          </Card>
        ) : todayTemplate ? (
          <Card className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-bold text-black">Today's Workout</h2>
                <p className="text-purple-600 font-semibold mt-1">{todayTemplate.name}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <UIIcon name="workout" size={18} color="white" />
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              {todayExercises.slice(0, 3).map((exercise, index) => {
                const templateEx = todayTemplate.exercises[index];
                const muscleGroupInfo = MUSCLE_GROUPS[exercise.muscleGroup as keyof typeof MUSCLE_GROUPS] || MUSCLE_GROUPS.chest;
                
                return (
                  <div key={exercise.id} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs">
                      <MuscleGroupIcon 
                        name={muscleGroupInfo.icon as any} 
                        size={16} 
                        color={muscleGroupInfo.color}
                      />
                    </div>
                    <span className="font-medium text-gray-900 text-sm flex-1">{exercise.name}</span>
                    <span className="text-purple-600 font-semibold text-sm">{templateEx.targetSets} sets</span>
                  </div>
                );
              })}
              {todayTemplate.exercises.length > 3 && (
                <div className="flex items-center gap-3 text-gray-500 pl-9">
                  <span className="text-xs font-medium">+{todayTemplate.exercises.length - 3} more exercises</span>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={startWorkout}
                className="w-full"
                size="lg"
              >
                Start Workout
              </Button>
              {routineTemplates.length > 0 && (
                <Button 
                  onClick={openRoutineSelector}
                  variant="secondary"
                  className="w-full"
                  size="lg"
                >
                  Run Different Routine
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <Card className="text-center py-8">
            <div className="mb-4">
              <UIIcon name="workout" size={48} color="#9CA3AF" />
            </div>
            <h3 className="text-lg font-bold text-black mb-2">Rest Day</h3>
            <p className="text-gray-600 text-sm mb-4">No workout scheduled for today</p>
            {routineTemplates.length > 0 ? (
              <Button 
                onClick={openRoutineSelector}
                size="md"
              >
                Run Routine Workout
              </Button>
            ) : (
              <Button 
                onClick={() => window.location.href = '/templates'}
                variant="secondary"
                size="md"
              >
                Create Template
              </Button>
            )}
          </Card>
        )}

        {/* Recent Activity */}
        <div>
          <h2 className="text-lg font-bold text-black mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {recentWorkouts.length > 0 ? (
              recentWorkouts.map((workout) => (
                <Card 
                  key={workout.id}
                  className="cursor-pointer hover:bg-gray-50 transition-colors duration-150"
                  onClick={() => {
                    if (workout.status === 'in_progress') {
                      // Resume the in-progress workout
                      setWorkoutModalProps({ workoutId: workout.id });
                      setShowWorkoutModal(true);
                    } else {
                      // View completed workout details
                      openWorkoutDetails(workout.id);
                    }
                  }}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <UIIcon name="calendar" size={18} color="#6B7280" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {formatDate(new Date(workout.date), 'EEEE')} Workout
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                          <span>{workout.exercises.length} exercises</span>
                          <span>•</span>
                          <span className={
                            workout.status === 'completed' ? 'text-green-600' : 
                            workout.status === 'ended_early' ? 'text-orange-600' : 'text-yellow-600'
                          }>
                            {workout.status === 'completed' ? 'Completed' : 
                             workout.status === 'ended_early' ? 'Ended Early' : 'In Progress'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-2xl">
                      {workout.status === 'completed' ? <UIIcon name="checkmark" size={24} color="#10B981" /> : 
                       workout.status === 'ended_early' ? <ActionIcon name="stop" size={24} color="#F59E0B" /> : 
                       <ActionIcon name="pause" size={24} color="#EF4444" />}
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="text-center py-6">
                <div className="mb-3">
                  <UIIcon name="workout" size={48} color="#6B7280" />
                </div>
                <h3 className="text-lg font-bold text-black mb-2">Ready to Get Started?</h3>
                <p className="text-gray-600 text-sm">No recent workouts yet</p>
              </Card>
            )}
            
            {/* View All History Button */}
            {recentWorkouts.length > 0 && (
              <div className="pt-3">
                <Button
                  variant="glass"
                  onClick={() => window.location.href = '/history'}
                  className="w-full"
                  size="sm"
                >
                  View All History
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Workout Modal */}
      <WorkoutModal
        isOpen={showWorkoutModal}
        onClose={handleWorkoutModalClose}
        templateId={workoutModalProps.templateId}
        workoutId={workoutModalProps.workoutId}
      />

      {/* Routine Selector Modal */}
      <Modal 
        isOpen={showRoutineSelector} 
        onClose={() => setShowRoutineSelector(false)} 
        title="Select Routine Workout"
      >
        <div className="space-y-4">
          <p className="text-gray-600 text-sm">
            Choose a routine workout to start today:
          </p>
          
          <div className="space-y-3">
            {routineTemplates.map((template) => (
              <div
                key={template.id}
                onClick={() => startRoutineWorkout(template.id)}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">{template.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {template.exercises.length} exercises
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-primary flex items-center justify-center">
                      <UIIcon name="workout" size={14} color="white" />
                    </div>
                  </div>
                </div>
                
                {template.exercises.length > 0 && (
                  <div className="mt-3 text-xs text-gray-500">
                    {template.exercises.slice(0, 3).map((ex, idx) => (
                      <span key={idx}>
                        {idx > 0 && ' • '}
                        {ex.targetSets} sets
                      </span>
                    ))}
                    {template.exercises.length > 3 && ` • +${template.exercises.length - 3} more`}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {routineTemplates.length === 0 && (
            <div className="text-center py-8">
              <UIIcon name="workout" size={48} color="#9CA3AF" />
              <h3 className="text-lg font-bold text-black mb-2 mt-4">No Routine Workouts</h3>
              <p className="text-gray-600 text-sm mb-4">
                Create a routine workout template to use any day
              </p>
              <Button 
                onClick={() => {
                  setShowRoutineSelector(false);
                  window.location.href = '/templates';
                }}
                variant="secondary"
                size="sm"
              >
                Create Routine Template
              </Button>
            </div>
          )}
          
          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => setShowRoutineSelector(false)}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Workout Details Modal */}
      <WorkoutDetailsModal
        isOpen={showWorkoutDetails}
        onClose={closeWorkoutDetails}
        workoutId={selectedWorkoutId}
      />
    </div>
  );
}