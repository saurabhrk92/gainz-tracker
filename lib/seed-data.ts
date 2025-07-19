import { Exercise, WorkoutTemplate, TemplateExercise } from './types';
import { generateId } from './utils';
import { getDB } from './storage/indexedDB';

export const sampleExercises: Exercise[] = [
  {
    id: generateId(),
    name: 'Bench Press',
    muscleGroup: 'chest',
    type: 'barbell',
    barWeight: 45,
    defaultRestTime: 180,
    created: new Date(),
    lastUsed: new Date(),
  },
  {
    id: generateId(),
    name: 'Incline Dumbbell Press',
    muscleGroup: 'chest',
    type: 'dumbbell',
    dumbbellWeight: 40,
    dumbbellCount: 2,
    defaultRestTime: 120,
    created: new Date(),
    lastUsed: new Date(),
  },
  {
    id: generateId(),
    name: 'Pull-ups',
    muscleGroup: 'back',
    type: 'barbell', // Using barbell as closest option for bodyweight
    defaultRestTime: 120,
    created: new Date(),
    lastUsed: new Date(),
  },
  {
    id: generateId(),
    name: 'Barbell Rows',
    muscleGroup: 'back',
    type: 'barbell',
    barWeight: 45,
    defaultRestTime: 150,
    created: new Date(),
    lastUsed: new Date(),
  },
  {
    id: generateId(),
    name: 'Squats',
    muscleGroup: 'legs',
    type: 'barbell',
    barWeight: 45,
    defaultRestTime: 180,
    created: new Date(),
    lastUsed: new Date(),
  },
  {
    id: generateId(),
    name: 'Deadlifts',
    muscleGroup: 'legs',
    type: 'barbell',
    barWeight: 45,
    defaultRestTime: 300,
    created: new Date(),
    lastUsed: new Date(),
  },
];

export async function seedSampleData() {
  try {
    const db = await getDB();
    
    // Check if data already exists
    const existingExercises = await db.getExercises();
    if (existingExercises.length > 0) {
      console.log('Sample data already exists');
      return;
    }
    
    // Add sample exercises
    for (const exercise of sampleExercises) {
      await db.createExercise(exercise);
    }
    
    // Create sample templates
    const pushTemplate: WorkoutTemplate = {
      id: generateId(),
      name: 'Push Day - Chest Focus',
      muscleGroup: 'chest',
      day: 'monday',
      exercises: [
        {
          exerciseId: sampleExercises[0].id, // Bench Press
          targetSets: 4,
          order: 1,
          lastWeights: [135, 155, 175, 185],
        },
        {
          exerciseId: sampleExercises[1].id, // Incline Dumbbell Press
          targetSets: 3,
          order: 2,
          lastWeights: [40, 40, 35],
        },
      ] as TemplateExercise[],
      isActive: true,
      created: new Date(),
      lastUsed: new Date(),
    };
    
    const pullTemplate: WorkoutTemplate = {
      id: generateId(),
      name: 'Pull Day - Back Focus',
      muscleGroup: 'back',
      day: 'wednesday',
      exercises: [
        {
          exerciseId: sampleExercises[2].id, // Pull-ups
          targetSets: 3,
          order: 1,
          lastWeights: [0, 0, 0], // Bodyweight
        },
        {
          exerciseId: sampleExercises[3].id, // Barbell Rows
          targetSets: 4,
          order: 2,
          lastWeights: [95, 115, 135, 145],
        },
      ] as TemplateExercise[],
      isActive: true,
      created: new Date(),
      lastUsed: new Date(),
    };
    
    const legTemplate: WorkoutTemplate = {
      id: generateId(),
      name: 'Leg Day - Power',
      muscleGroup: 'legs',
      day: 'friday',
      exercises: [
        {
          exerciseId: sampleExercises[4].id, // Squats
          targetSets: 4,
          order: 1,
          lastWeights: [135, 185, 205, 225],
        },
        {
          exerciseId: sampleExercises[5].id, // Deadlifts
          targetSets: 3,
          order: 2,
          lastWeights: [185, 225, 245],
        },
      ] as TemplateExercise[],
      isActive: true,
      created: new Date(),
      lastUsed: new Date(),
    };
    
    await db.createTemplate(pushTemplate);
    await db.createTemplate(pullTemplate);
    await db.createTemplate(legTemplate);
    
    console.log('Sample data seeded successfully!');
  } catch (error) {
    console.error('Failed to seed sample data:', error);
  }
}