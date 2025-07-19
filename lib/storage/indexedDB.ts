import { 
  Exercise, 
  WorkoutTemplate, 
  WorkoutSession, 
  MuscleGroup, 
  WeekDay,
  SyncMetadata 
} from '../types';
import { DB_NAME, DB_VERSION } from '../constants';

export class IndexedDBService {
  private db: IDBDatabase | null = null;
  private readonly dbName = DB_NAME;
  private readonly version = DB_VERSION;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create exercises object store
        if (!db.objectStoreNames.contains('exercises')) {
          const exerciseStore = db.createObjectStore('exercises', { keyPath: 'id' });
          exerciseStore.createIndex('muscleGroup', 'muscleGroup');
          exerciseStore.createIndex('lastUsed', 'lastUsed');
          exerciseStore.createIndex('name', 'name');
        }
        
        // Create templates object store
        if (!db.objectStoreNames.contains('templates')) {
          const templateStore = db.createObjectStore('templates', { keyPath: 'id' });
          templateStore.createIndex('day', 'day');
          templateStore.createIndex('muscleGroup', 'muscleGroup');
          templateStore.createIndex('isActive', 'isActive');
        }
        
        // Create workouts object store
        if (!db.objectStoreNames.contains('workouts')) {
          const workoutStore = db.createObjectStore('workouts', { keyPath: 'id' });
          workoutStore.createIndex('date', 'date');
          workoutStore.createIndex('templateId', 'templateId');
          workoutStore.createIndex('status', 'status');
        }
        
