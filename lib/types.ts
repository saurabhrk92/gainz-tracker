// Base Types
export type MuscleGroup = 
  | 'chest' 
  | 'back' 
  | 'shoulders' 
  | 'arms' 
  | 'legs' 
  | 'glutes' 
  | 'core' 
  | 'calves';

export type EquipmentType = 'barbell' | 'dumbbell' | 'fixed_bar' | 'machine';

export type WeekDay = 
  | 'monday' 
  | 'tuesday' 
  | 'wednesday' 
  | 'thursday' 
  | 'friday' 
  | 'saturday' 
  | 'sunday';

export interface PlateConfig {
  45: number;
  25: number;
  10: number;
  5: number;
  2.5: number;
}

// Exercise Model
export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  type: EquipmentType;
  barWeight?: number; // For barbell: 45 or 35
  dumbbellWeight?: number; // For dumbbell: 5-150 in increments of 5
  dumbbellCount?: number; // 1 or 2
  fixedBarWeight?: number; // For fixed_bar: any weight in increments of 5
  machineWeight?: number; // For machine: any custom weight
  defaultRestTime: number; // seconds
  created: Date;
  lastUsed: Date;
}

// Workout Template Model
export interface WorkoutTemplate {
  id: string;
  name: string;
  muscleGroup: MuscleGroup | 'full_body';
  day: WeekDay;
  exercises: TemplateExercise[];
  isActive: boolean;
  created: Date;
  lastUsed: Date | null;
}

export interface TemplateExercise {
  exerciseId: string;
  targetSets: number;
  targetReps: string; // e.g., "8-12" or "10"
  restTime?: number;
  order?: number;
  notes?: string;
  lastWeights?: number[];
  lastPerformed?: Date;
}

// Workout Session Model
export interface WorkoutSession {
  id: string;
  templateId: string;
  date: Date;
  status: 'in_progress' | 'completed' | 'paused';
  exercises: SessionExercise[];
  duration: number; // in seconds
  totalVolume: number;
}

export interface SessionExercise {
  exerciseId: string;
  targetSets: number;
  targetReps: string;
  completedSets: number;
  sets: Array<{ reps: number; weight: number }>;
}

export interface WorkoutSet {
  setNumber: number;
  reps: number;
  weight: number;
  plateConfig?: PlateConfig;
  dumbbellWeight?: number;
  dumbbellCount?: number;
  restTime: number;
  completedAt: Date;
}

// Progress Analytics Model
export interface WeeklyProgress {
  week: string; // ISO format "2025-W03"
  startDate: Date;
  endDate: Date;
  totalVolume: number;
  totalSets: number;
  totalReps: number;
  workoutCount: number;
  muscleGroups: Record<MuscleGroup, MuscleGroupStats>;
  exercises: Record<string, ExerciseStats>;
}

export interface MuscleGroupStats {
  volume: number;
  sets: number;
  reps: number;
  frequency: number;
}

export interface ExerciseStats {
  volume: number;
  maxWeight: number;
  avgWeight: number;
  sets: number;
  reps: number;
  frequency: number;
}

export interface ExerciseProgress {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  weeklyData: WeeklyExerciseData[];
}

export interface WeeklyExerciseData {
  week: string;
  volume: number;
  maxWeight: number;
  avgWeight: number;
  totalSets: number;
  totalReps: number;
  frequency: number;
  growthRate?: number;
}

// User Model
export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  googleId: string;
}

// Sync Metadata
export interface SyncMetadata {
  lastSyncTime: Date;
  lastSyncStatus: 'success' | 'failed' | 'pending';
  lastSyncError?: string;
  fileId?: string;
  folderId?: string;
}