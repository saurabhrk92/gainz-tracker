import { format, startOfWeek, endOfWeek, getWeek, getYear } from 'date-fns';
import { PlateConfig, WorkoutSet } from './types';
import { PLATE_SIZES } from './constants';

// Date utilities
export function getISOWeek(date: Date): string {
  const week = getWeek(date);
  const year = getYear(date);
  return `${year}-W${week.toString().padStart(2, '0')}`;
}

export function getWeekRange(date: Date): { start: Date; end: Date } {
  return {
    start: startOfWeek(date, { weekStartsOn: 1 }),
    end: endOfWeek(date, { weekStartsOn: 1 }),
  };
}

export function formatDate(date: Date, formatStr: string = 'MMM dd, yyyy'): string {
  return format(date, formatStr);
}

// Volume calculation
export function calculateVolume(sets: Array<{ reps: number; weight: number }>): number {
  return sets.reduce((total, set) => total + (set.weight * set.reps), 0);
}

export function calculateTotalReps(sets: Array<{ reps: number; weight: number }>): number {
  return sets.reduce((total, set) => total + set.reps, 0);
}

// Plate calculation
export function calculatePlateConfig(totalWeight: number, barWeight: number = 45): PlateConfig | null {
  if (totalWeight < barWeight) return null;
  
  const weightPerSide = (totalWeight - barWeight) / 2;
  const config: PlateConfig = { 45: 0, 25: 0, 10: 0, 5: 0, 2.5: 0 };
  
  let remaining = weightPerSide;
  
  for (const size of PLATE_SIZES) {
    if (remaining >= size) {
      config[size as keyof PlateConfig] = Math.floor(remaining / size);
      remaining = remaining % size;
    }
  }
  
  // If we have a remainder, the weight can't be made with standard plates
  if (remaining > 0) return null;
  
  return config;
}

export function plateConfigToWeight(config: PlateConfig, barWeight: number = 45): number {
  const sideWeight = Object.entries(config).reduce((total, [size, count]) => {
    return total + (parseFloat(size) * count);
  }, 0);
  
  return barWeight + (sideWeight * 2);
}

// ID generation
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Local storage utilities
export function getFromLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage:`, error);
    return defaultValue;
  }
}

export function setToLocalStorage(key: string, value: any): void {
  if (typeof window === 'undefined') return;
  
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing to localStorage:`, error);
  }
}

// Progress calculations
export function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

export function calculateAverage(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
}

// Formatting utilities
export function formatWeight(weight: number, unit: 'lbs' | 'kg' = 'lbs'): string {
  return `${weight} ${unit}`;
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function formatVolume(volume: number): string {
  if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}k`;
  }
  return volume.toString();
}

// Validation utilities
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidWeight(weight: number): boolean {
  return weight > 0 && weight <= 1000; // Max 1000 lbs
}

export function isValidReps(reps: number): boolean {
  return reps > 0 && reps <= 100; // Max 100 reps
}

// Class name utility (similar to clsx)
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}