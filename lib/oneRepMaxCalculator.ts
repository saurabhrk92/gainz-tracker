/**
 * One Rep Max (1RM) Prediction Engine
 * 
 * This engine calculates estimated 1RM using multiple proven formulas
 * and prioritizes actual 1RM data when available.
 */

export interface OneRepMaxData {
  exerciseId: string;
  exerciseName: string;
  oneRM: number;
  isActual: boolean; // true if from actual 1RM, false if predicted
  calculationMethod: string;
  sourceWeight: number;
  sourceReps: number;
  date: Date;
  confidence: 'high' | 'medium' | 'low'; // Based on rep range accuracy
  min?: number; // Minimum prediction across all models
  max?: number; // Maximum prediction across all models
  average?: number; // Average prediction across all models
}

export interface SetData {
  reps: number;
  weight: number;
  date: Date;
}

/**
 * 1RM Calculation Formulas
 * Research shows these are most accurate for different rep ranges
 */
export class OneRepMaxCalculator {
  
  /**
   * Epley Formula: weight × (1 + 0.0333 × reps)
   * Best for: 2-10 reps
   * Accuracy: ±2-5% for low-moderate reps
   */
  static epley(weight: number, reps: number): number {
    if (reps === 1) return weight;
    return Math.round(weight * (1 + 0.0333 * reps));
  }

  /**
   * Brzycki Formula: weight × (36 / (37 - reps))
   * Best for: 2-10 reps  
   * Accuracy: ±3-7% for moderate reps
   */
  static brzycki(weight: number, reps: number): number {
    if (reps === 1) return weight;
    if (reps >= 37) return weight; // Formula breaks down at high reps
    return Math.round(weight * (36 / (37 - reps)));
  }

  /**
   * Lander Formula: (100 × weight) / (101.3 - 2.67123 × reps)
   * Best for: 2-8 reps
   * Accuracy: ±2-6% for low-moderate reps
   */
  static lander(weight: number, reps: number): number {
    if (reps === 1) return weight;
    return Math.round((100 * weight) / (101.3 - 2.67123 * reps));
  }

  /**
   * Lombardi Formula: weight × reps^0.1
   * Best for: Higher rep ranges
   * Accuracy: ±5-10% for moderate-high reps
   */
  static lombardi(weight: number, reps: number): number {
    if (reps === 1) return weight;
    return Math.round(weight * Math.pow(reps, 0.1));
  }

  /**
   * Get the most accurate formula for a given rep range
   */
  static getBestFormula(reps: number): string {
    if (reps === 1) return 'actual';
    if (reps >= 2 && reps <= 5) return 'epley'; // Most accurate for low reps
    if (reps >= 6 && reps <= 10) return 'brzycki'; // Best for moderate reps
    if (reps >= 11 && reps <= 15) return 'lander'; // Good for higher reps
    return 'lombardi'; // Fallback for very high reps
  }

  /**
   * Get confidence level based on rep range
   */
  static getConfidence(reps: number): 'high' | 'medium' | 'low' {
    if (reps === 1) return 'high'; // Actual 1RM
    if (reps >= 2 && reps <= 8) return 'high'; // Most accurate range
    if (reps >= 9 && reps <= 12) return 'medium'; // Moderate accuracy
    return 'low'; // Less accurate for high reps
  }

  /**
   * Calculate 1RM using all formulas and return statistics
   */
  static calculate1RMWithRange(weight: number, reps: number): { 
    oneRM: number; 
    formula: string; 
    confidence: 'high' | 'medium' | 'low';
    min: number;
    max: number;
    average: number;
    allPredictions: { formula: string; value: number }[];
  } {
    if (reps === 1) {
      return {
        oneRM: weight,
        formula: 'actual',
        confidence: 'high',
        min: weight,
        max: weight,
        average: weight,
        allPredictions: [{ formula: 'actual', value: weight }]
      };
    }

    // Calculate all formulas
    const predictions = [
      { formula: 'epley', value: this.epley(weight, reps) },
      { formula: 'brzycki', value: this.brzycki(weight, reps) },
      { formula: 'lander', value: this.lander(weight, reps) },
      { formula: 'lombardi', value: this.lombardi(weight, reps) }
    ];

    const values = predictions.map(p => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const average = Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);

    // Use the average as the primary oneRM to ensure it's within the range
    // This prevents the main dot from appearing outside the error bars
    const bestFormula = this.getBestFormula(reps);
    const confidence = this.getConfidence(reps);

    return { 
      oneRM: average, // Use average so it's always within min/max range
      formula: bestFormula, 
      confidence,
      min,
      max,
      average,
      allPredictions: predictions
    };
  }

  /**
   * Calculate 1RM using the best formula for the rep range (legacy method)
   */
  static calculate1RM(weight: number, reps: number): { oneRM: number; formula: string; confidence: 'high' | 'medium' | 'low' } {
    const result = this.calculate1RMWithRange(weight, reps);
    return { oneRM: result.oneRM, formula: result.formula, confidence: result.confidence };
  }

