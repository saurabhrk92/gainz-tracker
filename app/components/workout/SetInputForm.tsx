'use client';

import { useState, useEffect } from 'react';
import { getDB } from '@/lib/storage/indexedDB';
import Button from '../ui/Button';
import Card from '../ui/Card';

interface SetInputFormProps {
  onSubmit: (reps: number, weight: number) => void;
  previousSets: Array<{ reps: number; weight: number }>;
  barWeight?: number;
  exerciseId: string;
}

export default function SetInputForm({ onSubmit, previousSets, barWeight = 45, exerciseId }: SetInputFormProps) {
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
            // Get the set data for the current set number (previousSets.length + 1)
            const currentSetNumber = previousSets.length; // 0-indexed
            const lastSet = exerciseData.sets[currentSetNumber];
            
            console.log('Found exercise data:', exerciseData, 'looking for set:', currentSetNumber, 'found set:', lastSet);
            
            if (lastSet) {
              console.log('Pre-filling with:', lastSet.reps, 'reps @', lastSet.weight, 'lbs');
              setLastWorkoutData({ reps: lastSet.reps, weight: lastSet.weight });
              
              // Pre-fill both reps and weight from last workout
              const repsStr = lastSet.reps.toString();
              const weightStr = lastSet.weight.toString();
              
              console.log('Setting reps to:', repsStr, 'and weight to:', weightStr);
              setReps(repsStr);
              setWeight(weightStr);
              
              // Calculate plate configuration for the last workout weight
              const targetWeight = lastSet.weight - barWeight;
              const plateConfig = calculatePlateConfig(targetWeight);
              setPlateWeights(plateConfig);
              
              // Force a small delay to ensure state updates
              setTimeout(() => {
                console.log('After timeout - reps state:', reps, 'weight state:', weight);
              }, 100);
            } else {
              console.log('No last set found for set number:', currentSetNumber);
              // Clear previous data if no set found
              setLastWorkoutData(null);
              setReps('');
              setWeight('');
              setPlateWeights({ 45: 0, 35: 0, 25: 0, 10: 0, 5: 0, 2.5: 0 });
            }
          } else {
            console.log('No exercise data found or no sets in last workout');
            setLastWorkoutData(null);
          }
        } else {
          console.log('No last workout found for this exercise');
          setLastWorkoutData(null);
        }
      } catch (error) {
        console.error('Failed to load last workout data:', error);
      }
    };

    loadLastWorkoutData();
  }, [exerciseId, previousSets.length, barWeight]);

  // Calculate total weight from plates
  const calculateTotalWeight = () => {
    const plateTotal = Object.entries(plateWeights).reduce((total, [plateWeight, count]) => {
      return total + (parseFloat(plateWeight) * count * 2); // multiply by 2 for both sides
    }, 0);
    return barWeight + plateTotal;
  };

  // Calculate plate configuration for a target weight (per side)
  const calculatePlateConfig = (targetWeightPerSide: number) => {
    const plateTypes = [45, 35, 25, 10, 5, 2.5];
    const config: { [key: number]: number } = {
      45: 0, 35: 0, 25: 0, 10: 0, 5: 0, 2.5: 0
    };
    
    let remainingWeight = targetWeightPerSide / 2; // divide by 2 since we want per side
    
    for (const plateWeight of plateTypes) {
      const plateCount = Math.floor(remainingWeight / plateWeight);
      config[plateWeight] = plateCount;
      remainingWeight -= plateCount * plateWeight;
    }
    
    return config;
  };

  // Add/remove plates
  const adjustPlate = (plateWeight: number, change: number) => {
    setPlateWeights(prev => {
      const newCount = Math.max(0, (prev[plateWeight] || 0) + change);
      const updated = { ...prev, [plateWeight]: newCount };
      
      // Auto-update weight field
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

  // Suggest weight based on previous set or last set from previous sets
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
    
    // Don't clear form immediately - let the parent component trigger re-loading
    // The useEffect will handle clearing and re-populating based on new set count
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

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800 font-display">💪 Log Your Set</h3>
        
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
              value={reps || (lastWorkoutData ? lastWorkoutData.reps.toString() : '')}
              onChange={(e) => setReps(e.target.value)}
              placeholder={lastWorkoutData ? lastWorkoutData.reps.toString() : "8"}
              className="w-full p-4 bg-white/95 backdrop-blur-md rounded-2xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-lg transition-all duration-200 text-center text-xl font-bold"
              min="1"
              max="100"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Total Weight (lbs)
            </label>
            <input
              type="number"
              value={weight || (lastWorkoutData ? lastWorkoutData.weight.toString() : '')}
              onChange={(e) => setWeight(e.target.value)}
              placeholder={lastWorkoutData ? lastWorkoutData.weight.toString() : (suggestedWeight > 0 ? suggestedWeight.toString() : "135")}
              className="w-full p-4 bg-white/95 backdrop-blur-md rounded-2xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-lg transition-all duration-200 text-center text-xl font-bold"
              min="0"
              step="2.5"
              required
            />
          </div>
        </div>

        {/* Visual Plate Builder */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-gray-800">🏋️ Plate Builder</h4>
            <div className="text-right">
              <div className="text-xs text-gray-600">Bar: {barWeight} lbs</div>
              <div className="text-lg font-bold text-primary-600">Total: {calculateTotalWeight()} lbs</div>
            </div>
          </div>
          
          {/* Barbell Visualization */}
          <div className="relative flex items-center justify-center bg-white/80 rounded-xl p-4 min-h-[80px]">
            {/* Left side plates */}
            <div className="flex items-center">
              {Object.entries(plateWeights).map(([plateWeight, count]) => {
                const weight = parseFloat(plateWeight);
                const plateColor = {
                  45: '#dc2626', // red
                  35: '#16a34a', // green
                  25: '#2563eb', // blue
                  10: '#4b5563', // gray
                  5: '#eab308',  // yellow
                  2.5: '#ea580c' // orange
                }[weight];
                
                const plateHeight = {
                  45: 60,
                  35: 55,
                  25: 50,
                  10: 40,
                  5: 35,
                  2.5: 30
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
            
            {/* Right side plates (mirror of left) */}
            <div className="flex items-center">
              {Object.entries(plateWeights).map(([plateWeight, count]) => {
                const weight = parseFloat(plateWeight);
                const plateColor = {
                  45: '#dc2626',
                  35: '#16a34a',
                  25: '#2563eb',
                  10: '#4b5563',
                  5: '#eab308',
                  2.5: '#ea580c'
                }[weight];
                
                const plateHeight = {
                  45: 60,
                  35: 55,
                  25: 50,
                  10: 40,
                  5: 35,
                  2.5: 30
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
                45: '#dc2626',
                35: '#16a34a', 
                25: '#2563eb',
                10: '#4b5563',
                5: '#eab308',
                2.5: '#ea580c'
              }).map(([weight, color]) => {
                const plateHeight = {
                  45: 50,
                  35: 46,
                  25: 42,
                  10: 34,
                  5: 30,
                  2.5: 26
                }[parseFloat(weight)];
                
                return (
                  <button
                    key={weight}
                    type="button"
                    onClick={() => adjustPlate(parseFloat(weight), 1)}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-white/50 transition-colors duration-150"
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
              🔄 Reset
            </Button>
            <Button
              type="button"
              variant="glass"
              size="sm"
              onClick={() => setWeight(barWeight.toString())}
              className="flex-1"
            >
              📏 Bar Only
            </Button>
          </div>
        </div>

        {/* Weight Adjustment Buttons */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-2">
            Quick Weight Adjustments:
          </label>
          <div className="grid grid-cols-6 gap-2">
            <Button
              type="button"
              variant="glass"
              size="sm"
              onClick={() => adjustWeight(-10)}
              className="text-xs"
            >
              -10
            </Button>
            <Button
              type="button"
              variant="glass"
              size="sm"
              onClick={() => adjustWeight(-5)}
              className="text-xs"
            >
              -5
            </Button>
            <Button
              type="button"
              variant="glass"
              size="sm"
              onClick={() => adjustWeight(-2.5)}
              className="text-xs"
            >
              -2.5
            </Button>
            <Button
              type="button"
              variant="glass"
              size="sm"
              onClick={() => adjustWeight(2.5)}
              className="text-xs"
            >
              +2.5
            </Button>
            <Button
              type="button"
              variant="glass"
              size="sm"
              onClick={() => adjustWeight(5)}
              className="text-xs"
            >
              +5
            </Button>
            <Button
              type="button"
              variant="glass"
              size="sm"
              onClick={() => adjustWeight(10)}
              className="text-xs"
            >
              +10
            </Button>
          </div>
        </div>

        {/* Last Workout Data */}
        {lastWorkoutData && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3">
            <p className="text-blue-800 text-sm font-medium">
              📈 Last workout (Set {previousSets.length + 1}): {lastWorkoutData.reps} reps @ {lastWorkoutData.weight} lbs
            </p>
          </div>
        )}

        {/* Suggested Weight */}
        {suggestedWeight > 0 && !weight && !lastWorkoutData && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3">
            <p className="text-blue-800 text-sm font-medium">
              💡 Suggested: {suggestedWeight} lbs (from your last set)
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
          ✅ Log Set
        </Button>
      </form>
    </Card>
  );
}