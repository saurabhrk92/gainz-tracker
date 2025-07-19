'use client';

import { WorkoutSession } from '@/lib/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { calculateVolume, formatDate } from '@/lib/utils';

interface VolumeChartProps {
  workouts: WorkoutSession[];
  timeRange: 'week' | 'month' | 'year';
}

export default function VolumeChart({ workouts, timeRange }: VolumeChartProps) {
  const chartData = processVolumeData(workouts, timeRange);

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <p>No volume data available</p>
          <p className="text-sm mt-1">Complete some workouts to see your progress!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip 
            labelFormatter={(label) => `Date: ${label}`}
            formatter={(value: number) => [`${value.toLocaleString()} lbs`, 'Volume']}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
          />
          <Line 
            type="monotone" 
            dataKey="volume"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function processVolumeData(workouts: WorkoutSession[], timeRange: 'week' | 'month' | 'year') {
  if (workouts.length === 0) return [];

  // Group workouts by time period
  const groupedData = new Map<string, number>();

  workouts.forEach(workout => {
    const date = new Date(workout.date);
    let key: string;

    switch (timeRange) {
      case 'week':
        // Group by day
        key = formatDate(date, 'MMM dd');
        break;
      case 'month':
        // Group by week
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = formatDate(weekStart, 'MMM dd');
        break;
      case 'year':
        // Group by month
        key = formatDate(date, 'MMM yyyy');
        break;
    }

    const workoutVolume = workout.exercises.reduce((total, exercise) => {
      return total + calculateVolume(exercise.sets);
    }, 0);

    groupedData.set(key, (groupedData.get(key) || 0) + workoutVolume);
  });

  // Convert to array and sort by date
  return Array.from(groupedData.entries())
    .map(([date, volume]) => ({ date, volume }))
    .sort((a, b) => {
      // Simple date comparison for display purposes
      return a.date.localeCompare(b.date);
    });
}