  /**
   * Find the best 1RM for an exercise from workout data
   * Skips actual 1RM sets and uses the next best working set for prediction
   */
  static findBest1RM(sets: SetData[], exerciseName: string, exerciseId: string): OneRepMaxData | null {
    if (sets.length === 0) return null;

    // Filter out 1RM sets - we want to predict based on working sets only
    const workingSets = sets.filter(set => set.reps > 1);
    
    if (workingSets.length === 0) {
      // If only 1RM sets exist, fall back to using them
      const onlyOneRM = sets.filter(set => set.reps === 1);
      if (onlyOneRM.length > 0) {
        const bestOneRM = onlyOneRM.sort((a, b) => b.weight - a.weight)[0];
        return {
          exerciseId,
          exerciseName,
          oneRM: bestOneRM.weight,
          isActual: true,
          calculationMethod: 'Actual 1RM',
          sourceWeight: bestOneRM.weight,
          sourceReps: 1,
          date: bestOneRM.date,
          confidence: 'high',
          min: bestOneRM.weight,
          max: bestOneRM.weight,
          average: bestOneRM.weight
        };
      }
      return null;
    }

    // Sort working sets by priority: lowest reps first (more accurate), then highest weight
    const sortedSets = workingSets.sort((a, b) => {
      // Prioritize lower reps (more accurate prediction)
      if (a.reps !== b.reps) return a.reps - b.reps;
      
      // Then by highest weight
      return b.weight - a.weight;
    });

    const bestSet = sortedSets[0];
    const result = this.calculate1RMWithRange(bestSet.weight, bestSet.reps);

    return {
      exerciseId,
      exerciseName,
      oneRM: result.average,
      isActual: false, // Always predicted now
      calculationMethod: `Predicted from ${result.formula.charAt(0).toUpperCase() + result.formula.slice(1)} (${bestSet.reps} reps @ ${bestSet.weight}lbs)`,
      sourceWeight: bestSet.weight,
      sourceReps: bestSet.reps,
      date: bestSet.date,
      confidence: result.confidence,
      min: result.min,
      max: result.max,
      average: result.average
    };
  }

  /**
   * Calculate 1RM progression over time for an exercise
   * Groups by workout date and uses best working set (skips 1RM sets) per workout
   */
  static calculate1RMProgression(sets: SetData[], exerciseName: string, exerciseId: string): OneRepMaxData[] {
    if (sets.length === 0) return [];

    // Group sets by workout date (same day = same workout)
    const workoutBests = new Map<string, SetData>();
    
    sets.forEach(set => {
      const dateKey = set.date.toDateString(); // Group by same day
      const existing = workoutBests.get(dateKey);
      
      // For each workout, find the best working set (skip 1RM, prefer higher weight + lower reps)
      const isWorkingSet = set.reps > 1;
      const existingIsWorkingSet = existing ? existing.reps > 1 : false;
      
      // Prefer working sets over 1RM sets
      if (isWorkingSet && !existingIsWorkingSet) {
        workoutBests.set(dateKey, set);
      } else if (!isWorkingSet && existingIsWorkingSet) {
        // Keep existing working set, skip this 1RM
        return;
      } else if (isWorkingSet === existingIsWorkingSet) {
        // Both same type, compare normally
        if (!existing || set.weight > existing.weight || 
            (set.weight === existing.weight && set.reps < existing.reps)) {
          workoutBests.set(dateKey, set);
        }
      }
    });

    // Convert to 1RM data, filtering out any remaining 1RM sets
    return Array.from(workoutBests.values())
      .filter(set => set.reps > 1) // Only working sets
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map(set => {
        const result = this.calculate1RMWithRange(set.weight, set.reps);
        
        return {
          exerciseId,
          exerciseName,
          oneRM: result.average,
          isActual: false, // Always predicted from working sets
          calculationMethod: `Predicted from ${result.formula.charAt(0).toUpperCase() + result.formula.slice(1)}`,
          sourceWeight: set.weight,
          sourceReps: set.reps,
          date: set.date,
          confidence: result.confidence,
          min: result.min,
          max: result.max,
          average: result.average
        };
      });
  }

  /**
   * Helper: Get week key for grouping (YYYY-WW format)
   */
  private static getWeekKey(date: Date): string {
    const year = date.getFullYear();
    const week = this.getWeekNumber(date);
    return `${year}-${week.toString().padStart(2, '0')}`;
  }

  /**
   * Helper: Get week number of year
   */
  private static getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  /**
   * Helper: Determine if one set is better than another for 1RM calculation
   */
  private static isBetterSet(setA: SetData, setB: SetData): boolean {
    // Prioritize actual 1RM
    if (setA.reps === 1 && setB.reps !== 1) return true;
    if (setB.reps === 1 && setA.reps !== 1) return false;
    
    // Calculate predicted 1RM for comparison
    const oneRMA = this.calculate1RM(setA.weight, setA.reps).oneRM;
    const oneRMB = this.calculate1RM(setB.weight, setB.reps).oneRM;
    
    if (oneRMA !== oneRMB) return oneRMA > oneRMB;
    
    // If same predicted 1RM, prefer lower reps (more accurate)
    return setA.reps < setB.reps;
  }
}