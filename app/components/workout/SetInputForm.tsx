'use client';

import { useState, useEffect } from 'react';
import { getDB } from '@/lib/storage/indexedDB';
import { DUMBBELL_WEIGHTS, FIXED_BAR_WEIGHTS } from '@/lib/constants';
import { EquipmentType } from '@/lib/types';
import Button from '../ui/Button';
import Card from '../ui/Card';

interface SetInputFormProps {
  onSubmit: (reps: number, weight: number) => void;
  previousSets: Array<{ reps: number; weight: number }>;
  barWeight?: number;
  exerciseId: string;
  exerciseType: EquipmentType;
}

export default function SetInputForm({ onSubmit, previousSets, barWeight = 45, exerciseId, exerciseType }: SetInputFormProps) {
  const [reps, setReps] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [lastWorkoutData, setLastWorkoutData] = useState<{ reps: number; weight: number } | null>(null);
  const [plateWeights, setPlateWeights] = useState<{ [key: number]: number }>({
    45: 0,
    35: 0, 
    25: 0,
    10: 0,
    5: 0,
    2.5: 0
  });

  // Load last workout data for this exercise and set number
  useEffect(() => {
    const loadLastWorkoutData = async () => {
      try {
        console.log('Loading last workout data for exerciseId:', exerciseId, 'set number:', previousSets.length + 1);
        const db = await getDB();
        const lastWorkout = await db.getLastWorkoutForExercise(exerciseId);
        
        if (lastWorkout) {
          const exerciseData = lastWorkout.exercises.find(ex => ex.exerciseId === exerciseId);
          if (exerciseData && exerciseData.sets.length > 0) {
            const currentSetNumber = previousSets.length;
            const lastSet = exerciseData.sets[currentSetNumber];
            
            if (lastSet) {
              setLastWorkoutData({ reps: lastSet.reps, weight: lastSet.weight });
              setReps(lastSet.reps.toString());
              setWeight(lastSet.weight.toString());
              
              // Only calculate plate config for barbell exercises
              if (exerciseType === 'barbell') {
                const targetWeight = lastSet.weight - barWeight;
                const plateConfig = calculatePlateConfig(targetWeight);
                setPlateWeights(plateConfig);
              }
            } else {
              setLastWorkoutData(null);
              setReps('');
              setWeight('');
              setPlateWeights({ 45: 0, 35: 0, 25: 0, 10: 0, 5: 0, 2.5: 0 });
            }
          } else {
            setLastWorkoutData(null);
          }
        } else {
          setLastWorkoutData(null);
        }
      } catch (error) {
        console.error('Failed to load last workout data:', error);
      }
    };

    loadLastWorkoutData();
  }, [exerciseId, previousSets.length, barWeight, exerciseType]);

  // Calculate total weight from plates (only for barbell)
  const calculateTotalWeight = () => {
    const plateTotal = Object.entries(plateWeights).reduce((total, [plateWeight, count]) => {
      return total + (parseFloat(plateWeight) * count * 2);
    }, 0);
    return barWeight + plateTotal;
  };

  // Calculate plate configuration for a target weight (per side)
  const calculatePlateConfig = (targetWeightPerSide: number) => {
    const plateTypes = [45, 35, 25, 10, 5, 2.5];
    const config: { [key: number]: number } = {
      45: 0, 35: 0, 25: 0, 10: 0, 5: 0, 2.5: 0
    };
    
    let remainingWeight = targetWeightPerSide / 2;
    
    for (const plateWeight of plateTypes) {
      const plateCount = Math.floor(remainingWeight / plateWeight);
      config[plateWeight] = plateCount;
      remainingWeight -= plateCount * plateWeight;
    }
    
    return config;
  };

  // Add/remove plates (only for barbell)
  const adjustPlate = (plateWeight: number, change: number) => {
    setPlateWeights(prev => {
      const newCount = Math.max(0, (prev[plateWeight] || 0) + change);
      const updated = { ...prev, [plateWeight]: newCount };
      
      const totalWeight = barWeight + Object.entries(updated).reduce((total, [weight, count]) => {
        return total + (parseFloat(weight) * count * 2);
      }, 0);
      setWeight(totalWeight.toString());
      
      return updated;
    });
  };

  // Reset all plates
  const resetPlates = () => {
    setPlateWeights({
      45: 0, 35: 0, 25: 0, 10: 0, 5: 0, 2.5: 0
    });
    setWeight(barWeight.toString());
  };

  const suggestedWeight = previousSets.length > 0 
    ? previousSets[previousSets.length - 1].weight 
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const repsNum = parseInt(reps);
    const weightNum = parseFloat(weight);
    
    if (isNaN(repsNum) || isNaN(weightNum) || repsNum <= 0 || weightNum < 0) {
      alert('Please enter valid reps and weight values');
      return;
    }
    
    onSubmit(repsNum, weightNum);
  };

  const handleQuickFill = (prevSet: { reps: number; weight: number }) => {
    setReps(prevSet.reps.toString());
    setWeight(prevSet.weight.toString());
  };

  const adjustWeight = (amount: number) => {
    const currentWeight = parseFloat(weight) || suggestedWeight || 0;
    const newWeight = Math.max(0, currentWeight + amount);
    setWeight(newWeight.toString());
  };

  // Render weight input based on exercise type
  const renderWeightInput = () => {
    console.log('SetInputForm exerciseType:', exerciseType);
    switch (exerciseType) {
      case 'barbell':
        return (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Total Weight (lbs)
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => adjustWeight(-5)}
                className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center text-lg font-bold text-gray-700 transition-all duration-200"
              >
                −
              </button>
              <input
                type="number"
                value={weight || (lastWorkoutData ? lastWorkoutData.weight.toString() : '')}
                onChange={(e) => setWeight(e.target.value)}
                placeholder={lastWorkoutData ? lastWorkoutData.weight.toString() : (suggestedWeight > 0 ? suggestedWeight.toString() : "135")}
                className="flex-1 px-3 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 min-h-[44px] text-sm text-center font-bold"
                min="0"
                step="2.5"
                required
              />
              <button
                type="button"
                onClick={() => adjustWeight(5)}
                className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center text-lg font-bold text-gray-700 transition-all duration-200"
              >
                +
              </button>
            </div>
          </div>
        );

      case 'dumbbell':
        return (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Dumbbell Weight (lbs per dumbbell)
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => adjustWeight(-5)}
                className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center text-lg font-bold text-gray-700 transition-all duration-200"
              >
                −
              </button>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Enter weight"
                className="flex-1 px-3 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 min-h-[44px] text-sm text-center font-bold"
                min="0"
                step="2.5"
                required
              />
              <button
                type="button"
                onClick={() => adjustWeight(5)}
                className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center text-lg font-bold text-gray-700 transition-all duration-200"
              >
                +
              </button>
            </div>
          </div>
        );

      case 'fixed_bar':
        return (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Fixed Bar Weight (lbs)
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => adjustWeight(-5)}
                className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center text-lg font-bold text-gray-700 transition-all duration-200"
              >
                −
              </button>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Enter weight"
                className="flex-1 px-3 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 min-h-[44px] text-sm text-center font-bold"
                min="0"
                step="5"
                required
              />
              <button
                type="button"
                onClick={() => adjustWeight(5)}
                className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center text-lg font-bold text-gray-700 transition-all duration-200"
              >
                +
              </button>
            </div>
          </div>
        );

      case 'machine':
        return (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Machine Weight (lbs)
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => adjustWeight(-5)}
                className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center text-lg font-bold text-gray-700 transition-all duration-200"
              >
                −
              </button>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Enter weight"
                className="flex-1 px-3 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 min-h-[44px] text-sm text-center font-bold"
                min="0"
                step="2.5"
                required
              />
              <button
                type="button"
                onClick={() => adjustWeight(5)}
                className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center text-lg font-bold text-gray-700 transition-all duration-200"
              >
                +
              </button>
            </div>
          </div>
        );

      case 'bodyweight':
        return (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Additional Weight (lbs)
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => adjustWeight(-5)}
                className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center text-lg font-bold text-gray-700 transition-all duration-200"
              >
                −
              </button>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="0"
                className="flex-1 px-3 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 min-h-[44px] text-sm text-center font-bold"
                min="0"
                step="5"
                required
              />
              <button
                type="button"
                onClick={() => adjustWeight(5)}
                className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center text-lg font-bold text-gray-700 transition-all duration-200"
              >
                +
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Enter additional weight beyond bodyweight (0 for bodyweight only)
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        <h3 className="text-lg font-bold text-black">Log Your Set</h3>
        
        {/* Quick Fill from Previous Sets */}
        {previousSets.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">
              Quick Fill:
            </label>
            <div className="flex gap-2 flex-wrap">
              {previousSets.slice(-3).map((set, index) => (
                <Button
                  key={index}
                  type="button"
                  variant="glass"
                  size="sm"
                  onClick={() => handleQuickFill(set)}
                  className="text-xs"
                >
                  {set.reps} reps @ {set.weight} lbs
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Reps
            </label>
            <input
              type="number"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              placeholder={lastWorkoutData ? lastWorkoutData.reps.toString() : "8"}
              className="w-full px-3 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 min-h-[44px] text-sm text-center font-bold"
              min="1"
              max="100"
              required
            />
          </div>

          {renderWeightInput()}
        </div>

        {/* Barbell Plate Builder */}
        {exerciseType === 'barbell' && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-black">Plate Builder</h4>
              <div className="text-right">
                <div className="text-xs text-gray-600">Bar: {barWeight} lbs</div>
                <div className="text-lg font-bold text-purple-600">Total: {calculateTotalWeight()} lbs</div>
              </div>
            </div>
            
            {/* Barbell Visualization */}
            <div className="relative flex items-center justify-center bg-white rounded-lg p-4 min-h-[80px] border border-gray-200">
              {/* Left side plates */}
              <div className="flex items-center">
                {Object.entries(plateWeights).map(([plateWeight, count]) => {
                  const weight = parseFloat(plateWeight);
                  const plateColor = {
                    45: '#dc2626', 35: '#16a34a', 25: '#2563eb',
                    10: '#4b5563', 5: '#eab308', 2.5: '#ea580c'
                  }[weight];
                  
                  const plateHeight = {
                    45: 60, 35: 55, 25: 50, 10: 40, 5: 35, 2.5: 30
                  }[weight];
                  
                  return Array.from({ length: count }).map((_, index) => (
                    <button
                      key={`left-${weight}-${index}`}
                      type="button"
                      onClick={() => adjustPlate(weight, -1)}
                      className="transform hover:scale-105 active:scale-95 transition-transform duration-150 mr-0.5"
                      style={{
                        width: '12px',
                        height: `${plateHeight}px`,
                        backgroundColor: plateColor,
                        borderRadius: '3px',
                        border: '2px solid rgba(0,0,0,0.3)',
                        zIndex: 10 - index,
                        minWidth: '12px',
                        touchAction: 'manipulation'
                      }}
                      title={`Remove ${weight} lb plate`}
                    />
                  ));
                })}
              </div>
              
              {/* Barbell */}
              <div 
                className="bg-gray-800 mx-2 rounded-sm flex items-center justify-center text-white text-xs font-bold"
                style={{ width: '120px', height: '20px' }}
              >
                {barWeight}
              </div>
              
              {/* Right side plates */}
              <div className="flex items-center">
                {Object.entries(plateWeights).map(([plateWeight, count]) => {
                  const weight = parseFloat(plateWeight);
                  const plateColor = {
                    45: '#dc2626', 35: '#16a34a', 25: '#2563eb',
                    10: '#4b5563', 5: '#eab308', 2.5: '#ea580c'
                  }[weight];
                  
                  const plateHeight = {
                    45: 60, 35: 55, 25: 50, 10: 40, 5: 35, 2.5: 30
                  }[weight];
                  
                  return Array.from({ length: count }).map((_, index) => (
                    <button
                      key={`right-${weight}-${index}`}
                      type="button"
                      onClick={() => adjustPlate(weight, -1)}
                      className="transform hover:scale-105 active:scale-95 transition-transform duration-150 ml-0.5"
                      style={{
                        width: '12px',
                        height: `${plateHeight}px`,
                        backgroundColor: plateColor,
                        borderRadius: '3px',
                        border: '2px solid rgba(0,0,0,0.3)',
                        zIndex: 10 - index,
                        minWidth: '12px',
                        touchAction: 'manipulation'
                      }}
                      title={`Remove ${weight} lb plate`}
                    />
                  ));
                })}
              </div>
            </div>
            
            {/* Available Plates to Add */}
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-2">Tap to add plates:</div>
              <div className="flex gap-3 justify-center flex-wrap">
                {Object.entries({
                  45: '#dc2626', 35: '#16a34a', 25: '#2563eb',
                  10: '#4b5563', 5: '#eab308', 2.5: '#ea580c'
                }).map(([weight, color]) => {
                  const plateHeight = {
                    45: 50, 35: 46, 25: 42, 10: 34, 5: 30, 2.5: 26
                  }[parseFloat(weight)];
                  
                  return (
                    <button
                      key={weight}
                      type="button"
                      onClick={() => adjustPlate(parseFloat(weight), 1)}
                      className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-150"
                    >
                      <div
                        className="rounded-sm border border-gray-400 flex items-center justify-center text-white text-xs font-bold shadow-sm transform hover:scale-110 transition-transform duration-150"
                        style={{
                          width: '24px',
                          height: `${plateHeight}px`,
                          backgroundColor: color
                        }}
                      >
                        {weight === '2.5' ? '2.5' : weight}
                      </div>
                      <span className="text-xs text-gray-600">{weight}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={resetPlates}
                className="flex-1"
              >
                Reset
              </Button>
              <Button
                type="button"
                variant="glass"
                size="sm"
                onClick={() => setWeight(barWeight.toString())}
                className="flex-1"
              >
                Bar Only
              </Button>
            </div>
          </div>
        )}


        {/* Last Workout Data */}
        {lastWorkoutData && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-blue-800 text-sm font-medium">
              Last workout (Set {previousSets.length + 1}): {lastWorkoutData.reps} reps @ {lastWorkoutData.weight} lbs
            </p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={!reps || !weight}
        >
          Log Set
        </Button>
      </form>
    </Card>
  );
}