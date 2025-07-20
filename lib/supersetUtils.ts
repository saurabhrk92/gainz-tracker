import { TemplateExercise } from './types';
import { generateId } from './utils';

export interface SupersetGroup {
  id: string;
  exercises: TemplateExercise[];
  restBetweenExercises: number; // Short rest between exercises in superset
  restAfterSuperset: number; // Longer rest after completing the superset
}

export interface WorkoutStructure {
  individualExercises: TemplateExercise[];
  supersets: SupersetGroup[];
}

/**
 * Groups template exercises into individual exercises and supersets
 */
export function organizeWorkoutStructure(exercises: TemplateExercise[]): WorkoutStructure {
  const supersetMap = new Map<string, TemplateExercise[]>();
  const individualExercises: TemplateExercise[] = [];
  
  // Group exercises by superset
  exercises.forEach(exercise => {
    if (exercise.supersetGroup) {
      if (!supersetMap.has(exercise.supersetGroup)) {
        supersetMap.set(exercise.supersetGroup, []);
      }
      supersetMap.get(exercise.supersetGroup)!.push(exercise);
    } else {
      individualExercises.push(exercise);
    }
  });
  
  // Convert superset map to structured format
  const supersets: SupersetGroup[] = [];
  supersetMap.forEach((exercises, groupId) => {
    // Sort exercises by their order within the superset
    const sortedExercises = exercises.sort((a, b) => 
      (a.supersetOrder || 0) - (b.supersetOrder || 0)
    );
    
    // Calculate rest times
    const restBetweenExercises = exercises[0]?.restBetweenExercises || 15; // Default 15s
    const restAfterSuperset = exercises[0]?.restTime || 120; // Default 2min
    
    supersets.push({
      id: groupId,
      exercises: sortedExercises,
      restBetweenExercises,
      restAfterSuperset
    });
  });
  
  return {
    individualExercises: individualExercises.sort((a, b) => (a.order || 0) - (b.order || 0)),
    supersets: supersets.sort((a, b) => {
      const aFirstOrder = a.exercises[0]?.order || 0;
      const bFirstOrder = b.exercises[0]?.order || 0;
      return aFirstOrder - bFirstOrder;
    })
  };
}

/**
 * Creates a new superset group from selected exercises
 */
export function createSuperset(
  exercises: TemplateExercise[], 
  restBetweenExercises: number = 15,
  restAfterSuperset: number = 120
): TemplateExercise[] {
  const supersetId = generateId();
  
  return exercises.map((exercise, index) => ({
    ...exercise,
    supersetGroup: supersetId,
    supersetOrder: index + 1,
    restBetweenExercises,
    restTime: restAfterSuperset // Rest after completing the entire superset
  }));
}

/**
 * Removes an exercise from its superset group
 */
export function removeFromSuperset(exercise: TemplateExercise): TemplateExercise {
  const { supersetGroup, supersetOrder, restBetweenExercises, ...cleanExercise } = exercise;
  return cleanExercise;
}

/**
 * Checks if exercises can be superseted together (basic validation)
 */
export function canSuperset(exercises: TemplateExercise[]): boolean {
  if (exercises.length < 2 || exercises.length > 4) {
    return false; // Supersets should be 2-4 exercises
  }
  
  // Additional validation rules could be added here
  // e.g., avoid supersetting same muscle groups, etc.
  
  return true;
}

/**
 * Gets the next exercise in workout flow considering supersets
 */
export function getNextExerciseInFlow(
  currentExercise: TemplateExercise,
  allExercises: TemplateExercise[]
): TemplateExercise | null {
  const structure = organizeWorkoutStructure(allExercises);
  
  // If current exercise is in a superset
  if (currentExercise.supersetGroup) {
    const superset = structure.supersets.find(s => s.id === currentExercise.supersetGroup);
    if (superset) {
      const currentIndex = superset.exercises.findIndex(ex => ex.exerciseId === currentExercise.exerciseId);
      const nextInSuperset = superset.exercises[currentIndex + 1];
      
      if (nextInSuperset) {
        return nextInSuperset; // Next exercise in superset
      }
    }
  }
  
  // Find next exercise or superset in overall flow
  const flatFlow = [
    ...structure.individualExercises,
    ...structure.supersets.flatMap(s => s.exercises)
  ].sort((a, b) => (a.order || 0) - (b.order || 0));
  
  const currentIndex = flatFlow.findIndex(ex => ex.exerciseId === currentExercise.exerciseId);
  return flatFlow[currentIndex + 1] || null;
}

/**
 * Calculates appropriate rest time between current and next exercise
 */
export function getRestTimeForTransition(
  currentExercise: TemplateExercise,
  nextExercise: TemplateExercise | null
): number {
  // If moving to next exercise in same superset
  if (nextExercise && 
      currentExercise.supersetGroup && 
      nextExercise.supersetGroup === currentExercise.supersetGroup) {
    return currentExercise.restBetweenExercises || 15; // Short rest
  }
  
  // Moving to different exercise/superset or finishing superset
  return currentExercise.restTime || 120; // Longer rest
}

/**
 * Formats superset display name
 */
export function formatSupersetName(exercises: TemplateExercise[], exerciseList: any[]): string {
  const exerciseNames = exercises.map(ex => {
    const exercise = exerciseList.find(e => e.id === ex.exerciseId);
    return exercise?.name || 'Unknown';
  });
  
  return `Superset: ${exerciseNames.join(' + ')}`;
}