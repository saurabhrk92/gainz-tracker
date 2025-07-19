'use client';

import { useState } from 'react';
import { Exercise, MuscleGroup, EquipmentType } from '@/lib/types';
import { getDB } from '@/lib/storage/indexedDB';
import { MUSCLE_GROUPS, EQUIPMENT_TYPES, BAR_WEIGHTS, REST_TIME_PRESETS } from '@/lib/constants';
import { MuscleGroupIcon, EquipmentIcon } from '../ui/Icon';
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
          className="w-full px-3 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 min-h-[44px] text-sm"
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
              className={`p-3 rounded-lg border transition-all duration-200 ${
                formData.muscleGroup === key
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <div className="text-2xl mb-1">
                <MuscleGroupIcon name={info.icon as any} size={24} />
              </div>
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
              className={`p-3 rounded-lg border transition-all duration-200 ${
                formData.type === equipment.value
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <div className="text-2xl mb-1">
                <EquipmentIcon name={equipment.icon as any} size={24} />
              </div>
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
                className={`p-3 rounded-lg border transition-all duration-200 ${
                  formData.barWeight === weight.value
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <div className="text-sm font-medium">{weight.label}</div>
              </button>
            ))}
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
              className={`p-3 rounded-lg border transition-all duration-200 ${
                formData.defaultRestTime === preset.value
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
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
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !formData.name.trim()}
          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Creating...' : 'Create Exercise'}
        </button>
      </div>
    </form>
  );
}