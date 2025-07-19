'use client';

import { WorkoutSession, Exercise } from '@/lib/types';
import { calculateVolume, formatVolume } from '@/lib/utils';
import { UIIcon, ActionIcon } from '../ui/Icon';

interface StatsGridProps {
  workouts: WorkoutSession[];
  exercises: Exercise[];
}

export default function StatsGrid({ workouts, exercises }: StatsGridProps) {
  // Calculate stats
  const totalWorkouts = workouts.length;
  
  const totalVolume = workouts.reduce((total, workout) => {
    return total + workout.exercises.reduce((workoutVolume, exercise) => {
      return workoutVolume + calculateVolume(exercise.sets);
    }, 0);
  }, 0);

  const currentStreak = calculateStreak(workouts);
  const averageWorkoutsPerWeek = calculateAverageWorkoutsPerWeek(workouts);

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Total Volume */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-3xl shadow-xl text-white transform hover:scale-105 transition-all duration-200">
        <div className="text-center">
          <div className="text-3xl font-bold mb-1">{formatVolume(totalVolume)}</div>
          <div className="text-blue-100 text-sm font-medium">Total Volume</div>
          <UIIcon name="progress" size={32} color="white" className="mt-2" />
        </div>
      </div>

      {/* Workout Count */}
      <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-3xl shadow-xl text-white transform hover:scale-105 transition-all duration-200">
        <div className="text-center">
          <div className="text-3xl font-bold mb-1">{totalWorkouts}</div>
          <div className="text-green-100 text-sm font-medium">Workouts</div>
          <UIIcon name="workout" size={32} color="white" className="mt-2" />
        </div>
      </div>

      {/* Current Streak */}
      <div className="bg-gradient-to-br from-orange-500 to-red-500 p-6 rounded-3xl shadow-xl text-white transform hover:scale-105 transition-all duration-200">
        <div className="text-center">
          <div className="text-3xl font-bold mb-1">{currentStreak}</div>
          <div className="text-orange-100 text-sm font-medium">Day Streak</div>
          <ActionIcon name="timer" size={32} color="white" className="mt-2" />
        </div>
      </div>

      {/* Weekly Average */}
      <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-3xl shadow-xl text-white transform hover:scale-105 transition-all duration-200">
        <div className="text-center">
          <div className="text-3xl font-bold mb-1">{averageWorkoutsPerWeek.toFixed(1)}</div>
          <div className="text-purple-100 text-sm font-medium">Per Week</div>
          <UIIcon name="calendar" size={32} color="white" className="mt-2" />
        </div>
      </div>
    </div>
  );
}

function calculateStreak(workouts: WorkoutSession[]): number {
  if (workouts.length === 0) return 0;

  // Sort workouts by date (newest first)
  const sortedWorkouts = [...workouts].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if there's a workout today or yesterday to start the streak
  const latestWorkout = new Date(sortedWorkouts[0].date);
  latestWorkout.setHours(0, 0, 0, 0);
  
  const daysSinceLatest = Math.floor((today.getTime() - latestWorkout.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysSinceLatest > 1) {
    return 0; // Streak broken if more than 1 day since last workout
  }

  // Count consecutive days with workouts
  let checkDate = new Date(latestWorkout);
  
  for (const workout of sortedWorkouts) {
    const workoutDate = new Date(workout.date);
    workoutDate.setHours(0, 0, 0, 0);
    
    if (workoutDate.getTime() === checkDate.getTime()) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (workoutDate.getTime() < checkDate.getTime()) {
      // Gap in workouts, streak ends
      break;
    }
  }

  return streak;
}

function calculateAverageWorkoutsPerWeek(workouts: WorkoutSession[]): number {
  if (workouts.length === 0) return 0;

  const oldestWorkout = new Date(Math.min(...workouts.map(w => new Date(w.date).getTime())));
  const newestWorkout = new Date(Math.max(...workouts.map(w => new Date(w.date).getTime())));
  
  const daysDiff = (newestWorkout.getTime() - oldestWorkout.getTime()) / (1000 * 60 * 60 * 24);
  const weeksDiff = Math.max(daysDiff / 7, 1); // At least 1 week

  return workouts.length / weeksDiff;
}