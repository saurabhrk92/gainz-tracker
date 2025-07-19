'use client';

import { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import TemplateForm from '../components/templates/TemplateForm';
import { WorkoutTemplate } from '@/lib/types';
import { getDB } from '@/lib/storage/indexedDB';
import { MUSCLE_GROUPS, WEEK_DAYS } from '@/lib/constants';
import { formatDate } from '@/lib/utils';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null);

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
      
      const confirmed = confirm(confirmMessage);
      if (!confirmed) return;

      console.log('Attempting to delete template:', templateId);
      await db.deleteTemplate(templateId);
      console.log('Template deleted successfully');
      
      loadTemplates(); // Refresh the list
      alert('Template deleted successfully!');
    } catch (error) {
      console.error('Failed to delete template:', error);
      alert(`Failed to delete template: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
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
      alert('Failed to update template. Please try again.');
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
      <header className="bg-gradient-primary text-white p-4 safe-top relative overflow-hidden rounded-b-3xl mb-4 mx-[-16px] mt-[-16px]">
        <div className="relative z-10 px-2">
          <h1 className="text-xl font-bold font-display">📋 Workout Templates</h1>
          <p className="text-white/90 mt-1 text-sm">Design your perfect workout routines</p>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-6 translate-x-6 pointer-events-none"></div>
      </header>

      {/* Main Content */}
      <main className="space-y-6">
        {/* Create Button */}
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="w-full text-xl"
          size="lg"
        >
          <span className="text-2xl">✨</span>
          Create New Template
        </Button>

        {/* Templates List */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 font-display">
            🗂️ Your Templates
          </h2>
          <div className="space-y-4">
            {templates.length > 0 ? (
              templates.map((template) => {
                const muscleGroupInfo = template.muscleGroup === 'full_body' 
                  ? { label: 'Full Body', emoji: '🏋️', color: '#667eea' }
                  : MUSCLE_GROUPS[template.muscleGroup];
                
                const dayInfo = WEEK_DAYS.find(d => d.value === template.day);
                
                return (
                  <Card
                    key={template.id} 
                    className="relative overflow-hidden transform hover:scale-[1.02] hover:-translate-y-1 transition-all duration-200 border-l-4"
                    style={{ borderLeftColor: muscleGroupInfo.color }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                          <div 
                            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold shadow-md text-2xl"
                            style={{ backgroundColor: muscleGroupInfo.color }}
                          >
                            {muscleGroupInfo.emoji}
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-800 font-display">
                              {template.name}
                            </h3>
                            <p className="text-sm text-gray-600 flex items-center gap-2 font-medium">
                              <span className="text-lg">📅</span>
                              <span>{dayInfo?.label}</span>
                              <span>•</span>
                              <span>{template.exercises.length} exercises</span>
                            </p>
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl p-4 space-y-3">
                          <div className="flex items-center gap-3 flex-wrap">
                            <button
                              onClick={() => toggleTemplateActive(template)}
                              className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-md transition-all duration-200 ${
                                template.isActive 
                                  ? 'bg-gradient-success text-white' 
                                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                              }`}
                            >
                              <span className={`w-2 h-2 rounded-full ${template.isActive ? 'bg-white animate-pulse' : 'bg-gray-400'}`}></span>
                              {template.isActive ? 'Active' : 'Inactive'}
                            </button>
                            <div 
                              className="px-4 py-2 rounded-xl text-sm font-bold text-white shadow-md"
                              style={{ backgroundColor: muscleGroupInfo.color }}
                            >
                              {muscleGroupInfo.label}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 text-gray-600">
                            <span className="text-sm">📅</span>
                            <span className="text-sm font-medium">
                              Last used: {template.lastUsed ? formatDate(new Date(template.lastUsed), 'MMM d') : 'Never'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 relative z-10">
                        <Button
                          variant="glass"
                          size="sm"
                          onClick={() => handleEditTemplate(template)}
                          className="shrink-0"
                        >
                          ✏️ Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="shrink-0"
                        >
                          🗑️
                        </Button>
                      </div>
                    </div>
                    
                    {/* Subtle background gradient */}
                    <div 
                      className="absolute top-0 right-0 w-24 h-24 opacity-5 rounded-full -translate-y-6 translate-x-6 pointer-events-none"
                      style={{ backgroundColor: muscleGroupInfo.color }}
                    ></div>
                  </Card>
                );
              })
            ) : (
              <Card className="text-center space-y-6 py-12">
                <div className="text-8xl opacity-50">📝</div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-3 font-display">No Templates Yet</h3>
                  <p className="text-lg text-gray-600 mb-6">Create your first workout template to get started!</p>
                  <Button 
                    onClick={() => setShowCreateModal(true)}
                    size="lg"
                    className="text-lg"
                  >
                    ✨ Get Started
                  </Button>
                </div>
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
    </div>
  );
}