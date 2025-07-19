'use client';

import { WorkoutSession, Exercise } from '@/lib/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatDate } from '@/lib/utils';
import { UIIcon } from '../ui/Icon';

interface StrengthChartProps {
  workouts: WorkoutSession[];
  exercises: Exercise[];
}

export default function StrengthChart({ workouts, exercises }: StrengthChartProps) {
  const chartData = processStrengthData(workouts, exercises);

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <UIIcon name="progress" size={48} color="#9CA3AF" className="mb-2" />
          <p>No strength data available</p>
          <p className="text-sm mt-1">Complete some workouts to track your progress!</p>
        </div>
      </div>
    );
  }

  // Get the top exercises to show
  const topExercises = getTopExercises(workouts, exercises).slice(0, 3);

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
            label={{ value: 'Weight (lbs)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            labelFormatter={(label) => `Date: ${label}`}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
          />
          <Legend />
          {topExercises.map((exercise, index) => {
            const colors = ['#3b82f6', '#10b981', '#f59e0b'];
            return (
              <Line
                key={exercise.id}
                type="monotone"
                dataKey={exercise.name}
                stroke={colors[index]}
                strokeWidth={2}
                dot={{ fill: colors[index], strokeWidth: 2, r: 3 }}
                connectNulls={false}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function processStrengthData(workouts: WorkoutSession[], exercises: Exercise[]) {
  if (workouts.length === 0) return [];

  // Create a map to track max weight for each exercise over time
  const strengthProgress = new Map<string, Map<string, number>>();

  workouts.forEach(workout => {
    const dateKey = formatDate(new Date(workout.date), 'MMM dd');
    
    workout.exercises.forEach(sessionExercise => {
      const exercise = exercises.find(e => e.id === sessionExercise.exerciseId);
      if (!exercise) return;

      // Find max weight for this exercise in this workout
      const maxWeight = sessionExercise.sets.reduce((max, set) => 
        Math.max(max, set.weight), 0
      );

      if (maxWeight > 0) {
        if (!strengthProgress.has(exercise.name)) {
          strengthProgress.set(exercise.name, new Map());
        }
        
        const exerciseProgress = strengthProgress.get(exercise.name)!;
        const currentMax = exerciseProgress.get(dateKey) || 0;
        exerciseProgress.set(dateKey, Math.max(currentMax, maxWeight));
      }
    });
  });

  // Get all unique dates and sort them
  const allDates = new Set<string>();
  strengthProgress.forEach(exerciseData => {
    exerciseData.forEach((_, date) => allDates.add(date));
  });

  const sortedDates = Array.from(allDates).sort((a, b) => a.localeCompare(b));

  // Create chart data
  return sortedDates.map(date => {
    const dataPoint: any = { date };
    
    strengthProgress.forEach((exerciseData, exerciseName) => {
      dataPoint[exerciseName] = exerciseData.get(date) || null;
    });
    
    return dataPoint;
  });
}

function getTopExercises(workouts: WorkoutSession[], exercises: Exercise[]): Exercise[] {
  const exerciseFrequency = new Map<string, number>();

  workouts.forEach(workout => {
    workout.exercises.forEach(sessionExercise => {
      const count = exerciseFrequency.get(sessionExercise.exerciseId) || 0;
      exerciseFrequency.set(sessionExercise.exerciseId, count + 1);
    });
  });

  // Sort exercises by frequency and return the Exercise objects
  return Array.from(exerciseFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([exerciseId]) => exercises.find(e => e.id === exerciseId))
    .filter((exercise): exercise is Exercise => exercise !== undefined);
}