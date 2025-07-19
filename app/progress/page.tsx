'use client';

import { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import { WorkoutSession, Exercise } from '@/lib/types';
import { getDB } from '@/lib/storage/indexedDB';
import { formatDate, formatWeight, formatVolume, calculateVolume } from '@/lib/utils';
import StatsGrid from '../components/progress/StatsGrid';
import VolumeChart from '../components/progress/VolumeChart';
import StrengthChart from '../components/progress/StrengthChart';
import MuscleGroupChart from '../components/progress/MuscleGroupChart';
import WorkoutFrequencyChart from '../components/progress/WorkoutFrequencyChart';

export default function ProgressPage() {
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    loadProgressData();
  }, [timeRange]);

  const loadProgressData = async () => {
    try {
      const db = await getDB();
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      const workoutData = await db.getWorkouts(startDate, endDate);
      const exerciseData = await db.getExercises();
      
      setWorkouts(workoutData.filter(w => w.status === 'completed'));
      setExercises(exerciseData);
    } catch (error) {
      console.error('Failed to load progress data:', error);
    } finally {
      setLoading(false);
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
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-primary text-white p-6 safe-top relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold font-display">📊 Progress Analytics</h1>
          <p className="text-white/90 mt-2">Track your fitness journey</p>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-4 -translate-x-4"></div>
      </header>

      {/* Time Range Selector */}
      <div className="p-4">
        <div className="flex gap-2 bg-white/95 backdrop-blur-md rounded-3xl p-3 shadow-lg border border-white/20">
          {(['week', 'month', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`flex-1 py-3 px-4 rounded-2xl font-semibold transition-all duration-200 transform hover:scale-105 ${
                timeRange === range
                  ? 'bg-gradient-primary text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 space-y-6">
        {/* Stats Grid */}
        <StatsGrid workouts={workouts} exercises={exercises} />

        {/* Charts */}
        <div className="space-y-6">
          {/* Volume Chart */}
          <Card className="relative overflow-hidden transform hover:scale-[1.01] transition-all duration-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2 font-display">
              📈 Volume Trends
            </h2>
            <VolumeChart workouts={workouts} timeRange={timeRange} />
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-primary opacity-5 rounded-full -translate-y-4 translate-x-4"></div>
          </Card>

          {/* Strength Progress */}
          <Card className="relative overflow-hidden transform hover:scale-[1.01] transition-all duration-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2 font-display">
              💪 Strength Progress
            </h2>
            <StrengthChart workouts={workouts} exercises={exercises} />
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-secondary opacity-5 rounded-full -translate-y-4 translate-x-4"></div>
          </Card>

          {/* Muscle Group Distribution */}
          <Card className="relative overflow-hidden transform hover:scale-[1.01] transition-all duration-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2 font-display">
              🎯 Muscle Group Focus
            </h2>
            <MuscleGroupChart workouts={workouts} exercises={exercises} />
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-accent opacity-5 rounded-full -translate-y-4 translate-x-4"></div>
          </Card>

          {/* Workout Frequency */}
          <Card className="relative overflow-hidden transform hover:scale-[1.01] transition-all duration-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2 font-display">
              📅 Workout Frequency
            </h2>
            <WorkoutFrequencyChart workouts={workouts} timeRange={timeRange} />
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-success opacity-5 rounded-full -translate-y-4 translate-x-4"></div>
          </Card>
        </div>

        {/* Recent PRs */}
        <Card className="relative overflow-hidden transform hover:scale-[1.01] transition-all duration-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2 font-display">
            🏆 Recent Personal Records
          </h2>
          <div className="space-y-4">
            {workouts.slice(0, 5).map((workout, index) => (
              <div key={workout.id} className="bg-gradient-to-r from-yellow-50 via-orange-50 to-pink-50 border border-orange-200/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-[1.02]">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-warm rounded-2xl flex items-center justify-center text-white font-bold shadow-md">
                      #{index + 1}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-lg">
                        {formatDate(new Date(workout.date), 'MMM d, yyyy')}
                      </p>
                      <p className="text-sm text-gray-600 font-medium">
                        {workout.exercises.length} exercises completed
                      </p>
                    </div>
                  </div>
                  <div className="text-3xl">🎉</div>
                </div>
              </div>
            ))}
            {workouts.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <div className="text-8xl mb-4 opacity-50">🎯</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2 font-display">No workouts completed yet</h3>
                <p className="text-lg text-gray-600">Start tracking to see your progress!</p>
              </div>
            )}
          </div>
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-warm opacity-5 rounded-full -translate-y-4 translate-x-4"></div>
        </Card>
      </main>

    </div>
  );
}