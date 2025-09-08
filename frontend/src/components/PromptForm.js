import React, { useState, useEffect, useRef, useCallback } from 'react';

const PromptForm = ({ onSubmit, initialData = null, projects = [], selectedProjectId = null, onAutoSave = null }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    status: initialData?.status || 'draft',
    content: initialData?.content || '',
    project_id: initialData?.project_id || selectedProjectId || ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const autoSaveTimeoutRef = useRef(null);
  const initialDataRef = useRef(initialData);

  // Update form data when initialData changes (when switching between prompts)
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        status: initialData.status || 'draft',
        content: initialData.content || '',
        project_id: initialData.project_id || ''
      });
      setHasUnsavedChanges(false);
      initialDataRef.current = initialData;
    } else {
      // Reset form for new prompt creation
      setFormData({
        name: '',
        status: 'draft',
        content: '',
        project_id: selectedProjectId || ''
      });
      setHasUnsavedChanges(false);
      initialDataRef.current = null;
    }
    
    // Clear any pending auto-save when switching prompts
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = null;
    }
  }, [initialData, selectedProjectId]);

  // Auto-save function
  const triggerAutoSave = useCallback(async (data) => {
    if (!onAutoSave) return;
    
    setAutoSaving(true);
    try {
      await onAutoSave(data);
      setHasUnsavedChanges(false);
      initialDataRef.current = { ...initialDataRef.current, ...data };
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setAutoSaving(false);
    }
  }, [onAutoSave]);

  // Check if form data has changes
  const hasFormChanged = useCallback((newData) => {
    const initial = initialDataRef.current;
    
    // For new prompts, check if there's content worth saving
    if (!initial) {
      return newData.name.trim() !== '' || newData.content.trim() !== '';
    }
    
    // For existing prompts, check if data has changed
    return (
      newData.name !== (initial.name || '') ||
      newData.status !== (initial.status || 'draft') ||
      newData.content !== (initial.content || '') ||
      newData.project_id !== (initial.project_id || '')
    );
  }, []);

  // Debounced auto-save effect
  useEffect(() => {
    if (!hasFormChanged(formData)) {
      setHasUnsavedChanges(false);
      return;
    }

    setHasUnsavedChanges(true);
    
    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new timeout for auto-save
    autoSaveTimeoutRef.current = setTimeout(() => {
      triggerAutoSave(formData);
    }, 2000);

    // Cleanup function
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [formData, hasFormChanged, triggerAutoSave]);

  // Handle Cmd+S/Ctrl+S keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check for Cmd+S (Mac) or Ctrl+S (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault(); // Prevent browser's default save behavior
        
        // Trigger the appropriate save action
        if (initialData) {
          // For existing prompts, trigger autosave immediately
          triggerAutoSave(formData);
        } else {
          // For new prompts, call onSubmit directly
          if (formData.name.trim()) {
            onSubmit(formData);
          }
        }
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [formData, initialData, triggerAutoSave, onSubmit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStatusToggle = () => {
    setFormData(prev => ({
      ...prev,
      status: prev.status === 'draft' ? 'archived' : 'draft'
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      await onSubmit(formData);
      // Reset form after successful submission
      if (!initialData) {
        setFormData({
          name: '',
          status: 'draft',
          content: '',
          project_id: selectedProjectId || ''
        });
      }
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="prompt-form">
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="name">Prompt Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Enter prompt name"
            disabled={submitting}
            tabIndex={1}
          />
        </div>

        <div className="form-group">
          <label>Status: {formData.status === 'draft' ? 'Draft' : 'Archive'}</label>
          <button
            type="button"
            onClick={handleStatusToggle}
            disabled={submitting}
            tabIndex={4}
            className={`status-toggle ${formData.status === 'draft' ? 'draft' : 'archived'}`}
          >
            {formData.status === 'draft' ? 'Archive' : 'Draft'}
          </button>
        </div>

        <div className="form-group">
          <label htmlFor="project_id">Project</label>
          <select
            id="project_id"
            name="project_id"
            value={formData.project_id}
            onChange={handleChange}
            disabled={submitting}
            tabIndex={5}
          >
            <option value="">Select Project (optional)</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="content">Content</label>
        <textarea
          id="content"
          name="content"
          value={formData.content}
          onChange={handleChange}
          rows="8"
          placeholder="Enter your prompt content..."
          disabled={submitting}
          tabIndex={2}
        />
      </div>

      <div className="form-actions">
        <button 
          type="submit" 
          className="btn"
          disabled={submitting || !formData.name.trim()}
          tabIndex={3}
        >
          {submitting ? 'Creating...' : initialData ? 'Update Prompt' : 'Create Prompt'}
        </button>
        {onAutoSave && (
          <div className="auto-save-status">
            {autoSaving && <span className="auto-saving">Auto-saving...</span>}
            {!autoSaving && hasUnsavedChanges && <span className="unsaved">Unsaved changes</span>}
            {!autoSaving && !hasUnsavedChanges && (initialData || !hasFormChanged(formData)) && <span className="saved">Saved</span>}
          </div>
        )}
      </div>
    </form>
  );
};

export default PromptForm;