'use client';

import { useState } from 'react';
import { Exercise, MuscleGroup, EquipmentType } from '@/lib/types';
import { getDB } from '@/lib/storage/indexedDB';
import { MUSCLE_GROUPS, EQUIPMENT_TYPES, BAR_WEIGHTS, REST_TIME_PRESETS } from '@/lib/constants';
import { generateId } from '@/lib/utils';

interface ExerciseFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ExerciseForm({ onSuccess, onCancel }: ExerciseFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    muscleGroup: 'chest' as MuscleGroup,
    type: 'barbell' as EquipmentType,
    barWeight: 45,
    dumbbellWeight: 25,
    dumbbellCount: 2,
    defaultRestTime: 180,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const exercise: Exercise = {
        id: generateId(),
        name: formData.name,
        muscleGroup: formData.muscleGroup,
        type: formData.type,
        barWeight: formData.type === 'barbell' ? formData.barWeight : undefined,
        dumbbellWeight: formData.type === 'dumbbell' ? formData.dumbbellWeight : undefined,
        dumbbellCount: formData.type === 'dumbbell' ? formData.dumbbellCount : undefined,
        defaultRestTime: formData.defaultRestTime,
        created: new Date(),
        lastUsed: new Date(),
      };

      const db = await getDB();
      await db.createExercise(exercise);
      
      onSuccess();
    } catch (error) {
      console.error('Failed to create exercise:', error);
      alert('Failed to create exercise. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Exercise Name */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Exercise Name
        </label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Bench Press"
          className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        />
      </div>

      {/* Muscle Group */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Muscle Group
        </label>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(MUSCLE_GROUPS).map(([key, info]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFormData({ ...formData, muscleGroup: key as MuscleGroup })}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                formData.muscleGroup === key
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <div className="text-2xl mb-1">{info.emoji}</div>
              <div className="text-sm font-medium">{info.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Equipment Type */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Equipment Type
        </label>
        <div className="grid grid-cols-2 gap-3">
          {EQUIPMENT_TYPES.map((equipment) => (
            <button
              key={equipment.value}
              type="button"
              onClick={() => setFormData({ ...formData, type: equipment.value })}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                formData.type === equipment.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <div className="text-2xl mb-1">{equipment.icon}</div>
              <div className="text-sm font-medium">{equipment.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Equipment Specific Settings */}
      {formData.type === 'barbell' && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Bar Weight
          </label>
          <div className="grid grid-cols-2 gap-3">
            {BAR_WEIGHTS.map((weight) => (
              <button
                key={weight.value}
                type="button"
                onClick={() => setFormData({ ...formData, barWeight: weight.value })}
                className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                  formData.barWeight === weight.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <div className="text-sm font-medium">{weight.label}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {formData.type === 'dumbbell' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Dumbbell Weight (each)
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, dumbbellWeight: Math.max(5, formData.dumbbellWeight - 5) })}
                className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-lg font-bold hover:bg-gray-200 transition-colors"
              >
                −
              </button>
              <span className="flex-1 text-center text-lg font-bold bg-gray-50 py-2 rounded-xl">
                {formData.dumbbellWeight} lbs
              </span>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, dumbbellWeight: formData.dumbbellWeight + 5 })}
                className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-lg font-bold hover:bg-gray-200 transition-colors"
              >
                +
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Number of Dumbbells
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, dumbbellCount: 1 })}
                className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                  formData.dumbbellCount === 1
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <div className="text-sm font-medium">Single (1)</div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, dumbbellCount: 2 })}
                className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                  formData.dumbbellCount === 2
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <div className="text-sm font-medium">Pair (2)</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rest Time */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Default Rest Time
        </label>
        <div className="grid grid-cols-3 gap-2">
          {REST_TIME_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => setFormData({ ...formData, defaultRestTime: preset.value })}
              className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                formData.defaultRestTime === preset.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <div className="text-sm font-medium">{preset.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-xl transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !formData.name.trim()}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Creating...' : 'Create Exercise'}
        </button>
      </div>
    </form>
  );
}