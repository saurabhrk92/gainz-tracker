'use client';

import { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { WorkoutSession, Exercise } from '@/lib/types';
import { getDB } from '@/lib/storage/indexedDB';
import { formatDate } from '@/lib/utils';
import { OneRepMaxCalculator, OneRepMaxData, SetData } from '@/lib/oneRepMaxCalculator';
import { MUSCLE_GROUPS } from '@/lib/constants';
import { MuscleGroupIcon } from '../components/ui/Icon';

export default function ProgressPage() {
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'month' | 'year'>('month');
  const [viewMode, setViewMode] = useState<'1rm' | 'actual'>('1rm');
  const [oneRMData, setOneRMData] = useState<OneRepMaxData[]>([]);
  const [actualMaxData, setActualMaxData] = useState<{ exerciseId: string; exerciseName: string; maxWeight: number; reps: number; date: Date }[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<OneRepMaxData | null>(null);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [exerciseProgressionData, setExerciseProgressionData] = useState<Map<string, OneRepMaxData[]>>(new Map());
  const [exerciseVolumeData, setExerciseVolumeData] = useState<Map<string, {date: Date; volume: number}[]>>(new Map());

  useEffect(() => {
    loadProgressData();
  }, [timeRange]);

  const loadProgressData = async () => {
    try {
      const db = await getDB();
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      const workoutData = await db.getWorkouts(startDate, endDate);
      const exerciseData = await db.getExercises();
      
      setWorkouts(workoutData.filter(w => w.status === 'completed'));
      setExercises(exerciseData);
      
      // Calculate 1RM and actual max data
      await calculate1RMData(workoutData.filter(w => w.status === 'completed'), exerciseData);
      
    } catch (error) {
      console.error('Failed to load progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculate1RMData = async (workouts: WorkoutSession[], exercises: Exercise[]) => {
    const exerciseMap = new Map(exercises.map(ex => [ex.id, ex]));
    const exerciseSetsMap = new Map<string, SetData[]>();
    const actualMaxMap = new Map<string, { maxWeight: number; reps: number; date: Date }>();

    // Process all sets from workouts
    workouts.forEach(workout => {
      workout.exercises.forEach(sessionEx => {
        const exercise = exerciseMap.get(sessionEx.exerciseId);
        if (!exercise) return;

        sessionEx.sets.forEach(set => {
          // Add to sets for 1RM calculation
          if (!exerciseSetsMap.has(sessionEx.exerciseId)) {
            exerciseSetsMap.set(sessionEx.exerciseId, []);
          }
          exerciseSetsMap.get(sessionEx.exerciseId)!.push({
            reps: set.reps,
            weight: set.weight,
            date: new Date(workout.date)
          });

          // Track actual max weights
          const existing = actualMaxMap.get(sessionEx.exerciseId);
          if (!existing || set.weight > existing.maxWeight) {
            actualMaxMap.set(sessionEx.exerciseId, {
              maxWeight: set.weight,
              reps: set.reps,
              date: new Date(workout.date)
            });
          }
        });
      });
    });

    // Calculate 1RM data for each exercise
    const oneRMResults: OneRepMaxData[] = [];
    const actualMaxResults: { exerciseId: string; exerciseName: string; maxWeight: number; reps: number; date: Date }[] = [];

    exerciseSetsMap.forEach((sets, exerciseId) => {
      const exercise = exerciseMap.get(exerciseId);
      if (!exercise) return;

      // Calculate 1RM
      const oneRMData = OneRepMaxCalculator.findBest1RM(sets, exercise.name, exerciseId);
      if (oneRMData) {
        oneRMResults.push(oneRMData);
      }

      // Get actual max
      const actualMax = actualMaxMap.get(exerciseId);
      if (actualMax) {
        actualMaxResults.push({
          exerciseId,
          exerciseName: exercise.name,
          ...actualMax
        });
      }
    });

    // Sort by 1RM/weight descending
    oneRMResults.sort((a, b) => b.oneRM - a.oneRM);
    actualMaxResults.sort((a, b) => b.maxWeight - a.maxWeight);

    setOneRMData(oneRMResults);
    setActualMaxData(actualMaxResults);
    
    // Calculate week-to-week progression for each exercise (filtered by time range)
    const progressionMap = new Map<string, OneRepMaxData[]>();
    exerciseSetsMap.forEach((sets, exerciseId) => {
      const exercise = exerciseMap.get(exerciseId);
      if (!exercise) return;
      
      const progression = OneRepMaxCalculator.calculate1RMProgression(sets, exercise.name, exerciseId);
      if (progression.length > 0) {
        progressionMap.set(exerciseId, progression);
      }
    });
    
    setExerciseProgressionData(progressionMap);
    
    // Calculate volume progression for each exercise
    const volumeMap = new Map<string, {date: Date; volume: number}[]>();
    const exerciseVolumeByWeek = new Map<string, Map<string, number>>();
    
    workouts.forEach(workout => {
      workout.exercises.forEach(sessionEx => {
        const exercise = exerciseMap.get(sessionEx.exerciseId);
        if (!exercise) return;
        
        const workoutVolume = sessionEx.sets.reduce((total, set) => total + (set.reps * set.weight), 0);
        
        if (!exerciseVolumeByWeek.has(sessionEx.exerciseId)) {
          exerciseVolumeByWeek.set(sessionEx.exerciseId, new Map());
        }
        
        const weekKey = getWeekKey(new Date(workout.date));
        const existingVolume = exerciseVolumeByWeek.get(sessionEx.exerciseId)!.get(weekKey) || 0;
        exerciseVolumeByWeek.get(sessionEx.exerciseId)!.set(weekKey, existingVolume + workoutVolume);
      });
    });
    
    // Convert to volume progression data
    exerciseVolumeByWeek.forEach((weeklyVolumes, exerciseId) => {
      const volumeProgression = Array.from(weeklyVolumes.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([weekKey, volume]) => ({
          date: getDateFromWeekKey(weekKey),
          volume
        }));
      
      if (volumeProgression.length > 0) {
        volumeMap.set(exerciseId, volumeProgression);
      }
    });
    
    setExerciseVolumeData(volumeMap);
  };
  
  // Helper functions for week handling
  const getWeekKey = (date: Date): string => {
    const year = date.getFullYear();
    const week = getWeekNumber(date);
    return `${year}-${week.toString().padStart(2, '0')}`;
  };
  
  const getWeekNumber = (date: Date): number => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };
  
  const getDateFromWeekKey = (weekKey: string): Date => {
    const [year, week] = weekKey.split('-').map(Number);
    const firstDayOfYear = new Date(year, 0, 1);
    const daysToAdd = (week - 1) * 7;
    return new Date(firstDayOfYear.getTime() + daysToAdd * 86400000);
  };


  const openExerciseModal = (data: OneRepMaxData) => {
    setSelectedExercise(data);
    setShowExerciseModal(true);
  };

  // Enhanced Line Chart Component with Error Bars
  const SimpleLineChart = ({ 
    data, 
    color = '#8B5CF6', 
    height = 160,
    formatValue = (v: number) => v.toString(),
    showTimeRange = timeRange,
    showErrorBars = false
  }: { 
    data: { date: Date; value: number; min?: number; max?: number; average?: number }[]; 
    color?: string; 
    height?: number;
    formatValue?: (value: number) => string;
    showTimeRange?: 'month' | 'year';
    showErrorBars?: boolean;
  }) => {
    if (data.length < 2) return null;

    // Calculate range including error bars if present
    const allValues = data.flatMap(d => {
      const values = [d.value];
      if (showErrorBars && d.min !== undefined && d.max !== undefined) {
        values.push(d.min, d.max);
      }
      return values;
    });
    
    const maxValue = Math.max(...allValues);
    const minValue = Math.min(...allValues);
    const range = maxValue - minValue || 1;
    const width = 320;
    const leftPadding = 55; // More space for Y-axis labels
    const rightPadding = 15;
    const topPadding = 20;
    const bottomPadding = 40; // More space for X-axis labels

    // Calculate Y-axis tick values
    const getYTicks = () => {
      const step = range / 4;
      return [
        minValue,
        minValue + step,
        minValue + step * 2,
        minValue + step * 3,
        maxValue
      ].map(v => Math.round(v));
    };

    const yTicks = getYTicks();

    const points = data.map((d, i) => {
      const x = leftPadding + (i / (data.length - 1)) * (width - leftPadding - rightPadding);
      const y = height - bottomPadding - ((d.value - minValue) / range) * (height - topPadding - bottomPadding);
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <svg width={width} height={height} className="w-full">
          {/* Horizontal grid lines */}
          {yTicks.map((tickValue, i) => {
            const y = height - bottomPadding - ((tickValue - minValue) / range) * (height - topPadding - bottomPadding);
            return (
              <g key={i}>
                <line
                  x1={leftPadding}
                  y1={y}
                  x2={width - rightPadding}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                  strokeDasharray={i === 0 || i === yTicks.length - 1 ? "none" : "2,2"}
                />
                {/* Y-axis labels */}
                <text
                  x={leftPadding - 8}
                  y={y + 4}
                  fontSize="11"
                  fill="#6b7280"
                  textAnchor="end"
                  fontWeight="500"
                >
                  {formatValue(tickValue)}
                </text>
              </g>
            );
          })}

          {/* Vertical grid lines for each data point */}
          {data.map((d, i) => {
            const x = leftPadding + (i / (data.length - 1)) * (width - leftPadding - rightPadding);
            return (
              <line
                key={i}
                x1={x}
                y1={topPadding}
                x2={x}
                y2={height - bottomPadding}
                stroke="#f3f4f6"
                strokeWidth="1"
              />
            );
          })}
          
          {/* Main line */}
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
          
          {/* Error bars (if enabled) */}
          {showErrorBars && data.map((d, i) => {
            if (d.min === undefined || d.max === undefined) return null;
            
            const x = leftPadding + (i / (data.length - 1)) * (width - leftPadding - rightPadding);
            const minY = height - bottomPadding - ((d.min - minValue) / range) * (height - topPadding - bottomPadding);
            const maxY = height - bottomPadding - ((d.max - minValue) / range) * (height - topPadding - bottomPadding);
            const avgY = d.average ? height - bottomPadding - ((d.average - minValue) / range) * (height - topPadding - bottomPadding) : null;
            
            return (
              <g key={`error-${i}`}>
                {/* Error bar line */}
                <line
                  x1={x}
                  y1={minY}
                  x2={x}
                  y2={maxY}
                  stroke={color}
                  strokeWidth="2"
                  opacity="0.6"
                />
                {/* Min cap */}
                <line
                  x1={x - 4}
                  y1={minY}
                  x2={x + 4}
                  y2={minY}
                  stroke={color}
                  strokeWidth="2"
                  opacity="0.6"
                />
                {/* Max cap */}
                <line
                  x1={x - 4}
                  y1={maxY}
                  x2={x + 4}
                  y2={maxY}
                  stroke={color}
                  strokeWidth="2"
                  opacity="0.6"
                />
                {/* Average point (if different from main value) */}
                {avgY && d.average !== d.value && (
                  <circle
                    cx={x}
                    cy={avgY}
                    r="3"
                    fill="white"
                    stroke={color}
                    strokeWidth="2"
                    opacity="0.8"
                  />
                )}
              </g>
            );
          })}

          {/* Data points */}
          {data.map((d, i) => {
            const x = leftPadding + (i / (data.length - 1)) * (width - leftPadding - rightPadding);
            const y = height - bottomPadding - ((d.value - minValue) / range) * (height - topPadding - bottomPadding);
            return (
              <g key={i}>
                <circle
                  cx={x}
                  cy={y}
                  r="5"
                  fill={color}
                  stroke="white"
                  strokeWidth="2"
                />
                {/* Value labels on hover */}
                <text
                  x={x}
                  y={y - 15}
                  fontSize="10"
                  fill={color}
                  textAnchor="middle"
                  fontWeight="600"
                  className="opacity-0 hover:opacity-100 transition-opacity"
                >
                  {formatValue(d.value)}
                  {showErrorBars && d.min !== undefined && d.max !== undefined && (
                    <tspan x={x} dy="12" fontSize="9" fill="#6b7280">
                      {formatValue(d.min)}-{formatValue(d.max)}
                    </tspan>
                  )}
                </text>
              </g>
            );
          })}

          {/* Y-axis line */}
          <line
            x1={leftPadding}
            y1={topPadding}
            x2={leftPadding}
            y2={height - bottomPadding}
            stroke="#6b7280"
            strokeWidth="2"
          />

          {/* X-axis line */}
          <line
            x1={leftPadding}
            y1={height - bottomPadding}
            x2={width - rightPadding}
            y2={height - bottomPadding}
            stroke="#6b7280"
            strokeWidth="2"
          />
        </svg>
        
        {/* X-axis date labels */}
        <div className="flex justify-between mt-1" style={{ paddingLeft: `${leftPadding}px`, paddingRight: `${rightPadding}px` }}>
          {data.map((d, i) => (
            <div key={i} className="text-xs text-gray-600 font-medium text-center" style={{ minWidth: '50px' }}>
              <div>{formatDate(d.date, showTimeRange === 'month' ? 'MMM d' : 'MMM')}</div>
              {showTimeRange === 'year' && (
                <div className="text-gray-400">{formatDate(d.date, 'yyyy')}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="pt-12 pb-8">
        <h1 className="text-2xl font-bold text-black">Progress Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">Track your fitness journey</p>
      </div>

      {/* Time Range Selector */}
      <div className="mb-6">
        <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
          {(['month', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`flex-1 py-2 px-3 rounded-md font-medium transition-all duration-200 text-sm ${
                timeRange === range
                  ? 'bg-white text-black shadow-sm'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* 1RM vs Actual Toggle */}
      <div className="mb-6">
        <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('1rm')}
            className={`flex-1 py-2 px-3 rounded-md font-medium transition-all duration-200 text-sm ${
              viewMode === '1rm'
                ? 'bg-white text-black shadow-sm'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            1RM Estimates
          </button>
          <button
            onClick={() => setViewMode('actual')}
            className={`flex-1 py-2 px-3 rounded-md font-medium transition-all duration-200 text-sm ${
              viewMode === 'actual'
                ? 'bg-white text-black shadow-sm'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            Actual Maxes
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="space-y-6">
        {/* Exercise Charts - Swipeable */}
        {(() => {
          const currentData = viewMode === '1rm' ? oneRMData : actualMaxData.map(d => ({
            exerciseId: d.exerciseId,
            exerciseName: d.exerciseName,
            oneRM: d.maxWeight,
            isActual: true,
            calculationMethod: `${d.reps} rep max`,
            sourceWeight: d.maxWeight,
            sourceReps: d.reps,
            date: d.date,
            confidence: 'high' as const
          }));
          
          if (currentData.length === 0) {
            return (
              <Card className="text-center py-12">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-lg font-bold text-black mb-2">No data yet</h3>
                <p className="text-gray-600 text-sm">Complete workouts to see your progress charts!</p>
              </Card>
            );
          }
          
          const currentExercise = currentData[currentExerciseIndex] || currentData[0];
          const progression = exerciseProgressionData.get(currentExercise.exerciseId) || [];
          const volumeProgression = exerciseVolumeData.get(currentExercise.exerciseId) || [];
          
          // Get the correct progression data based on view mode
          const strengthProgressionData = (() => {
            if (viewMode === 'actual') {
              // For actual view, create progression from actual max weights
              // Use the same progression timeline but with actual max weights
              const displayData = timeRange === 'month' 
                ? progression.slice(-4)
                : progression.slice(-12);
              
              return displayData.map((d, i) => ({
                date: d.date,
                value: d.sourceWeight // Use source weight as "actual" for demonstration
              }));
            } else {
              // For 1RM view, use the progression data with error bars
              const displayData = timeRange === 'month' 
                ? progression.slice(-4)
                : progression.slice(-12);
              return displayData.map(d => ({
                date: d.date,
                value: d.oneRM,
                min: d.min,
                max: d.max,
                average: d.average
              }));
            }
          })();
          const exercise = exercises.find(ex => ex.id === currentExercise.exerciseId);
          const muscleGroupInfo = exercise ? MUSCLE_GROUPS[exercise.muscleGroup] : MUSCLE_GROUPS.chest;
          
          return (
            <Card>
              <div className="space-y-4">
                {/* Exercise Navigation Header */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setCurrentExerciseIndex(Math.max(0, currentExerciseIndex - 1))}
                    disabled={currentExerciseIndex === 0}
                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
                  >
                    ←
                  </button>
                  
                  <div className="flex-1 text-center">
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: muscleGroupInfo.color }}>
                        <MuscleGroupIcon name={muscleGroupInfo.icon as any} size={16} color="white" />
                      </div>
                      <h2 className="text-lg font-bold text-black">{currentExercise.exerciseName}</h2>
                    </div>
                    <p className="text-sm text-gray-500">
                      Exercise {currentExerciseIndex + 1} of {currentData.length}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => setCurrentExerciseIndex(Math.min(currentData.length - 1, currentExerciseIndex + 1))}
                    disabled={currentExerciseIndex === currentData.length - 1}
                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
                  >
                    →
                  </button>
                </div>
                
                {/* Current Best */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-1">
                    {viewMode === '1rm' ? currentExercise.oneRM : currentExercise.sourceWeight} lbs
                  </div>
                  <div className="text-sm text-gray-600">
                    {viewMode === '1rm' 
                      ? (currentExercise.isActual ? '🎯 Actual 1RM' : '📊 Estimated 1RM')
                      : `${currentExercise.sourceReps} Rep Max`
                    }
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatDate(currentExercise.date, 'MMM d, yyyy')}
                  </div>
                </div>
                
                {/* 1RM/Strength Progress Chart */}
                {strengthProgressionData.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-md font-semibold text-black">
                        {viewMode === '1rm' ? 'Strength Progress (1RM)' : 'Max Weight Progress'}
                      </h3>
                      {viewMode === '1rm' && currentExercise && (
                        <div className="group relative">
                          <div className="w-4 h-4 rounded-full bg-gray-300 flex items-center justify-center cursor-help">
                            <span className="text-xs text-gray-600">ℹ️</span>
                          </div>
                          <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                            <div className="font-medium">Predicted from working sets</div>
                            <div>Confidence: {currentExercise.confidence}</div>
                            <div className="text-gray-300 mt-1">Error bars show min/max across:</div>
                            <div className="text-gray-300">Epley • Brzycki • Lander • Lombardi</div>
                            <div className="text-gray-300 mt-1">Note: 1RM sets are ignored for prediction</div>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                          </div>
                        </div>
                      )}
                    </div>
                    <SimpleLineChart
                      data={strengthProgressionData}
                      color="#8B5CF6"
                      formatValue={(v) => `${v} lbs`}
                      showErrorBars={viewMode === '1rm'}
                    />
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <div className="text-2xl mb-2">📈</div>
                    <p className="text-sm">More data needed for progression chart</p>
                  </div>
                )}
                
                {/* Volume Chart */}
                {volumeProgression.length > 1 ? (
                  <div className="space-y-3">
                    <h3 className="text-md font-semibold text-black">
                      {timeRange === 'month' ? 'Weekly Volume' : 'Monthly Volume'}
                    </h3>
                    <SimpleLineChart
                      data={(() => {
                        const displayVolumeData = timeRange === 'month' 
                          ? volumeProgression.slice(-4)  // Last 4 weeks for month view
                          : volumeProgression.slice(-12); // Last 12 months for year view
                        
                        return displayVolumeData.map(d => ({
                          date: d.date,
                          value: d.volume
                        }));
                      })()}
                      color="#10B981"
                      formatValue={(v) => v >= 1000 ? `${(v/1000).toFixed(1)}k lbs` : `${v} lbs`}
                    />
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <div className="text-2xl mb-2">📊</div>
                    <p className="text-sm">More data needed for volume chart</p>
                  </div>
                )}
              </div>
            </Card>
          );
        })()}

      </main>

      {/* Exercise Detail Modal */}
      <Modal
        isOpen={showExerciseModal}
        onClose={() => setShowExerciseModal(false)}
        title="1RM Calculation Details"
        size="lg"
      >
        {selectedExercise && (
          <div className="space-y-6">
            {/* Exercise Header */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-2">
                {(() => {
                  const exercise = exercises.find(ex => ex.id === selectedExercise.exerciseId);
                  const muscleGroupInfo = exercise ? MUSCLE_GROUPS[exercise.muscleGroup] : MUSCLE_GROUPS.chest;
                  return (
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: muscleGroupInfo.color }}>
                      <MuscleGroupIcon name={muscleGroupInfo.icon as any} size={24} color="white" />
                    </div>
                  );
                })()}
                <h3 className="text-xl font-bold">{selectedExercise.exerciseName}</h3>
              </div>
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {selectedExercise.oneRM} lbs
              </div>
              <div className="text-lg text-gray-600">
                {selectedExercise.isActual ? '🎯 Actual 1RM' : '📊 Estimated 1RM'}
              </div>
            </div>

            {/* Calculation Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-bold text-black mb-3">Calculation Details</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Source Data:</span>
                  <span className="font-medium">
                    {selectedExercise.sourceReps} reps @ {selectedExercise.sourceWeight} lbs
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Method:</span>
                  <span className="font-medium">{selectedExercise.calculationMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Confidence:</span>
                  <span className={`font-medium ${
                    selectedExercise.confidence === 'high' ? 'text-green-600' :
                    selectedExercise.confidence === 'medium' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {selectedExercise.confidence.charAt(0).toUpperCase() + selectedExercise.confidence.slice(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date Achieved:</span>
                  <span className="font-medium">{formatDate(selectedExercise.date, 'MMM d, yyyy')}</span>
                </div>
              </div>
            </div>

            {/* Formula Explanation */}
            {!selectedExercise.isActual && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-bold text-blue-800 mb-2">How We Calculated This</h4>
                <p className="text-blue-700 text-sm">
                  {selectedExercise.calculationMethod.includes('Epley') && 
                    "Using the Epley formula: weight × (1 + 0.0333 × reps). This formula is highly accurate for rep ranges 2-5 and commonly used in powerlifting."
                  }
                  {selectedExercise.calculationMethod.includes('Brzycki') && 
                    "Using the Brzycki formula: weight × (36 / (37 - reps)). This formula excels in the 6-10 rep range with typical accuracy within 5%."
                  }
                  {selectedExercise.calculationMethod.includes('Lander') && 
                    "Using the Lander formula: (100 × weight) / (101.3 - 2.67123 × reps). This research-based formula works well across different lift types."
                  }
                  {selectedExercise.calculationMethod.includes('Lombardi') && 
                    "Using the Lombardi formula: weight × reps^0.1. This formula is designed for higher rep ranges where other formulas become less accurate."
                  }
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={() => setShowExerciseModal(false)}
                variant="secondary"
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}