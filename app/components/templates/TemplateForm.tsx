'use client';

import { useState, useEffect } from 'react';
import { WorkoutTemplate, Exercise, MuscleGroup, WeekDay, TemplateExercise } from '@/lib/types';
import { getDB } from '@/lib/storage/indexedDB';
import { MUSCLE_GROUPS, WEEK_DAYS } from '@/lib/constants';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { UIIcon, ActionIcon, MuscleGroupIcon } from '../ui/Icon';
import { useSync } from '@/lib/hooks/useSync';
import { organizeWorkoutStructure, createSuperset, removeFromSuperset, formatSupersetName } from '@/lib/supersetUtils';
import { generateId } from '@/lib/utils';

interface TemplateFormProps {
  template?: WorkoutTemplate;
  onSuccess: (template: WorkoutTemplate) => void;
  onCancel: () => void;
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
  const [selectedExercises, setSelectedExercises] = useState<number[]>([]);
  const [showSupersetOptions, setShowSupersetOptions] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

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
    
    const defaultExercise = availableExercises[0];
    
    const updated = [
      ...templateExercises,
      {
        exerciseId: defaultExercise.id,
        targetSets: 3,
        restTime: defaultExercise.defaultRestTime,
      }
    ];
    
    setTemplateExercises(updated);
    
