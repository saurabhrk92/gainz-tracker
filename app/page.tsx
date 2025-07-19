'use client';

import { useState, useEffect } from 'react';
import Card from './components/ui/Card';
import Button from './components/ui/Button';
import { formatDate } from '@/lib/utils';
import { WorkoutTemplate, WorkoutSession } from '@/lib/types';
import { getDB } from '@/lib/storage/indexedDB';
import { seedSampleData } from '@/lib/seed-data';
import { useSync } from '@/lib/hooks/useSync';
import { useAuth } from '@/lib/auth/useAuth';

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const { syncStatus, lastSyncTime } = useSync();
  const [todayTemplate, setTodayTemplate] = useState<WorkoutTemplate | null>(null);
  const [activeWorkout, setActiveWorkout] = useState<WorkoutSession | null>(null);
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutSession[]>([]);
  const [stats, setStats] = useState({
    streak: 0,
    lastWorkout: null as { exercise: string; weight: number } | null,
    weeklyVolume: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Seed sample data on first load
    seedSampleData().then(() => {
      loadHomeData();
    });
  }, []);

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
      
      // Get recent workouts (exclude active workout from recent list)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const workouts = await db.getWorkouts(oneWeekAgo, new Date());
      const filteredWorkouts = workouts.filter(w => w.status !== 'in_progress');
      setRecentWorkouts(filteredWorkouts.slice(0, 3));
      
      // Calculate stats
      // This is simplified - you'd calculate real stats from workout data
      setStats({
        streak: 7,
        lastWorkout: { exercise: 'Bench Press', weight: 185 },
        weeklyVolume: 12500,
      });
    } catch (error) {
      console.error('Failed to load home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startWorkout = () => {
    if (todayTemplate) {
      window.location.href = `/workout?templateId=${todayTemplate.id}`;
    }
  };

  const resumeWorkout = () => {
    if (activeWorkout) {
      window.location.href = `/workout?workoutId=${activeWorkout.id}`;
    }
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
        <div className="grid grid-cols-3 gap-3">
          <Card variant="gradient" gradient="primary" className="text-center">
            <div className="text-xl font-bold">{stats.streak}</div>
            <div className="text-xs opacity-90 font-medium mt-1">Day Streak</div>
          </Card>
          
          <Card variant="gradient" gradient="secondary" className="text-center">
            <div className="text-xl font-bold">
              {stats.lastWorkout ? `${stats.lastWorkout.weight}` : 'N/A'}
            </div>
            <div className="text-xs opacity-90 font-medium mt-1">
              {stats.lastWorkout ? 'Last PR' : 'No PR'}
            </div>
          </Card>
          
          <Card variant="gradient" gradient="accent" className="text-center">
            <div className="text-xl font-bold text-gray-900">
              {(stats.weeklyVolume / 1000).toFixed(1)}k
            </div>
            <div className="text-xs text-gray-600 font-medium mt-1">Weekly Volume</div>
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
                <span className="text-white text-lg">⏸️</span>
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
                <span className="text-white text-lg">💪</span>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              {todayTemplate.exercises.slice(0, 3).map((exercise, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-bold text-xs">{index + 1}</span>
                  </div>
                  <span className="font-medium text-gray-900 text-sm flex-1">Exercise {index + 1}</span>
                  <span className="text-purple-600 font-semibold text-sm">{exercise.targetSets} sets</span>
                </div>
              ))}
              {todayTemplate.exercises.length > 3 && (
                <div className="flex items-center gap-3 text-gray-500 pl-9">
                  <span className="text-xs font-medium">+{todayTemplate.exercises.length - 3} more exercises</span>
                </div>
              )}
            </div>
            
            <Button 
              onClick={startWorkout}
              className="w-full"
              size="lg"
            >
              Start Workout
            </Button>
          </Card>
        ) : (
          <Card className="text-center py-8">
            <div className="text-4xl mb-4">🏃‍♂️</div>
            <h3 className="text-lg font-bold text-black mb-2">Rest Day</h3>
            <p className="text-gray-600 text-sm mb-4">No workout scheduled for today</p>
            <Button 
              onClick={() => window.location.href = '/templates'}
              variant="secondary"
              size="md"
            >
              Create Template
            </Button>
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
                  onClick={() => window.location.href = `/history/${workout.id}`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-gray-600 text-lg">📅</span>
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
                      {workout.status === 'completed' ? '✅' : 
                       workout.status === 'ended_early' ? '⏹️' : '⏸️'}
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="text-center py-6">
                <div className="text-4xl mb-3">🏋️‍♂️</div>
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
    </div>
  );
}