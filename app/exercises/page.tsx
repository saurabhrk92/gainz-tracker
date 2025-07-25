'use client';

import { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import ConfirmModal from '../components/ui/ConfirmModal';
import ExerciseForm from '../components/exercises/ExerciseForm';
import { Exercise, MuscleGroup } from '@/lib/types';
import { getDB } from '@/lib/storage/indexedDB';
import { MUSCLE_GROUPS, EQUIPMENT_TYPES } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import { MuscleGroupIcon, EquipmentIcon, ActionIcon, UIIcon } from '../components/ui/Icon';

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<MuscleGroup | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteExerciseId, setDeleteExerciseId] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState('');

  useEffect(() => {
    loadExercises();
  }, []);

  useEffect(() => {
    filterExercises();
  }, [exercises, searchTerm, selectedMuscleGroup]);

  const loadExercises = async () => {
    try {
      const db = await getDB();
      const allExercises = await db.getExercises();
      setExercises(allExercises);
    } catch (error) {
      console.error('Failed to load exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterExercises = () => {
    let filtered = exercises;
    
    if (searchTerm) {
      filtered = filtered.filter(ex => 
        ex.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedMuscleGroup !== 'all') {
      filtered = filtered.filter(ex => ex.muscleGroup === selectedMuscleGroup);
    }
    
    setFilteredExercises(filtered);
  };

  const handleExerciseCreated = () => {
    setShowCreateModal(false);
    loadExercises(); // Refresh the list
  };

  const handleEditClick = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setShowEditModal(true);
  };

  const handleExerciseUpdated = () => {
    setShowEditModal(false);
    setEditingExercise(null);
    loadExercises(); // Refresh the list
  };

  const handleDeleteClick = async (exercise: Exercise) => {
    try {
      const db = await getDB();
      
      // Check if this exercise is used in any workouts
      const workouts = await db.getWorkouts();
      const usedInWorkouts = workouts.filter(workout => 
        workout.exercises.some(ex => ex.exerciseId === exercise.id)
      );
      
      // Check if this exercise is used in any templates
      const templates = await db.getTemplates();
      const usedInTemplates = templates.filter(template =>
        template.exercises.some(ex => ex.exerciseId === exercise.id)
      );
      
      let confirmMessage = `Are you sure you want to delete "${exercise.name}"?`;
      if (usedInWorkouts.length > 0 || usedInTemplates.length > 0) {
        const workoutText = usedInWorkouts.length > 0 ? `${usedInWorkouts.length} workout(s)` : '';
        const templateText = usedInTemplates.length > 0 ? `${usedInTemplates.length} template(s)` : '';
        const usageText = [workoutText, templateText].filter(Boolean).join(' and ');
        confirmMessage = `"${exercise.name}" is used in ${usageText}. Deleting it will not affect your existing data, but you won't be able to use this exercise again. Are you sure you want to delete it?`;
      }
      
      setDeleteExerciseId(exercise.id);
      setDeleteMessage(confirmMessage);
      setShowDeleteConfirm(true);
    } catch (error) {
      console.error('Failed to check exercise usage:', error);
    }
  };

  const confirmDeleteExercise = async () => {
    if (!deleteExerciseId) return;
    
    try {
      const db = await getDB();
      await db.deleteExercise(deleteExerciseId);
      loadExercises(); // Refresh the list
    } catch (error) {
      console.error('Failed to delete exercise:', error);
    } finally {
      setDeleteExerciseId(null);
      setDeleteMessage('');
    }
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
        <h1 className="text-2xl font-bold text-black">Exercise Library</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your exercise database</p>
      </div>

      {/* Main Content */}
      <main className="space-y-6">
        {/* Actions */}
        <div className="space-y-4">
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="w-full"
            size="lg"
          >
            Add New Exercise
          </Button>
          
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search exercises..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 min-h-[44px] text-sm"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </div>
          </div>
          
          {/* Muscle Group Filter */}
          <div>
            <h3 className="text-base font-bold text-black mb-3">Filter by Muscle Group</h3>
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedMuscleGroup('all')}
                className={`px-6 py-2 rounded-lg whitespace-nowrap font-medium transition-all duration-200 border ${
                  selectedMuscleGroup === 'all'
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                All
              </button>
              {Object.entries(MUSCLE_GROUPS).map(([key, info]) => (
                <button
                  key={key}
                  onClick={() => setSelectedMuscleGroup(key as MuscleGroup)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition-all duration-200 border flex items-center gap-1 ${
                    selectedMuscleGroup === key
                      ? 'text-white border-transparent'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                  style={{
                    backgroundColor: selectedMuscleGroup === key ? info.color : undefined,
                  }}
                >
                  <MuscleGroupIcon name={info.icon as any} size={16} className="flex-shrink-0" />
                  {info.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Exercises List */}
        <div>
          <h2 className="text-lg font-bold text-black mb-4">
            {filteredExercises.length} Exercise{filteredExercises.length !== 1 ? 's' : ''}
          </h2>
          <div className="space-y-3">
            {filteredExercises.length > 0 ? (
              filteredExercises.map((exercise) => {
                const muscleGroupInfo = MUSCLE_GROUPS[exercise.muscleGroup];
                const equipmentInfo = EQUIPMENT_TYPES.find(e => e.value === exercise.type);
                
                return (
                  <Card key={exercise.id}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                            style={{ backgroundColor: muscleGroupInfo.color }}
                          >
                            <MuscleGroupIcon 
                              name={muscleGroupInfo.icon as any} 
                              size={20} 
                              color="white"
                            />
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-black">
                              {exercise.name}
                            </h3>
                            <p className="text-sm font-medium" style={{ color: muscleGroupInfo.color }}>
                              {muscleGroupInfo.label}
                            </p>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-1 border border-gray-200">
                              <EquipmentIcon name={equipmentInfo?.icon as any} size={16} />
                              <span className="font-medium text-sm text-gray-700">{equipmentInfo?.label}</span>
                            </div>
                            
                            {exercise.type === 'barbell' && exercise.barWeight && (
                              <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-1 border border-gray-200">
                                <EquipmentIcon name="barbell" size={16} />
                                <span className="font-medium text-sm text-gray-700">{exercise.barWeight} lb bar</span>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-1 border border-gray-200">
                              <ActionIcon name="timer" size={16} />
                              <span className="font-medium text-sm text-gray-700">{exercise.defaultRestTime}s rest</span>
                            </div>
                          </div>
                          
                          {exercise.lastUsed && (
                            <div className="text-xs text-gray-500">
                              Last used: {formatDate(new Date(exercise.lastUsed), 'MMM d')}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 ml-3">
                        <Button
                          variant="glass"
                          size="sm"
                          onClick={() => handleEditClick(exercise)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="glass"
                          size="sm"
                          onClick={() => handleDeleteClick(exercise)}
                          className="text-gray-600 hover:text-red-600"
                        >
                          <ActionIcon name="delete" size={14} />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })
            ) : (
              <Card className="text-center py-8">
                <div className="mb-4">
                  {searchTerm || selectedMuscleGroup !== 'all' ? 
                    <UIIcon name="exercises" size={48} color="#9CA3AF" /> : 
                    <UIIcon name="exercises" size={48} color="#9CA3AF" />
                  }
                </div>
                <h3 className="text-lg font-bold text-black mb-2">
                  {searchTerm || selectedMuscleGroup !== 'all' 
                    ? 'No exercises found'
                    : 'No exercises yet'
                  }
                </h3>
                <p className="text-gray-600 text-sm">
                  {searchTerm || selectedMuscleGroup !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Popular exercises will be added automatically!'
                  }
                </p>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Create Exercise Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Exercise"
        size="lg"
      >
        <ExerciseForm
          onSuccess={handleExerciseCreated}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Edit Exercise Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingExercise(null);
        }}
        title="Edit Exercise"
        size="lg"
      >
        <ExerciseForm
          exercise={editingExercise || undefined}
          onSuccess={handleExerciseUpdated}
          onCancel={() => {
            setShowEditModal(false);
            setEditingExercise(null);
          }}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteExercise}
        title="Delete Exercise"
        message={deleteMessage}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}