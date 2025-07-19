'use client';

import { WorkoutSession, Exercise } from '@/lib/types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { MUSCLE_GROUPS } from '@/lib/constants';
import { UIIcon } from '../ui/Icon';

interface MuscleGroupChartProps {
  workouts: WorkoutSession[];
  exercises: Exercise[];
}

export default function MuscleGroupChart({ workouts, exercises }: MuscleGroupChartProps) {
  const chartData = processMuscleGroupData(workouts, exercises);

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <UIIcon name="progress" size={48} color="#9CA3AF" className="mb-2" />
          <p>No muscle group data available</p>
          <p className="text-sm mt-1">Complete some workouts to see your focus areas!</p>
        </div>
      </div>
    );
  }

  // Custom colors for each muscle group
  const COLORS = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // yellow
    '#ef4444', // red
    '#8b5cf6', // purple
    '#06b6d4', // cyan
    '#f97316', // orange
    '#ec4899', // pink
  ];

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="sets"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number, name) => [
              `${value} sets`,
              name
            ]}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function processMuscleGroupData(workouts: WorkoutSession[], exercises: Exercise[]) {
  const muscleGroupSets = new Map<string, number>();

  workouts.forEach(workout => {
    workout.exercises.forEach(sessionExercise => {
      const exercise = exercises.find(e => e.id === sessionExercise.exerciseId);
      if (!exercise) return;

      const muscleGroup = exercise.muscleGroup;
      const sets = sessionExercise.sets.length;
      
      muscleGroupSets.set(
        muscleGroup,
        (muscleGroupSets.get(muscleGroup) || 0) + sets
      );
    });
  });

  // Convert to chart data format
  return Array.from(muscleGroupSets.entries())
    .map(([muscleGroup, sets]) => ({
      name: MUSCLE_GROUPS[muscleGroup as keyof typeof MUSCLE_GROUPS]?.label || muscleGroup,
      sets,
      icon: MUSCLE_GROUPS[muscleGroup as keyof typeof MUSCLE_GROUPS]?.icon || 'arms',
    }))
    .sort((a, b) => b.sets - a.sets); // Sort by number of sets descending
}