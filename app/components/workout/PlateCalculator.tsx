'use client';

import { useState } from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';

interface PlateCalculatorProps {
  barWeight?: number;
  onClose?: () => void;
}

interface PlateResult {
  plateWeight: number;
  count: number;
}

export default function PlateCalculator({ barWeight = 45, onClose }: PlateCalculatorProps) {
  const [targetWeight, setTargetWeight] = useState<string>('135');
  
  // Standard gym plates (in lbs)
  const standardPlates = [45, 35, 25, 10, 5, 2.5];

  const calculatePlates = (total: number, bar: number): PlateResult[] => {
    const plateWeight = total - bar;
    if (plateWeight <= 0) return [];
    
    const perSideWeight = plateWeight / 2;
    const plates: PlateResult[] = [];
    let remaining = perSideWeight;
    
    for (const plate of standardPlates) {
      const count = Math.floor(remaining / plate);
      if (count > 0) {
        plates.push({ plateWeight: plate, count });
        remaining -= count * plate;
      }
    }
    
    return plates;
  };

  const totalWeight = parseFloat(targetWeight) || 0;
  const plates = calculatePlates(totalWeight, barWeight);
  const actualWeight = barWeight + plates.reduce((sum, p) => sum + (p.plateWeight * p.count * 2), 0);
  const weightDifference = totalWeight - actualWeight;

  const getPlateColor = (weight: number) => {
    switch (weight) {
      case 45: return 'bg-red-500';
      case 35: return 'bg-green-500';
      case 25: return 'bg-blue-500';
      case 10: return 'bg-gray-600';
      case 5: return 'bg-yellow-500';
      case 2.5: return 'bg-orange-500';
      default: return 'bg-gray-400';
    }
  };

  const getPlateEmoji = (weight: number) => {
    switch (weight) {
      case 45: return '🔴';
      case 35: return '🟢';
      case 25: return '🔵';
      case 10: return '⚫';
      case 5: return '🟡';
      case 2.5: return '🟠';
      default: return '⚪';
    }
  };

  return (
    <Card className="relative overflow-hidden">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800 font-display">🧮 Plate Calculator</h3>
          {onClose && (
            <Button variant="glass" size="sm" onClick={onClose}>
              ✕
            </Button>
          )}
        </div>

        {/* Input Section */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Target Weight (lbs)
            </label>
            <input
              type="number"
              value={targetWeight}
              onChange={(e) => setTargetWeight(e.target.value)}
              placeholder="Enter weight..."
              className="w-full p-4 bg-white/95 backdrop-blur-md rounded-2xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-lg transition-all duration-200 text-center text-2xl font-bold"
              step="2.5"
              min="0"
            />
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-gray-600">Bar Weight:</span>
              <span className="font-bold text-gray-800">{barWeight} lbs</span>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {totalWeight > 0 && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600 mb-1">
                {actualWeight} lbs
              </div>
              <div className="text-sm text-gray-600">
                {weightDifference !== 0 && (
                  <span className={weightDifference > 0 ? 'text-red-600' : 'text-orange-600'}>
                    {weightDifference > 0 ? `${weightDifference} lbs short` : `${Math.abs(weightDifference)} lbs over`}
                  </span>
                )}
                {weightDifference === 0 && (
                  <span className="text-green-600 font-semibold">Exact match! 🎯</span>
                )}
              </div>
            </div>

            {/* Plate Visualization */}
            {plates.length > 0 ? (
              <div>
                <h4 className="text-lg font-bold text-gray-800 mb-3 text-center">
                  Plates per side:
                </h4>
                
                <div className="space-y-3">
                  {plates.map((plate, index) => (
                    <div key={index} className="bg-white/80 rounded-xl p-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full ${getPlateColor(plate.plateWeight)} flex items-center justify-center text-white font-bold text-sm`}>
                            {plate.plateWeight === 2.5 ? '2.5' : plate.plateWeight}
                          </div>
                          <div>
                            <div className="font-bold text-gray-800">
                              {plate.plateWeight} lb plates
                            </div>
                            <div className="text-sm text-gray-600">
                              {plate.count} × {plate.plateWeight} = {plate.count * plate.plateWeight} lbs per side
                            </div>
                          </div>
                        </div>
                        <div className="text-2xl">
                          {getPlateEmoji(plate.plateWeight)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Visual Bar Representation */}
                <div className="mt-6">
                  <h4 className="text-lg font-bold text-gray-800 mb-3 text-center">
                    Loading order:
                  </h4>
                  <div className="bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-2xl p-4 overflow-x-auto">
                    <div className="flex items-center justify-center gap-1 min-w-max">
                      {/* Left side plates (reverse order for proper loading) */}
                      {plates.slice().reverse().map((plate, plateIndex) =>
                        Array.from({ length: plate.count }).map((_, countIndex) => (
                          <div
                            key={`left-${plateIndex}-${countIndex}`}
                            className={`w-4 h-12 ${getPlateColor(plate.plateWeight)} rounded-sm shadow-sm border border-white/50`}
                            title={`${plate.plateWeight} lb`}
                          />
                        ))
                      )}
                      
                      {/* Barbell */}
                      <div className="bg-gray-800 h-3 w-32 rounded-full mx-2 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{barWeight} lb</span>
                      </div>
                      
                      {/* Right side plates */}
                      {plates.slice().reverse().map((plate, plateIndex) =>
                        Array.from({ length: plate.count }).map((_, countIndex) => (
                          <div
                            key={`right-${plateIndex}-${countIndex}`}
                            className={`w-4 h-12 ${getPlateColor(plate.plateWeight)} rounded-sm shadow-sm border border-white/50`}
                            title={`${plate.plateWeight} lb`}
                          />
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Loading Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                  <h4 className="font-bold text-blue-800 mb-2">💡 Loading Tips:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Load heaviest plates first (closest to collars)</li>
                    <li>• Load both sides evenly to maintain balance</li>
                    <li>• Always use collars to secure plates</li>
                    <li>• Double-check your math before lifting</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🏋️</div>
                <p>Just the bar! ({barWeight} lbs)</p>
              </div>
            )}
          </div>
        )}

        {/* Quick Weight Buttons */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Quick Weights:</h4>
          <div className="grid grid-cols-4 gap-2">
            {[95, 135, 185, 225, 275, 315, 365, 405].map((weight) => (
              <Button
                key={weight}
                variant="glass"
                size="sm"
                onClick={() => setTargetWeight(weight.toString())}
                className="text-xs"
              >
                {weight}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}