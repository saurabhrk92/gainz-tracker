'use client';

import { useState, useEffect } from 'react';
import { WorkoutTemplate, Exercise, MuscleGroup, WeekDay } from '@/lib/types';
import { getDB } from '@/lib/storage/indexedDB';
import { MUSCLE_GROUPS, WEEK_DAYS } from '@/lib/constants';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { UIIcon, ActionIcon, MuscleGroupIcon } from '../ui/Icon';
import { useSync } from '@/lib/hooks/useSync';

interface TemplateFormProps {
  template?: WorkoutTemplate;
  onSuccess: (template: WorkoutTemplate) => void;
  onCancel: () => void;
}

interface TemplateExercise {
  exerciseId: string;
  targetSets: number;
  targetReps: string; // e.g., "8-12" or "10"
  restTime?: number;
}

export default function TemplateForm({ template, onSuccess, onCancel }: TemplateFormProps) {
  const { syncWorkoutEvent } = useSync();
  const [name, setName] = useState(template?.name || '');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup | 'full_body'>(template?.muscleGroup || 'chest');
  const [day, setDay] = useState<WeekDay>(template?.day || 'monday');
  const [templateExercises, setTemplateExercises] = useState<TemplateExercise[]>(
    template?.exercises || []
  );
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingExercises, setLoadingExercises] = useState(true);

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    try {
      const db = await getDB();
      const exercises = await db.getExercises();
      setAvailableExercises(exercises);
    } catch (error) {
      console.error('Failed to load exercises:', error);
    } finally {
      setLoadingExercises(false);
    }
  };

  const addExercise = () => {
    if (availableExercises.length === 0) return;
    
    setTemplateExercises([
      ...templateExercises,
      {
        exerciseId: availableExercises[0].id,
        targetSets: 3,
        targetReps: '8-12',
        restTime: 60,
      }
    ]);
  };

  const removeExercise = (index: number) => {
    setTemplateExercises(templateExercises.filter((_, i) => i !== index));
  };

  const updateExercise = (index: number, field: keyof TemplateExercise, value: any) => {
    const updated = [...templateExercises];
    updated[index] = { ...updated[index], [field]: value };
    setTemplateExercises(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || templateExercises.length === 0) return;

    try {
      setLoading(true);
      const db = await getDB();
      
      const templateData: WorkoutTemplate = {
        id: template?.id || crypto.randomUUID(),
        name: name.trim(),
        muscleGroup,
        day,
        exercises: templateExercises,
        isActive: template?.isActive || false,
        created: template?.created || new Date(),
        lastUsed: template?.lastUsed || null,
      };

      if (template) {
        await db.updateTemplate(template.id, templateData);
        syncWorkoutEvent('workout_template_modified');
      } else {
        await db.createTemplate(templateData);
        syncWorkoutEvent('workout_template_modified');
      }

      onSuccess(templateData);
    } catch (error) {
      console.error('Failed to save template:', error);
      alert('Failed to save template. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingExercises) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner" />
      </div>
    );
  }

  if (availableExercises.length === 0) {
    return (
      <Card className="text-center space-y-4 py-8">
        <div className="opacity-50">
          <UIIcon name="exercises" size={72} color="#9CA3AF" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-2 font-display">No Exercises Available</h3>
          <p className="text-gray-600">You need to create some exercises first before making a template.</p>
        </div>
        <Button onClick={onCancel} variant="secondary">
          Go Back
        </Button>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Template Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Chest & Triceps"
            className="w-full p-4 bg-white/95 backdrop-blur-md rounded-2xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-lg transition-all duration-200"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Primary Muscle Group
            </label>
            <select
              value={muscleGroup}
              onChange={(e) => setMuscleGroup(e.target.value as MuscleGroup | 'full_body')}
              className="w-full p-4 bg-white/95 backdrop-blur-md rounded-2xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-lg transition-all duration-200"
            >
              <option value="full_body">Full Body</option>
              {Object.entries(MUSCLE_GROUPS).map(([key, info]) => (
                <option key={key} value={key}>
                  {info.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Workout Day
            </label>
            <select
              value={day}
              onChange={(e) => setDay(e.target.value as WeekDay)}
              className="w-full p-4 bg-white/95 backdrop-blur-md rounded-2xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-lg transition-all duration-200"
            >
              {WEEK_DAYS.map((dayInfo) => (
                <option key={dayInfo.value} value={dayInfo.value}>
                  {dayInfo.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Exercises */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800 font-display">Template Exercises</h3>
          <Button
            type="button"
            onClick={addExercise}
            size="sm"
            variant="secondary"
          >
            Add Exercise
          </Button>
        </div>

        <div className="space-y-4">
          {templateExercises.map((templateExercise, index) => {
            const exercise = availableExercises.find(e => e.id === templateExercise.exerciseId);
            if (!exercise) return null;

            const muscleGroupInfo = MUSCLE_GROUPS[exercise.muscleGroup];

            return (
              <Card key={index} className="relative overflow-hidden border-l-4" style={{ borderLeftColor: muscleGroupInfo.color }}>
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-md"
                        style={{ backgroundColor: muscleGroupInfo.color }}
                      >
                        <MuscleGroupIcon 
                          name={muscleGroupInfo.icon as any} 
                          size={20} 
                          color="white"
                        />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800">{exercise.name}</h4>
                        <p className="text-sm text-gray-600">{muscleGroupInfo.label}</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={() => removeExercise(index)}
                      size="sm"
                      variant="danger"
                    >
                      <ActionIcon name="delete" size={14} />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Exercise
                      </label>
                      <select
                        value={templateExercise.exerciseId}
                        onChange={(e) => updateExercise(index, 'exerciseId', e.target.value)}
                        className="w-full p-3 bg-white/80 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        {availableExercises.map((ex) => {
                          const exMuscleGroup = MUSCLE_GROUPS[ex.muscleGroup];
                          return (
                            <option key={ex.id} value={ex.id}>
                              {ex.name} ({exMuscleGroup.label})
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Sets
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={templateExercise.targetSets}
                        onChange={(e) => updateExercise(index, 'targetSets', parseInt(e.target.value) || 1)}
                        className="w-full p-3 bg-white/80 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Reps
                      </label>
                      <input
                        type="text"
                        value={templateExercise.targetReps}
                        onChange={(e) => updateExercise(index, 'targetReps', e.target.value)}
                        placeholder="8-12"
                        className="w-full p-3 bg-white/80 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Rest (sec)
                      </label>
                      <input
                        type="number"
                        min="30"
                        max="300"
                        step="15"
                        value={templateExercise.restTime || exercise.defaultRestTime}
                        onChange={(e) => updateExercise(index, 'restTime', parseInt(e.target.value) || 60)}
                        className="w-full p-3 bg-white/80 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}

          {templateExercises.length === 0 && (
            <Card className="text-center py-8 text-gray-500">
              <UIIcon name="templates" size={48} color="#9CA3AF" className="mb-2" />
              <p>No exercises added yet</p>
              <p className="text-sm mt-1">Click "Add Exercise" to start building your template</p>
            </Card>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          onClick={onCancel}
          variant="secondary"
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading || !name.trim() || templateExercises.length === 0}
          className="flex-1"
        >
          {loading ? 'Saving...' : template ? 'Update Template' : 'Create Template'}
        </Button>
      </div>
    </form>
  );
}