'use client';

import { useState } from 'react';
import { WorkoutSet } from '@/lib/types';

interface SetInputProps {
  onSubmit: (reps: number, weight: number) => void;
  previousSets: WorkoutSet[];
  suggestedWeight: number;
}

export default function SetInput({
  onSubmit,
  previousSets,
  suggestedWeight,
}: SetInputProps) {
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState(suggestedWeight > 0 ? suggestedWeight.toString() : '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const repsNum = parseInt(reps);
    const weightNum = parseFloat(weight);

    if (!repsNum || repsNum <= 0 || !weightNum || weightNum <= 0) {
      alert('Please enter valid reps and weight');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(repsNum, weightNum);
      setReps('');
      // Keep weight for next set
    } catch (error) {
      console.error('Failed to submit set:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickReps = [8, 10, 12, 15];
  const lastSet = previousSets[previousSets.length - 1];

  return (
    <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-gray-800 text-center">Record Your Set</h3>

        {/* Quick Fill from Last Set */}
        {lastSet && (
          <div className="bg-gray-50 rounded-2xl p-4">
            <h4 className="font-semibold text-gray-700 mb-3">Quick Fill from Last Set</h4>
            <button
              onClick={() => {
                setReps(lastSet.reps.toString());
                setWeight(lastSet.weight.toString());
              }}
              className="w-full bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium py-3 rounded-xl transition-all duration-200"
            >
              📋 {lastSet.reps} reps @ {lastSet.weight} lbs
            </button>
          </div>
        )}

        {/* Reps Input */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700">Reps</label>
          <div className="space-y-3">
            <input
              type="number"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              placeholder="Enter reps"
              className="w-full text-center text-3xl font-bold py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              min="1"
              max="100"
            />
            
            {/* Quick Reps Buttons */}
            <div className="grid grid-cols-4 gap-2">
              {quickReps.map((rep) => (
                <button
                  key={rep}
                  onClick={() => setReps(rep.toString())}
                  className={`py-2 rounded-xl font-medium transition-all duration-200 ${
                    reps === rep.toString()
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {rep}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Weight Input */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700">Weight (lbs)</label>
          <div className="space-y-3">
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="Enter weight"
              className="w-full text-center text-3xl font-bold py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              min="0"
              step="0.5"
            />
            
            {/* Quick Weight Adjustments */}
            <div className="grid grid-cols-5 gap-2">
              {[-10, -5, -2.5, +2.5, +5, +10].map((adj) => (
                <button
                  key={adj}
                  onClick={() => {
                    const currentWeight = parseFloat(weight) || 0;
                    const newWeight = Math.max(0, currentWeight + adj);
                    setWeight(newWeight.toString());
                  }}
                  className="py-2 px-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all duration-200 text-sm"
                >
                  {adj > 0 ? '+' : ''}{adj}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !reps || !weight}
          className={`w-full font-bold py-4 rounded-xl shadow-lg transition-all duration-200 text-lg ${
            isSubmitting || !reps || !weight
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Recording Set...
            </span>
          ) : (
            '✅ Record Set'
          )}
        </button>

        {/* Performance Indicator */}
        {lastSet && reps && weight && (
          <div className="text-center p-3 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
            {(() => {
              const currentReps = parseInt(reps);
              const currentWeight = parseFloat(weight);
              const lastReps = lastSet.reps;
              const lastWeight = lastSet.weight;
              
              const currentVolume = currentReps * currentWeight;
              const lastVolume = lastReps * lastWeight;
              
              if (currentVolume > lastVolume) {
                return (
                  <div className="text-green-600 font-semibold">
                    🚀 Volume increase! +{(currentVolume - lastVolume).toFixed(1)} lbs
                  </div>
                );
              } else if (currentVolume === lastVolume) {
                return (
                  <div className="text-blue-600 font-semibold">
                    💪 Same as last time - great consistency!
                  </div>
                );
              } else {
                return (
                  <div className="text-yellow-600 font-semibold">
                    📉 Lower volume than last time
                  </div>
                );
              }
            })()}
          </div>
        )}
      </div>
    </div>
  );
}