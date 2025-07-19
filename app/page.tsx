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
      
      // Get today's template
      const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()];
      const template = await db.getTemplateByDay(dayOfWeek as any);
      setTodayTemplate(template);
      
      // Get recent workouts
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const workouts = await db.getWorkouts(oneWeekAgo, new Date());
      setRecentWorkouts(workouts.slice(0, 3));
      
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
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-primary text-white p-6 safe-top relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold font-display">🏋️ Gainz Tracker</h1>
              <p className="text-white/90 mt-2 text-lg">{greeting}! Ready to crush it?</p>
              <p className="text-white/70 text-sm mt-1">{formatDate(today, 'EEEE, MMM d')}</p>
            </div>
            
            {/* Sync Status */}
            {isAuthenticated && (
              <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1">
                <div className={`w-2 h-2 rounded-full ${
                  syncStatus === 'syncing' ? 'bg-yellow-400 animate-pulse' :
                  syncStatus === 'success' ? 'bg-green-400' :
                  syncStatus === 'error' ? 'bg-red-400' : 'bg-gray-400'
                }`} />
                <span className="text-xs text-white/80">
                  {syncStatus === 'syncing' ? 'Syncing...' : 
                   syncStatus === 'success' ? 'Synced' :
                   syncStatus === 'error' ? 'Sync Error' : 'Offline'}
                </span>
              </div>
            )}
          </div>
        </div>
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-4 -translate-x-4"></div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card variant="gradient" gradient="success" className="text-center transform hover:scale-105 transition-all duration-200">
            <div className="text-3xl font-bold mb-1">{stats.streak}</div>
            <div className="text-xs opacity-90 font-medium">Day Streak</div>
            <div className="text-2xl mt-2">🔥</div>
          </Card>
          
          <Card variant="gradient" gradient="secondary" className="text-center transform hover:scale-105 transition-all duration-200">
            <div className="text-xl font-bold mb-1">
              {stats.lastWorkout ? `${stats.lastWorkout.weight}` : 'N/A'}
            </div>
            <div className="text-xs opacity-90 font-medium">
              {stats.lastWorkout ? stats.lastWorkout.exercise : 'No workout'}
            </div>
            <div className="text-2xl mt-2">💪</div>
          </Card>
          
          <Card variant="gradient" gradient="accent" className="text-center transform hover:scale-105 transition-all duration-200">
            <div className="text-2xl font-bold mb-1">
              {(stats.weeklyVolume / 1000).toFixed(1)}k
            </div>
            <div className="text-xs opacity-90 font-medium">Weekly Volume</div>
            <div className="text-2xl mt-2">📊</div>
          </Card>
        </div>

        {/* Today's Workout */}
        {todayTemplate ? (
          <Card className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 font-display flex items-center gap-2">
                  💪 Today's Workout
                </h2>
                <p className="text-purple-600 font-semibold mt-1 text-lg">{todayTemplate.name}</p>
              </div>
              <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white text-3xl">🏋️</span>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl p-5 space-y-4">
              {todayTemplate.exercises.slice(0, 3).map((exercise, index) => (
                <div key={index} className="flex items-center gap-4 text-gray-700">
                  <div className="w-10 h-10 bg-gradient-accent rounded-full flex items-center justify-center text-white font-bold shadow-md">
                    {index + 1}
                  </div>
                  <span className="font-semibold text-gray-800">Exercise {index + 1}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-purple-600 font-bold">{exercise.targetSets} sets</span>
                </div>
              ))}
              {todayTemplate.exercises.length > 3 && (
                <div className="flex items-center gap-4 text-gray-500 pl-14">
                  <span className="text-sm font-medium">+{todayTemplate.exercises.length - 3} more exercises</span>
                </div>
              )}
            </div>
            
            <Button 
              onClick={startWorkout}
              className="w-full text-xl py-6 pulse"
              size="lg"
            >
              🚀 Start Workout
            </Button>
          </Card>
        ) : (
          <Card className="text-center space-y-6">
            <div className="text-6xl mb-4">😴</div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2 font-display">Rest Day</h3>
              <p className="text-gray-600 text-lg">No workout scheduled for today</p>
            </div>
            <Button 
              onClick={() => window.location.href = '/templates'}
              variant="secondary"
              size="lg"
            >
              📋 Create Template
            </Button>
          </Card>
        )}

        {/* Recent Activity */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2 font-display">
            📈 Recent Activity
          </h2>
          <div className="space-y-4">
            {recentWorkouts.length > 0 ? (
              recentWorkouts.map((workout) => (
                <Card 
                  key={workout.id} 
                  className="hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-lg">
                        <span className="text-white text-2xl">📅</span>
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 text-lg">
                          {formatDate(new Date(workout.date), 'EEEE')} Workout
                        </p>
                        <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                          <span className="font-medium">{workout.exercises.length} exercises</span>
                          <span>•</span>
                          <span className={workout.status === 'completed' ? 'text-green-600 font-semibold' : 'text-yellow-600 font-semibold'}>
                            {workout.status === 'completed' ? '✅ Completed' : '⏸️ In Progress'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-3xl">
                      {workout.status === 'completed' ? '🎉' : '⏸️'}
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="text-center space-y-4">
                <div className="text-6xl">🏃‍♂️</div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2 font-display">Ready to Get Started?</h3>
                  <p className="text-gray-600 text-lg">No recent workouts yet</p>
                  <p className="text-sm text-gray-500 mt-2">Start your first workout above!</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>

    </div>
  );
}