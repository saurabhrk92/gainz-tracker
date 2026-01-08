'use client';

import { useState, useEffect } from 'react';
import { getDB } from '@/lib/storage/indexedDB';
import { DUMBBELL_WEIGHTS, FIXED_BAR_WEIGHTS } from '@/lib/constants';
import { EquipmentType } from '@/lib/types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { EquipmentIcon } from '../ui/Icon';

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
    2.5: 0,
    5: 0
  });
  const [showPlateBuilder, setShowPlateBuilder] = useState(false);

  // Load last workout data for this exercise and set number
  useEffect(() => {
    const loadLastWorkoutData = async () => {
      try {
        console.log('Loading last workout data for exerciseId:', exerciseId, 'set number:', previousSets.length + 1);
        const db = await getDB();
        const lastWorkout = await db.getLastWorkoutForExercise(exerciseId);
        
        if (lastWorkout) {
          console.log('Found last workout:', lastWorkout);
          const exerciseData = lastWorkout.exercises.find(ex => ex.exerciseId === exerciseId);
          console.log('Exercise data in last workout:', exerciseData);
          if (exerciseData && exerciseData.sets.length > 0) {
            const currentSetNumber = previousSets.length;
            const lastSet = exerciseData.sets[currentSetNumber];
            
            if (lastSet) {
              console.log('Found historical set data:', lastSet);
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
              // No historical data for this set number, try to use last set from current session
              setLastWorkoutData(null);
              const lastCurrentSet = previousSets[previousSets.length - 1];
              if (lastCurrentSet) {
                console.log('No historical data, using last set from current session:', lastCurrentSet);
                setReps(lastCurrentSet.reps.toString());
                setWeight(lastCurrentSet.weight.toString());

                // Calculate plate config for barbell exercises
                if (exerciseType === 'barbell') {
                  const targetWeight = lastCurrentSet.weight - barWeight;
                  const plateConfig = calculatePlateConfig(targetWeight);
                  setPlateWeights(plateConfig);
                }
              } else {
                console.log('No historical data and no previous sets, leaving empty for user input');
                setReps('');
                setWeight('');
                setPlateWeights({ 45: 0, 35: 0, 25: 0, 10: 0, 2.5: 0, 5: 0 });
              }
            }
          } else {
            // Found historical exercise data but no sets
            setLastWorkoutData(null);
            const lastCurrentSet = previousSets[previousSets.length - 1];
            if (lastCurrentSet) {
              console.log('Historical exercise found but no sets, using last set from current session:', lastCurrentSet);
              setReps(lastCurrentSet.reps.toString());
              setWeight(lastCurrentSet.weight.toString());

              // Calculate plate config for barbell exercises
              if (exerciseType === 'barbell') {
                const targetWeight = lastCurrentSet.weight - barWeight;
                const plateConfig = calculatePlateConfig(targetWeight);
                setPlateWeights(plateConfig);
              }
            } else {
              console.log('Historical exercise found but no sets and no previous sets, leaving empty for user input');
              setReps('');
              setWeight('');
              setPlateWeights({ 45: 0, 35: 0, 25: 0, 10: 0, 5: 0, 2.5: 0 });
            }
          }
        } else {
          console.log('No last workout found for exercise:', exerciseId);
          setLastWorkoutData(null);
          // No historical workout data, try to use last set from current session
          const lastCurrentSet = previousSets[previousSets.length - 1];
          if (lastCurrentSet) {
            console.log('No historical workout, using last set from current session:', lastCurrentSet);
            setReps(lastCurrentSet.reps.toString());
            setWeight(lastCurrentSet.weight.toString());

            // Calculate plate config for barbell exercises
            if (exerciseType === 'barbell') {
              const targetWeight = lastCurrentSet.weight - barWeight;
              const plateConfig = calculatePlateConfig(targetWeight);
              setPlateWeights(plateConfig);
            }
          } else {
            console.log('No historical workout and no previous sets, leaving empty for user input');
            setReps('');
            setWeight('');
            setPlateWeights({ 45: 0, 35: 0, 25: 0, 10: 0, 5: 0, 2.5: 0 });
          }
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
    const plateTypes = [45, 35, 25, 10, 2.5, 5];
    const config: { [key: number]: number } = {
      45: 0, 35: 0, 25: 0, 10: 0, 2.5: 0, 5: 0
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
      45: 0, 35: 0, 25: 0, 10: 0, 2.5: 0, 5: 0
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
    
    if (isNaN(repsNum) || isNaN(weightNum) || repsNum <= 0) {
      alert('Please enter valid reps and weight values');
      return;
    }
    
    // For bodyweight exercises, negative weight is valid (assisted exercises)
    // For other exercises, weight must be greater than 0
    if (exerciseType !== 'bodyweight' && weightNum <= 0) {
      alert('Please enter a valid weight greater than 0');
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

  const adjustReps = (amount: number) => {
    const currentValue = parseInt(reps) || 0;
    const newValue = Math.max(1, Math.min(100, currentValue + amount));
    setReps(newValue.toString());
  };

  // Render weight input based on exercise type
  const renderWeightInput = () => {
    console.log('SetInputForm exerciseType:', exerciseType);
    switch (exerciseType) {
      case 'barbell':
        return (
          <label className="block text-sm font-semibold text-gray-700 mb-2 min-h-[40px] flex items-end gap-2">
            <EquipmentIcon name="barbell" size={16} />
            Total Weight (lbs)
          </label>
        );

      case 'dumbbell':
        return (
          <label className="block text-sm font-semibold text-gray-700 mb-2 min-h-[40px] flex items-end gap-2">
            <EquipmentIcon name="dumbbell" size={16} />
            Dumbbell Weight
          </label>
        );

      case 'fixed_bar':
        return (
          <label className="block text-sm font-semibold text-gray-700 mb-2 min-h-[40px] flex items-end gap-2">
            <EquipmentIcon name="fixed-bar" size={16} />
            Fixed Bar Weight (lbs)
          </label>
        );

      case 'machine':
        return (
          <label className="block text-sm font-semibold text-gray-700 mb-2 min-h-[40px] flex items-end gap-2">
            <EquipmentIcon name="machine" size={16} />
            Machine Weight (lbs)
          </label>
        );

      case 'bodyweight':
        return (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 min-h-[40px] flex items-end gap-2">
              <EquipmentIcon name="dumbbell" size={16} />
              Additional Weight (lbs)
            </label>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4 overflow-hidden">
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
        <div className="grid grid-cols-2 gap-2 sm:gap-4 w-full min-w-0">
          {/* Reps Column */}
          <div className="min-w-0">
            <label className="block text-sm font-semibold text-gray-700 mb-2 min-h-[40px] flex items-end">
              Reps
            </label>
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={() => adjustReps(-1)}
                className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center text-lg font-bold text-gray-700 transition-all duration-200 flex-shrink-0"
              >
                −
              </button>
              <input
                type="number"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                placeholder={lastWorkoutData ? lastWorkoutData.reps.toString() : "8"}
                className="flex-1 min-w-0 px-2 py-3 sm:px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 min-h-[44px] text-sm text-center font-bold"
                min="1"
                max="100"
                required
              />
              <button
                type="button"
                onClick={() => adjustReps(1)}
                className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center text-lg font-bold text-gray-700 transition-all duration-200 flex-shrink-0"
              >
                +
              </button>
            </div>
          </div>

          {/* Weight Column */}
          <div className="min-w-0">
            {renderWeightInput()}
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={() => adjustWeight(-5)}
                className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center text-lg font-bold text-gray-700 transition-all duration-200 flex-shrink-0"
              >
                −
              </button>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder={
                  exerciseType === 'bodyweight' 
                    ? "0" 
                    : lastWorkoutData 
                      ? lastWorkoutData.weight.toString() 
                      : (suggestedWeight > 0 ? suggestedWeight.toString() : "135")
                }
                className="flex-1 min-w-0 px-2 py-3 sm:px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 min-h-[44px] text-sm text-center font-bold"
                min="0"
                step={exerciseType === 'fixed_bar' ? "5" : "2.5"}
                required
              />
              <button
                type="button"
                onClick={() => adjustWeight(5)}
                className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center text-lg font-bold text-gray-700 transition-all duration-200 flex-shrink-0"
              >
                +
              </button>
            </div>
            {exerciseType === 'bodyweight' && (
              <p className="text-xs text-gray-500 mt-1">
                Enter additional weight beyond bodyweight (0 for bodyweight only)
              </p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={!reps || !weight}
        >
          Log Set
        </Button>

        {/* Barbell Plate Builder */}
        {exerciseType === 'barbell' && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => setShowPlateBuilder(!showPlateBuilder)}
                className="flex items-center gap-2 font-bold text-black hover:text-purple-600 transition-colors"
              >
                <span>Plate Builder</span>
                <span className="text-sm">
                  {showPlateBuilder ? '▼' : '▶'}
                </span>
              </button>
              <div className="text-right">
                <div className="text-xs text-gray-600">Bar: {barWeight} lbs</div>
                <div className="text-lg font-bold text-purple-600">Total: {calculateTotalWeight()} lbs</div>
              </div>
            </div>

            {showPlateBuilder && (
              <div className="space-y-4">
            
            {/* Barbell Visualization */}
            <div className="relative flex items-center justify-center bg-white rounded-lg p-4 min-h-[80px] border border-gray-200">
              {/* Left side plates (reverse order for proper loading visualization) */}
              <div className="flex items-center">
                {Object.entries(plateWeights).reverse().map(([plateWeight, count]) => {
                  const weight = parseFloat(plateWeight);
                  const plateColor = {
                    45: '#dc2626', 35: '#16a34a', 25: '#2563eb',
                    10: '#4b5563', 2.5: '#ea580c', 5: '#eab308'
                  }[weight];
                  
                  const plateHeight = {
                    45: 60, 35: 55, 25: 50, 10: 40, 2.5: 30, 5: 35
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
                    10: '#4b5563', 2.5: '#ea580c', 5: '#eab308'
                  }[weight];
                  
                  const plateHeight = {
                    45: 60, 35: 55, 25: 50, 10: 40, 2.5: 30, 5: 35
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
                  10: '#4b5563', 2.5: '#ea580c', 5: '#eab308'
                }).map(([weight, color]) => {
                  const plateHeight = {
                    45: 50, 35: 46, 25: 42, 10: 34, 2.5: 26, 5: 30
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
      </form>
    </Card>
  );
}