        // Create sync metadata object store
        if (!db.objectStoreNames.contains('sync_meta')) {
          db.createObjectStore('sync_meta', { keyPath: 'key' });
        }
      };
    });
  }

  private ensureDb(): void {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }
  }

  // Exercise operations
  async createExercise(exercise: Exercise): Promise<void> {
    this.ensureDb();
    const transaction = this.db!.transaction(['exercises'], 'readwrite');
    const store = transaction.objectStore('exercises');
    await this.promisifyRequest(store.add(exercise));
  }

  async getExercises(): Promise<Exercise[]> {
    this.ensureDb();
    const transaction = this.db!.transaction(['exercises'], 'readonly');
    const store = transaction.objectStore('exercises');
    const exercises = await this.promisifyRequest(store.getAll());
    return exercises;
  }

  async getExerciseById(id: string): Promise<Exercise | null> {
    this.ensureDb();
    const transaction = this.db!.transaction(['exercises'], 'readonly');
    const store = transaction.objectStore('exercises');
    const exercise = await this.promisifyRequest(store.get(id));
    return exercise || null;
  }

  async getExercisesByMuscleGroup(muscleGroup: MuscleGroup): Promise<Exercise[]> {
    this.ensureDb();
    const transaction = this.db!.transaction(['exercises'], 'readonly');
    const store = transaction.objectStore('exercises');
    const index = store.index('muscleGroup');
    const exercises = await this.promisifyRequest(index.getAll(muscleGroup));
    return exercises;
  }

  async updateExercise(id: string, updates: Partial<Exercise>): Promise<void> {
    this.ensureDb();
    const transaction = this.db!.transaction(['exercises'], 'readwrite');
    const store = transaction.objectStore('exercises');
    const exercise = await this.promisifyRequest(store.get(id));
    
    if (!exercise) {
      throw new Error(`Exercise with id ${id} not found`);
    }
    
    const updatedExercise = { ...exercise, ...updates };
    await this.promisifyRequest(store.put(updatedExercise));
  }

  async deleteExercise(id: string): Promise<void> {
    this.ensureDb();
    const transaction = this.db!.transaction(['exercises'], 'readwrite');
    const store = transaction.objectStore('exercises');
    await this.promisifyRequest(store.delete(id));
  }

  // Template operations
  async createTemplate(template: WorkoutTemplate): Promise<void> {
    this.ensureDb();
    const transaction = this.db!.transaction(['templates'], 'readwrite');
    const store = transaction.objectStore('templates');
    await this.promisifyRequest(store.add(template));
  }

  async getTemplates(): Promise<WorkoutTemplate[]> {
    this.ensureDb();
    const transaction = this.db!.transaction(['templates'], 'readonly');
    const store = transaction.objectStore('templates');
    const templates = await this.promisifyRequest(store.getAll());
    return templates;
  }

  async getTemplateById(id: string): Promise<WorkoutTemplate | null> {
    this.ensureDb();
    const transaction = this.db!.transaction(['templates'], 'readonly');
    const store = transaction.objectStore('templates');
    const template = await this.promisifyRequest(store.get(id));
    return template || null;
  }

  async getTemplateByDay(day: WeekDay): Promise<WorkoutTemplate | null> {
    this.ensureDb();
    const transaction = this.db!.transaction(['templates'], 'readonly');
    const store = transaction.objectStore('templates');
    const index = store.index('day');
    const templates = await this.promisifyRequest(index.getAll(day));
    
    // Return the active template for the day, or the first one if none are active
    const activeTemplate = templates.find(t => t.isActive);
    return activeTemplate || templates[0] || null;
  }

  async updateTemplate(id: string, updates: Partial<WorkoutTemplate>): Promise<void> {
    this.ensureDb();
    const transaction = this.db!.transaction(['templates'], 'readwrite');
    const store = transaction.objectStore('templates');
    const template = await this.promisifyRequest(store.get(id));
    
    if (!template) {
      throw new Error(`Template with id ${id} not found`);
    }
    
    const updatedTemplate = { ...template, ...updates };
    await this.promisifyRequest(store.put(updatedTemplate));
  }

  async deleteTemplate(id: string): Promise<void> {
    this.ensureDb();
    const transaction = this.db!.transaction(['templates'], 'readwrite');
    const store = transaction.objectStore('templates');
    await this.promisifyRequest(store.delete(id));
  }

  // Workout operations
  async createWorkout(workout: WorkoutSession): Promise<void> {
    this.ensureDb();
    const transaction = this.db!.transaction(['workouts'], 'readwrite');
    const store = transaction.objectStore('workouts');
    await this.promisifyRequest(store.add(workout));
  }

  async getWorkouts(startDate?: Date, endDate?: Date): Promise<WorkoutSession[]> {
    this.ensureDb();
    const transaction = this.db!.transaction(['workouts'], 'readonly');
    const store = transaction.objectStore('workouts');
    const allWorkouts = await this.promisifyRequest(store.getAll());
    
    if (!startDate && !endDate) {
      return allWorkouts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    
    return allWorkouts.filter(workout => {
      const workoutDate = new Date(workout.date);
      if (startDate && workoutDate < startDate) return false;
      if (endDate && workoutDate > endDate) return false;
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getLastWorkoutForExercise(exerciseId: string): Promise<WorkoutSession | null> {
    this.ensureDb();
    const workouts = await this.getWorkouts();
    
    // Find the most recent completed workout that contains this exercise
    const workoutWithExercise = workouts.find(workout => 
      workout.status === 'completed' && 
      workout.exercises.some(ex => ex.exerciseId === exerciseId && ex.sets.length > 0)
    );
    
    return workoutWithExercise || null;
  }

  async getWorkoutById(id: string): Promise<WorkoutSession | null> {
    this.ensureDb();
    const transaction = this.db!.transaction(['workouts'], 'readonly');
    const store = transaction.objectStore('workouts');
    const workout = await this.promisifyRequest(store.get(id));
    return workout || null;
  }

  async getActiveWorkout(): Promise<WorkoutSession | null> {
    this.ensureDb();
    const transaction = this.db!.transaction(['workouts'], 'readonly');
    const store = transaction.objectStore('workouts');
    const index = store.index('status');
    const workouts = await this.promisifyRequest(index.getAll('in_progress'));
    return workouts[0] || null;
  }

  async updateWorkout(id: string, updates: Partial<WorkoutSession>): Promise<void> {
    this.ensureDb();
    const transaction = this.db!.transaction(['workouts'], 'readwrite');
    const store = transaction.objectStore('workouts');
    const workout = await this.promisifyRequest(store.get(id));
    
    if (!workout) {
      throw new Error(`Workout with id ${id} not found`);
    }
    
    const updatedWorkout = { ...workout, ...updates };
    await this.promisifyRequest(store.put(updatedWorkout));
  }

  async deleteWorkout(id: string): Promise<void> {
    this.ensureDb();
    const transaction = this.db!.transaction(['workouts'], 'readwrite');
    const store = transaction.objectStore('workouts');
    await this.promisifyRequest(store.delete(id));
  }

  // Sync operations
  async getSyncMeta(): Promise<SyncMetadata | null> {
    this.ensureDb();
    const transaction = this.db!.transaction(['sync_meta'], 'readonly');
    const store = transaction.objectStore('sync_meta');
    const meta = await this.promisifyRequest(store.get('sync_metadata'));
    return meta || null;
  }

  async updateSyncMeta(meta: SyncMetadata): Promise<void> {
    this.ensureDb();
    const transaction = this.db!.transaction(['sync_meta'], 'readwrite');
    const store = transaction.objectStore('sync_meta');
    await this.promisifyRequest(store.put({ key: 'sync_metadata', ...meta }));
  }

  // Utility methods
  private promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Export all data for backup/sync
  async exportData(): Promise<{
    exercises: Exercise[];
    templates: WorkoutTemplate[];
    workouts: WorkoutSession[];
  }> {
    this.ensureDb();
    
    const exercises = await this.getExercises();
    const templates = await this.getTemplates();
    const workouts = await this.getWorkouts();
    
    return { exercises, templates, workouts };
  }

  // Import data from backup/sync
  async importData(data: {
    exercises?: Exercise[];
    templates?: WorkoutTemplate[];
    workouts?: WorkoutSession[];
  }): Promise<void> {
    this.ensureDb();
    
    if (data.exercises) {
      const transaction = this.db!.transaction(['exercises'], 'readwrite');
      const store = transaction.objectStore('exercises');
      for (const exercise of data.exercises) {
        await this.promisifyRequest(store.put(exercise));
      }
    }
    
    if (data.templates) {
      const transaction = this.db!.transaction(['templates'], 'readwrite');
      const store = transaction.objectStore('templates');
      for (const template of data.templates) {
        await this.promisifyRequest(store.put(template));
      }
    }
    
    if (data.workouts) {
      const transaction = this.db!.transaction(['workouts'], 'readwrite');
      const store = transaction.objectStore('workouts');
      for (const workout of data.workouts) {
        await this.promisifyRequest(store.put(workout));
      }
    }
  }

  // Clear all data
  async clearAll(): Promise<void> {
    this.ensureDb();
    
    const transaction = this.db!.transaction(['exercises', 'templates', 'workouts'], 'readwrite');
    
    await this.promisifyRequest(transaction.objectStore('exercises').clear());
    await this.promisifyRequest(transaction.objectStore('templates').clear());
    await this.promisifyRequest(transaction.objectStore('workouts').clear());
  }
}

// Singleton instance
let dbInstance: IndexedDBService | null = null;

export async function getDB(): Promise<IndexedDBService> {
  if (!dbInstance) {
    dbInstance = new IndexedDBService();
    await dbInstance.init();
  }
  return dbInstance;
}