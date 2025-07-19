'use client';

import { WorkoutSession } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatDate } from '@/lib/utils';

interface WorkoutFrequencyChartProps {
  workouts: WorkoutSession[];
  timeRange: 'week' | 'month' | 'year';
}

export default function WorkoutFrequencyChart({ workouts, timeRange }: WorkoutFrequencyChartProps) {
  const chartData = processFrequencyData(workouts, timeRange);

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">📅</div>
          <p>No frequency data available</p>
          <p className="text-sm mt-1">Complete some workouts to see your consistency!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="period" 
            tick={{ fontSize: 12 }}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            axisLine={{ stroke: '#e5e7eb' }}
            label={{ value: 'Workouts', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            formatter={(value: number) => [`${value} workouts`, 'Frequency']}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
          />
          <Bar 
            dataKey="count" 
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function processFrequencyData(workouts: WorkoutSession[], timeRange: 'week' | 'month' | 'year') {
  if (workouts.length === 0) return [];

  const frequencyData = new Map<string, number>();

  workouts.forEach(workout => {
    const date = new Date(workout.date);
    let key: string;

    switch (timeRange) {
      case 'week':
        // Group by day of week
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        key = days[date.getDay()];
        break;
      case 'month':
        // Group by week of month
        const weekOfMonth = Math.ceil(date.getDate() / 7);
        key = `Week ${weekOfMonth}`;
        break;
      case 'year':
        // Group by month
        key = formatDate(date, 'MMM');
        break;
    }

    frequencyData.set(key, (frequencyData.get(key) || 0) + 1);
  });

  // For week view, ensure all days are shown
  if (timeRange === 'week') {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.forEach(day => {
      if (!frequencyData.has(day)) {
        frequencyData.set(day, 0);
      }
    });
  }

  // Convert to array and sort appropriately
  const result = Array.from(frequencyData.entries())
    .map(([period, count]) => ({ period, count }));

  if (timeRange === 'week') {
    // Sort by day of week order
    const dayOrder = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    result.sort((a, b) => dayOrder.indexOf(a.period) - dayOrder.indexOf(b.period));
  } else {
    // Sort alphabetically/chronologically
    result.sort((a, b) => a.period.localeCompare(b.period));
  }

  return result;
}