    // Auto-save after adding exercise
    if (template) {
      autoSaveTemplate(updated);
    }
  };

  const removeExercise = (index: number) => {
    const updated = templateExercises.filter((_, i) => i !== index);
    setTemplateExercises(updated);
    
    // Auto-save after removing exercise
    if (template) {
      autoSaveTemplate(updated);
    }
  };

  const updateExercise = (index: number, field: keyof TemplateExercise, value: any) => {
    const updated = [...templateExercises];
    updated[index] = { ...updated[index], [field]: value };
    
    // If exercise changes, update rest time to match the new exercise's default
    if (field === 'exerciseId') {
      const newExercise = availableExercises.find(ex => ex.id === value);
      if (newExercise) {
        updated[index].restTime = newExercise.defaultRestTime;
      }
    }
    
    setTemplateExercises(updated);
    
    // Auto-save after update
    if (template) {
      autoSaveTemplate(updated);
    }
  };

  const createSupersetFromSelected = (restBetweenExercises: number = 15) => {
    if (selectedExercises.length < 2) return;
    
    const selectedTemplateExercises = selectedExercises
      .map(index => templateExercises[index])
      .filter(Boolean);
    
    const supersetExercises = createSuperset(selectedTemplateExercises, restBetweenExercises);
    const updated = [...templateExercises];
    
    // Update the selected exercises with superset data
    selectedExercises.forEach((index, supersetIndex) => {
      if (updated[index]) {
        updated[index] = supersetExercises[supersetIndex];
      }
    });
    
    setTemplateExercises(updated);
    setSelectedExercises([]);
    setShowSupersetOptions(false);
    
    // Auto-save after creating superset
    if (template) {
      autoSaveTemplate(updated);
    }
  };

  const removeSupersetFromExercise = (index: number) => {
    const updated = [...templateExercises];
    updated[index] = removeFromSuperset(updated[index]);
    setTemplateExercises(updated);
    
    // Auto-save after removing from superset
    if (template) {
      autoSaveTemplate(updated);
    }
  };

  const deleteEntireSuperset = (supersetId: string) => {
    const updated = templateExercises.filter(ex => ex.supersetGroup !== supersetId);
    setTemplateExercises(updated);
    
    // Auto-save after deleting superset
    if (template) {
      autoSaveTemplate(updated);
    }
  };

  const toggleExerciseSelection = (index: number) => {
    setSelectedExercises(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newTemplateExercises = [...templateExercises];
    const draggedItem = newTemplateExercises[draggedIndex];
    
    // Remove dragged item
    newTemplateExercises.splice(draggedIndex, 1);
    
    // Insert at new position
    const insertIndex = draggedIndex < dropIndex ? dropIndex - 1 : dropIndex;
    newTemplateExercises.splice(insertIndex, 0, draggedItem);
    
    setTemplateExercises(newTemplateExercises);
    setDraggedIndex(null);
    setSelectedExercises([]); // Clear selections after reorder
    
    // Auto-save after reordering
    if (template) {
      autoSaveTemplate(newTemplateExercises);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const autoSaveTemplate = async (exercises: TemplateExercise[]) => {
    if (!template || !name.trim() || exercises.length === 0) return;
    
    try {
      setAutoSaving(true);
      const db = await getDB();
      
      const templateData: WorkoutTemplate = {
        ...template,
        name: name.trim(),
        muscleGroup,
        day,
        exercises,
      };

      await db.updateTemplate(template.id, templateData);
      syncWorkoutEvent('workout_template_modified');
      
      // Brief feedback that save occurred
      setTimeout(() => setAutoSaving(false), 500);
    } catch (error) {
      console.error('Auto-save failed:', error);
      setAutoSaving(false);
    }
  };

  // Auto-save when name, muscle group, or day changes
  const handleNameChange = (newName: string) => {
    setName(newName);
    if (template && newName.trim()) {
      autoSaveTemplate(templateExercises);
    }
  };

  const handleMuscleGroupChange = (newMuscleGroup: MuscleGroup | 'full_body') => {
    setMuscleGroup(newMuscleGroup);
    if (template) {
      autoSaveTemplate(templateExercises);
    }
  };

  const handleDayChange = (newDay: WeekDay) => {
    setDay(newDay);
    if (template) {
      autoSaveTemplate(templateExercises);
    }
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
            onChange={(e) => handleNameChange(e.target.value)}
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
              onChange={(e) => handleMuscleGroupChange(e.target.value as MuscleGroup | 'full_body')}
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
              onChange={(e) => handleDayChange(e.target.value as WeekDay)}
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
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-gray-800 font-display">Template Exercises</h3>
            {autoSaving && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent"></div>
                <span>Saving...</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {selectedExercises.length > 1 && (
              <Button
                type="button"
                onClick={() => setShowSupersetOptions(true)}
                size="sm"
                variant="primary"
              >
                Create Superset ({selectedExercises.length})
              </Button>
            )}
            <Button
              type="button"
              onClick={addExercise}
              size="sm"
              variant="secondary"
            >
              Add Exercise
            </Button>
          </div>
        </div>

        {/* Superset Options */}
        {showSupersetOptions && (
          <Card className="mb-4 bg-blue-50 border-blue-200">
            <h4 className="font-bold text-blue-800 mb-3">Create Superset</h4>
            <p className="text-sm text-blue-700 mb-4">
              Group {selectedExercises.length} exercises into a superset with minimal rest between exercises.
            </p>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-blue-700 mb-1">
                  Rest Between Exercises (seconds)
                </label>
                <select 
                  className="w-full p-2 rounded-lg border border-blue-300 bg-white"
                  onChange={(e) => createSupersetFromSelected(parseInt(e.target.value))}
                >
                  <option value="">Select rest time...</option>
                  <option value="10">10 seconds</option>
                  <option value="15">15 seconds (recommended)</option>
                  <option value="20">20 seconds</option>
                  <option value="30">30 seconds</option>
                </select>
              </div>
              <div className="flex gap-2 items-end">
                <Button
                  type="button"
                  onClick={() => setShowSupersetOptions(false)}
                  size="sm"
                  variant="secondary"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        <div className="space-y-4">
          {(() => {
            // Group exercises by superset
            const groupedExercises = new Map<string, Array<{ templateExercise: TemplateExercise, index: number }>>();
            const individualExercises: Array<{ templateExercise: TemplateExercise, index: number }> = [];
            
            templateExercises.forEach((templateExercise, index) => {
              if (templateExercise.supersetGroup) {
                if (!groupedExercises.has(templateExercise.supersetGroup)) {
                  groupedExercises.set(templateExercise.supersetGroup, []);
                }
                groupedExercises.get(templateExercise.supersetGroup)!.push({ templateExercise, index });
              } else {
                individualExercises.push({ templateExercise, index });
              }
            });
            
            const allGroups: Array<{ type: 'individual' | 'superset', exercises: Array<{ templateExercise: TemplateExercise, index: number }>, supersetId?: string }> = [];
            
            // Add individual exercises
            individualExercises.forEach(({ templateExercise, index }) => {
              allGroups.push({ type: 'individual' as const, exercises: [{ templateExercise, index }] });
            });
            
            // Add superset groups
            groupedExercises.forEach((exercises, supersetId) => {
              const sortedExercises = exercises.sort((a, b) => 
                (a.templateExercise.supersetOrder || 0) - (b.templateExercise.supersetOrder || 0)
              );
              allGroups.push({ type: 'superset' as const, exercises: sortedExercises, supersetId });
            });
            
            // Sort all groups by the order of their first exercise
            allGroups.sort((a, b) => {
              const aFirstIndex = a.exercises[0].index;
              const bFirstIndex = b.exercises[0].index;
              return aFirstIndex - bFirstIndex;
            });
            
            return allGroups.map((group, groupIndex) => {
              if (group.type === 'superset' && group.supersetId) {
                const firstExercise = group.exercises[0].templateExercise;
                const supersetGroup = templateExercises.filter(ex => ex.supersetGroup === group.supersetId);
                
                return (
                  <div key={`superset-${group.supersetId}`} className="bg-green-50 rounded-2xl p-4 border-2 border-green-200">
                    {/* Superset Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        SS
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-green-800">
                          {formatSupersetName(supersetGroup, availableExercises)}
                        </h4>
                        <p className="text-sm text-green-700">
                          {group.exercises.length} exercises • {firstExercise.restBetweenExercises || 15}s between • {firstExercise.restTime || 120}s after superset
                        </p>
                      </div>
                      
                      {/* Delete entire superset button */}
                      <Button
                        type="button"
                        onClick={() => deleteEntireSuperset(group.supersetId!)}
                        size="sm"
                        variant="danger"
                        title="Delete entire superset"
                        className="bg-red-500 hover:bg-red-600 text-white"
                      >
                        <ActionIcon name="delete" size={14} />
                      </Button>
                    </div>
                    
                    {/* Superset Exercises */}
                    <div className="space-y-3">
                      {group.exercises.map(({ templateExercise, index }) => {
                        const exercise = availableExercises.find(e => e.id === templateExercise.exerciseId);
                        if (!exercise) return null;
                        
                        const muscleGroupInfo = MUSCLE_GROUPS[exercise.muscleGroup];
                        const isSelected = selectedExercises.includes(index);
                        
                        return (
                          <Card key={index} className="bg-white border border-green-300">
                            <div className="space-y-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                  {templateExercise.supersetOrder}
                                </div>
                                
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

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                    Rest After Superset (sec)
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
                    </div>
                  </div>
                );
              } else {
                // Individual exercise
                const { templateExercise, index } = group.exercises[0];
                const exercise = availableExercises.find(e => e.id === templateExercise.exerciseId);
                if (!exercise) return null;
                
                const muscleGroupInfo = MUSCLE_GROUPS[exercise.muscleGroup];
                const isSelected = selectedExercises.includes(index);
                
                return (
                  <div
                    key={index}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`transition-all duration-200 ${
                      draggedIndex === index ? 'opacity-50 scale-95' : ''
                    }`}
                  >
                    <Card 
                      className={`relative overflow-hidden border-l-4 cursor-move ${
                        isSelected ? 'ring-2 ring-blue-400 bg-blue-50' : ''
                      }`} 
                      style={{ borderLeftColor: muscleGroupInfo.color }}
                    >
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          {/* Drag handle */}
                          <div className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing">
                            <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor">
                              <circle cx="2" cy="2" r="1.5"/>
                              <circle cx="2" cy="8" r="1.5"/>
                              <circle cx="2" cy="14" r="1.5"/>
                              <circle cx="10" cy="2" r="1.5"/>
                              <circle cx="10" cy="8" r="1.5"/>
                              <circle cx="10" cy="14" r="1.5"/>
                            </svg>
                          </div>
                          
                          {/* Selection checkbox */}
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleExerciseSelection(index)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                          </div>
                          
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
                        
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            onClick={() => removeExercise(index)}
                            size="sm"
                            variant="danger"
                          >
                            <ActionIcon name="delete" size={14} />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  </div>
                );
              }
            });
          })()}

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
          {template ? 'Done' : 'Cancel'}
        </Button>
        {!template && (
          <Button
            type="submit"
            disabled={loading || !name.trim() || templateExercises.length === 0}
            className="flex-1"
          >
            {loading ? 'Creating...' : 'Create Template'}
          </Button>
        )}
      </div>
    </form>
  );
}