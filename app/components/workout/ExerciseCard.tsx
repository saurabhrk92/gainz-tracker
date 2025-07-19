'use client';

import { Exercise, SessionExercise } from '@/lib/types';
import { MUSCLE_GROUPS, EQUIPMENT_TYPES } from '@/lib/constants';

interface ExerciseCardProps {
  exercise: Exercise;
  sessionExercise: SessionExercise;
  currentSetNumber: number;
}

export default function ExerciseCard({
  exercise,
  sessionExercise,
  currentSetNumber,
}: ExerciseCardProps) {
  const muscleGroupInfo = MUSCLE_GROUPS[exercise.muscleGroup];
  const equipmentInfo = EQUIPMENT_TYPES.find(e => e.value === exercise.type);

  return (
    <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
      <div className="space-y-4">
        {/* Exercise Info */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-2">
            {muscleGroupInfo.emoji} {exercise.name}
          </h2>
          <div className="flex items-center justify-center gap-4 mt-2 text-sm text-gray-600">
            <span>{muscleGroupInfo.label}</span>
            <span>•</span>
            <span>{equipmentInfo?.icon} {equipmentInfo?.label}</span>
            {exercise.type === 'barbell' && exercise.barWeight && (
              <>
                <span>•</span>
                <span>{exercise.barWeight} lb bar</span>
              </>
            )}
          </div>
        </div>

        {/* Set Progress */}
        <div className="bg-gray-50 rounded-2xl p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-800">Set Progress</h3>
            <span className="text-sm text-gray-600 font-mono">
              {sessionExercise.completedSets}/{sessionExercise.targetSets}
            </span>
          </div>
          
          <div className="grid grid-cols-5 gap-2 mb-4">
            {Array.from({ length: sessionExercise.targetSets }, (_, index) => (
              <div
                key={index}
                className={`aspect-square rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-200 ${
                  index < sessionExercise.completedSets
                    ? 'bg-green-500 text-white shadow-lg'
                    : index === sessionExercise.completedSets
                    ? 'bg-blue-500 text-white shadow-lg animate-pulse'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {index < sessionExercise.completedSets ? '✓' : index + 1}
              </div>
            ))}
          </div>

          <div className="text-center">
            <span className="text-lg font-bold text-blue-600">
              Set {currentSetNumber}
            </span>
          </div>
        </div>

        {/* Previous Sets */}
        {sessionExercise.sets.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800">Previous Sets</h3>
            <div className="space-y-2">
              {sessionExercise.sets.map((set, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <span className="font-medium text-gray-800">
                      {set.reps} reps @ {set.weight} lbs
                    </span>
                  </div>
                  <div className="text-green-600 text-xl">✅</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggested Weight */}
        {sessionExercise.sets.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <h3 className="font-semibold text-blue-800 mb-2">💡 Last Weight Used</h3>
            <div className="text-2xl font-bold text-blue-600">
              {sessionExercise.sets[sessionExercise.sets.length - 1].weight} lbs
            </div>
            <p className="text-sm text-blue-600 mt-1">From your last set</p>
          </div>
        )}

        {/* Rest Time Info */}
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 text-center">
          <h3 className="font-semibold text-purple-800 mb-1">⏱️ Rest Time</h3>
          <div className="text-xl font-bold text-purple-600">
            {exercise.defaultRestTime}s
          </div>
        </div>
      </div>
    </div>
  );
}