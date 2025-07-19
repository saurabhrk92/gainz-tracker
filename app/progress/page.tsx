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
    <div className="min-h-screen">
      {/* Header */}
      <div className="pt-12 pb-8">
        <h1 className="text-2xl font-bold text-black">Progress Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">Track your fitness journey</p>
      </div>

      {/* Time Range Selector */}
      <div className="mb-6">
        <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
          {(['week', 'month', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`flex-1 py-2 px-3 rounded-md font-medium transition-all duration-200 text-sm ${
                timeRange === range
                  ? 'bg-white text-black shadow-sm'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="space-y-6">
        {/* Stats Grid */}
        <StatsGrid workouts={workouts} exercises={exercises} />

        {/* Charts */}
        <div className="space-y-6">
          {/* Volume Chart */}
          <Card>
            <h2 className="text-lg font-bold text-black mb-4">Volume Trends</h2>
            <VolumeChart workouts={workouts} timeRange={timeRange} />
          </Card>

          {/* Strength Progress */}
          <Card>
            <h2 className="text-lg font-bold text-black mb-4">Strength Progress</h2>
            <StrengthChart workouts={workouts} exercises={exercises} />
          </Card>

          {/* Muscle Group Distribution */}
          <Card>
            <h2 className="text-lg font-bold text-black mb-4">Muscle Group Focus</h2>
            <MuscleGroupChart workouts={workouts} exercises={exercises} />
          </Card>

          {/* Workout Frequency */}
          <Card>
            <h2 className="text-lg font-bold text-black mb-4">Workout Frequency</h2>
            <WorkoutFrequencyChart workouts={workouts} timeRange={timeRange} />
          </Card>
        </div>

        {/* Recent PRs */}
        <Card>
          <h2 className="text-lg font-bold text-black mb-4">Recent Personal Records</h2>
          <div className="space-y-3">
            {workouts.slice(0, 5).map((workout, index) => (
              <div key={workout.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <span className="text-purple-600 font-bold text-sm">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-black">
                        {formatDate(new Date(workout.date), 'MMM d, yyyy')}
                      </p>
                      <p className="text-sm text-gray-600">
                        {workout.exercises.length} exercises completed
                      </p>
                    </div>
                  </div>
                  <div className="text-2xl">🎉</div>
                </div>
              </div>
            ))}
            {workouts.length === 0 && (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-lg font-bold text-black mb-2">No workouts completed yet</h3>
                <p className="text-gray-600 text-sm">Start tracking to see your progress!</p>
              </div>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}