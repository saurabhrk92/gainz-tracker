'use client';

import { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import ExerciseForm from '../components/exercises/ExerciseForm';
import { Exercise, MuscleGroup } from '@/lib/types';
import { getDB } from '@/lib/storage/indexedDB';
import { MUSCLE_GROUPS, EQUIPMENT_TYPES } from '@/lib/constants';
import { formatDate } from '@/lib/utils';

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<MuscleGroup | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-primary text-white p-4 safe-top relative overflow-hidden rounded-b-3xl mb-4 mx-[-16px] mt-[-16px]">
        <div className="relative z-10 px-2">
          <h1 className="text-xl font-bold font-display">💪 Exercise Library</h1>
          <p className="text-white/90 mt-1 text-sm">Build your perfect exercise collection</p>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-6 translate-x-6 pointer-events-none"></div>
      </header>

      {/* Main Content */}
      <main className="flex-1 space-y-6">
        {/* Actions */}
        <div className="space-y-4">
          <Button 
            onClick={() => {
              console.log('Button clicked!');
              setShowCreateModal(true);
              console.log('Modal state set to true');
            }}
            className="w-full text-xl"
            size="lg"
          >
            <span className="text-2xl">➕</span>
            Add New Exercise
          </Button>
          
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search exercises..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-4 py-4 bg-white/95 backdrop-blur-md rounded-2xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-lg transition-all duration-200"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-2xl">
              🔍
            </div>
          </div>
          
          {/* Muscle Group Filter */}
          <div>
            <h3 className="text-base font-bold text-gray-700 mb-3 font-display">Filter by Muscle Group</h3>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              <button
                onClick={() => setSelectedMuscleGroup('all')}
                className={`px-4 py-3 rounded-2xl whitespace-nowrap font-semibold transition-all duration-200 transform hover:scale-105 min-h-[44px] ${
                  selectedMuscleGroup === 'all'
                    ? 'bg-gradient-primary text-white shadow-lg'
                    : 'bg-white/95 backdrop-blur-md text-gray-700 border border-white/20 shadow-lg hover:bg-white'
                }`}
              >
                💪 All
              </button>
              {Object.entries(MUSCLE_GROUPS).map(([key, info]) => (
                <button
                  key={key}
                  onClick={() => setSelectedMuscleGroup(key as MuscleGroup)}
                  className={`px-6 py-3 rounded-2xl whitespace-nowrap font-semibold transition-all duration-200 shadow-lg transform hover:scale-105 ${
                    selectedMuscleGroup === key
                      ? 'text-white'
                      : 'bg-white/95 backdrop-blur-md text-gray-700 border border-white/20 hover:bg-white'
                  }`}
                  style={{
                    backgroundColor: selectedMuscleGroup === key ? info.color : undefined,
                  }}
                >
                  {info.emoji} {info.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Exercises List */}
        <div className="space-y-4">
          {filteredExercises.length > 0 ? (
            filteredExercises.map((exercise) => {
              const muscleGroupInfo = MUSCLE_GROUPS[exercise.muscleGroup];
              const equipmentInfo = EQUIPMENT_TYPES.find(e => e.value === exercise.type);
              
              return (
                <Card 
                  key={exercise.id}
                  className="relative overflow-hidden transform hover:scale-[1.02] hover:-translate-y-1 transition-all duration-200 border-l-4 shadow-lg hover:shadow-xl"
                  style={{ borderLeftColor: muscleGroupInfo.color }}
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold shadow-md"
                          style={{ backgroundColor: muscleGroupInfo.color }}
                        >
                          {muscleGroupInfo.emoji}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-800 font-display">
                            {exercise.name}
                          </h3>
                          <p className="text-sm font-medium" style={{ color: muscleGroupInfo.color }}>
                            {muscleGroupInfo.label}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="glass"
                        size="sm"
                        onClick={() => window.location.href = `/exercises/${exercise.id}/edit`}
                        className="shrink-0"
                      >
                        ✏️ Edit
                      </Button>
                    </div>
                    
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center gap-3 text-gray-700">
                        <div className="flex items-center gap-2 bg-white/80 rounded-xl px-3 py-2 shadow-sm">
                          <span className="text-lg">{equipmentInfo?.icon}</span>
                          <span className="font-semibold text-sm">{equipmentInfo?.label}</span>
                        </div>
                        
                        {exercise.type === 'barbell' && exercise.barWeight && (
                          <div className="flex items-center gap-2 bg-white/80 rounded-xl px-3 py-2 shadow-sm">
                            <span className="text-lg">🏋️</span>
                            <span className="font-semibold text-sm">{exercise.barWeight} lb bar</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 bg-white/80 rounded-xl px-3 py-2 shadow-sm">
                          <span className="text-lg">⏱️</span>
                          <span className="font-semibold text-sm">{exercise.defaultRestTime}s rest</span>
                        </div>
                      </div>
                      
                      {exercise.lastUsed && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <span className="text-sm">📅</span>
                          <span className="text-sm font-medium">
                            Last used: {formatDate(new Date(exercise.lastUsed), 'MMM d')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Subtle background gradient */}
                  <div 
                    className="absolute top-0 right-0 w-24 h-24 opacity-5 rounded-full -translate-y-6 translate-x-6"
                    style={{ backgroundColor: muscleGroupInfo.color }}
                  ></div>
                </Card>
              );
            })
          ) : (
            <Card className="text-center space-y-6 py-12">
              <div className="text-8xl opacity-50">
                {searchTerm || selectedMuscleGroup !== 'all' ? '🔍' : '💪'}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3 font-display">
                  {searchTerm || selectedMuscleGroup !== 'all' 
                    ? 'No exercises found'
                    : 'No exercises yet'
                  }
                </h3>
                <p className="text-lg text-gray-600 mb-4">
                  {searchTerm || selectedMuscleGroup !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Add your first exercise to get started!'
                  }
                </p>
                {!(searchTerm || selectedMuscleGroup !== 'all') && (
                  <Button 
                    onClick={() => setShowCreateModal(true)}
                    size="lg"
                    className="text-lg"
                  >
                    ➕ Add Your First Exercise
                  </Button>
                )}
              </div>
            </Card>
          )}
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
    </div>
  );
}