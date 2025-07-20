'use client';

import { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ConfirmModal from '../components/ui/ConfirmModal';
import TemplateForm from '../components/templates/TemplateForm';
import { WorkoutTemplate } from '@/lib/types';
import { getDB } from '@/lib/storage/indexedDB';
import { MUSCLE_GROUPS, WEEK_DAYS } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import { MuscleGroupIcon, UIIcon, ActionIcon } from '../components/ui/Icon';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const db = await getDB();
      const allTemplates = await db.getTemplates();
      setTemplates(allTemplates);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSuccess = (template: WorkoutTemplate) => {
    setShowCreateModal(false);
    setEditingTemplate(null);
    loadTemplates(); // Refresh the list
  };

  const handleEditTemplate = (template: WorkoutTemplate) => {
    setEditingTemplate(template);
    setShowCreateModal(true);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const db = await getDB();
      
      // Check if this template has been used in any workouts
      const workouts = await db.getWorkouts();
      const usedInWorkouts = workouts.filter(workout => workout.templateId === templateId);
      
      let confirmMessage = 'Are you sure you want to delete this template?';
      if (usedInWorkouts.length > 0) {
        confirmMessage = `This template has been used in ${usedInWorkouts.length} workout(s). Deleting it will not affect your workout history, but you won't be able to use this template again. Are you sure you want to delete it?`;
      }
      
      setDeleteTemplateId(templateId);
      setDeleteMessage(confirmMessage);
      setShowDeleteConfirm(true);
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

  const confirmDeleteTemplate = async () => {
    if (!deleteTemplateId) return;
    
    try {
      const db = await getDB();
      console.log('Attempting to delete template:', deleteTemplateId);
      await db.deleteTemplate(deleteTemplateId);
      console.log('Template deleted successfully');
      
      loadTemplates(); // Refresh the list
    } catch (error) {
      console.error('Failed to delete template:', error);
    } finally {
      setDeleteTemplateId(null);
      setDeleteMessage('');
    }
  };

  const toggleTemplateActive = async (template: WorkoutTemplate) => {
    try {
      const db = await getDB();
      
      // If activating this template, deactivate others for the same day
      if (!template.isActive) {
        const sameDayTemplates = templates.filter(t => t.day === template.day && t.id !== template.id);
        for (const t of sameDayTemplates) {
          if (t.isActive) {
            await db.updateTemplate(t.id, { isActive: false });
          }
        }
      }
      
      await db.updateTemplate(template.id, { isActive: !template.isActive });
      loadTemplates(); // Refresh the list
    } catch (error) {
      console.error('Failed to toggle template:', error);
      console.error('Failed to update template. Please try again.');
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
        <h1 className="text-2xl font-bold text-black">Workout Templates</h1>
        <p className="text-gray-500 text-sm mt-1">Create and manage your workout routines</p>
      </div>

      {/* Main Content */}
      <main className="space-y-6">
        {/* Create Button */}
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="w-full"
          size="lg"
        >
          Create New Template
        </Button>

        {/* Templates List */}
        <div>
          <h2 className="text-lg font-bold text-black mb-4">Your Templates</h2>
          <div className="space-y-3">
            {templates.length > 0 ? (
              templates.map((template) => {
                const muscleGroupInfo = template.muscleGroup === 'full_body' 
                  ? { label: 'Full Body', icon: 'workout', color: '#7c3aed' }
                  : MUSCLE_GROUPS[template.muscleGroup];
                
                const dayInfo = WEEK_DAYS.find(d => d.value === template.day);
                
                return (
                  <Card key={template.id} className="relative">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                            style={{ backgroundColor: muscleGroupInfo.color }}
                          >
                            {template.muscleGroup === 'full_body' ? (
                              <UIIcon name="workout" size={20} color="white" />
                            ) : (
                              <MuscleGroupIcon 
                                name={muscleGroupInfo.icon as any} 
                                size={20} 
                                color="white"
                              />
                            )}
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-black">
                              {template.name}
                            </h3>
                            <p className="text-sm text-gray-500 flex items-center gap-2">
                              <span>{dayInfo?.label}</span>
                              <span>•</span>
                              <span>{template.exercises.length} exercises</span>
                            </p>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              onClick={() => toggleTemplateActive(template)}
                              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
                                template.isActive 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                              }`}
                            >
                              {template.isActive ? 'Active' : 'Inactive'}
                            </button>
                            <div 
                              className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                              style={{ backgroundColor: muscleGroupInfo.color }}
                            >
                              {muscleGroupInfo.label}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 text-gray-500">
                            <span className="text-xs">Last used: {template.lastUsed ? formatDate(new Date(template.lastUsed), 'MMM d') : 'Never'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2 ml-3 min-w-0">
                        <Button
                          variant="glass"
                          size="sm"
                          onClick={() => handleEditTemplate(template)}
                          className="text-xs"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="glass"
                          size="sm"
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="text-xs text-gray-600 hover:text-red-600"
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
                <UIIcon name="templates" size={48} color="#9CA3AF" className="mb-4" />
                <h3 className="text-lg font-bold text-black mb-2">No Templates Yet</h3>
                <p className="text-gray-600 text-sm">Create your first workout template to get started!</p>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Create/Edit Template Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingTemplate(null);
        }}
        title={editingTemplate ? 'Edit Template' : 'Create New Template'}
        size="xl"
      >
        <TemplateForm
          template={editingTemplate || undefined}
          onSuccess={handleTemplateSuccess}
          onCancel={() => {
            setShowCreateModal(false);
            setEditingTemplate(null);
          }}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteTemplate}
        title="Delete Template"
        message={deleteMessage}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}