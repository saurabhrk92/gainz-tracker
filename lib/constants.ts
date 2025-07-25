import { MuscleGroup } from './types';

export const MUSCLE_GROUPS: Record<MuscleGroup, { label: string; icon: string; color: string }> = {
  chest: { label: 'Chest', icon: 'chest', color: '#ff7c7c' },
  back: { label: 'Back', icon: 'back', color: '#8dd1e1' },
  shoulders: { label: 'Shoulders', icon: 'shoulders', color: '#d084d0' },
  arms: { label: 'Arms', icon: 'arms', color: '#ffb347' },
  legs: { label: 'Legs', icon: 'legs', color: '#82ca9d' },
  glutes: { label: 'Glutes', icon: 'glutes', color: '#ff9999' },
  core: { label: 'Core', icon: 'core', color: '#ffd93d' },
  calves: { label: 'Calves', icon: 'calves', color: '#a8c3ff' },
};

export const WEEK_DAYS = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
  { value: 'routine', label: 'Routine (Any Day)' },
] as const;

export const EQUIPMENT_TYPES = [
  { value: 'barbell', label: 'Barbell', icon: 'barbell' },
  { value: 'dumbbell', label: 'Dumbbell', icon: 'dumbbell' },
  { value: 'fixed_bar', label: 'Fixed Weight Bar', icon: 'fixed-bar' },
  { value: 'machine', label: 'Machine', icon: 'machine' },
  { value: 'bodyweight', label: 'Bodyweight', icon: 'bodyweight' },
  { value: 'cable', label: 'Cable', icon: 'cable' },
] as const;

export const BAR_WEIGHTS = [
  { value: 45, label: '45 lbs (Olympic)' },
  { value: 35, label: '35 lbs (Women\'s)' },
] as const;

// Generate dumbbell weights from 2.5 to 150 in increments of 2.5
export const DUMBBELL_WEIGHTS = Array.from({ length: 60 }, (_, i) => (i + 1) * 2.5);

// Generate fixed bar weights from 5 to 200 in increments of 5
export const FIXED_BAR_WEIGHTS = Array.from({ length: 40 }, (_, i) => (i + 1) * 5);

// Generate bodyweight weights from 0 to 200 in increments of 5
export const BODYWEIGHT_WEIGHTS = Array.from({ length: 41 }, (_, i) => i * 5);

export const PLATE_SIZES = [45, 25, 10, 5, 2.5] as const;

export const REST_TIME_PRESETS = [
  { value: 60, label: '1 min' },
  { value: 90, label: '1.5 min' },
  { value: 120, label: '2 min' },
  { value: 180, label: '3 min' },
  { value: 300, label: '5 min' },
] as const;

export const CHART_COLORS = {
  volume: '#8884d8',
  weight: '#82ca9d',
  sets: '#ffc658',
  workouts: '#ff7c7c',
};

export const TIME_RANGES = [
  { value: 4, label: '4 Weeks' },
  { value: 12, label: '12 Weeks' },
  { value: 26, label: '26 Weeks' },
  { value: 52, label: '1 Year' },
] as const;

export const DB_NAME = 'WeightliftingTracker';
export const DB_VERSION = 2;

export const GOOGLE_DRIVE_FILE_NAME = 'weightlifting_data.csv';
export const GOOGLE_DRIVE_FOLDER_NAME = 'WeightLiftingTracker';

export const LOCAL_STORAGE_KEYS = {
  AUTH_TOKEN: 'wlt_auth_token',
  USER_PREFERENCES: 'wlt_user_preferences',
  ACTIVE_WORKOUT: 'wlt_active_workout',
} as const;