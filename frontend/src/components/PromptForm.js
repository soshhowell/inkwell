import React, { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';

const PromptForm = forwardRef(({ onSubmit, initialData = null, projects = [], selectedProjectId = null, onAutoSave = null, onStatusChange = null, hideFormActions = false, hideNameField = false, hideStatusField = false, hideProjectField = false }, ref) => {
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
  const contentTextareaRef = useRef(null);

  // Expose form methods to parent component
  useImperativeHandle(ref, () => ({
    submitForm: () => {
      const form = document.querySelector('.prompt-form');
      if (form) {
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    },
    updateName: (newName) => {
      setFormData(prev => ({
        ...prev,
        name: newName
      }));
    },
    toggleStatus: () => {
      handleStatusToggle();
    },
    focusContent: () => {
      if (contentTextareaRef.current) {
        contentTextareaRef.current.focus();
      }
    }
  }));

  // Notify parent of status changes
  useEffect(() => {
    if (onStatusChange) {
      onStatusChange({
        submitting,
        autoSaving,
        hasUnsavedChanges
      });
    }
  }, [submitting, autoSaving, hasUnsavedChanges, onStatusChange]);

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

  // Generate auto name from content
  const generateAutoName = useCallback((content) => {
    if (!content || !content.trim()) return '';
    
    // Get first few words, clean them up
    const words = content.trim()
      .split(/\s+/)
      .slice(0, 6) // Take first 6 words
      .join(' ')
      .replace(/[^\w\s-]/g, '') // Remove special characters except hyphens
      .trim();
    
    // Limit length and add ellipsis if needed
    if (words.length > 50) {
      return words.substring(0, 47) + '...';
    }
    
    return words || 'Untitled Prompt';
  }, []);

  // Auto-save function
  const triggerAutoSave = useCallback(async (data) => {
    if (!onAutoSave) return;
    
    // For new prompts, only auto-save if there's content
    if (!initialData && !data.content.trim()) return;
    
    setAutoSaving(true);
    try {
      // Auto-generate name if empty but has content
      const dataToSave = { ...data };
      if (!dataToSave.name.trim() && dataToSave.content.trim()) {
        dataToSave.name = generateAutoName(dataToSave.content);
        // Update the form state with the generated name
        setFormData(prev => ({ ...prev, name: dataToSave.name }));
      }
      
      await onAutoSave(dataToSave);
      setHasUnsavedChanges(false);
      initialDataRef.current = { ...initialDataRef.current, ...dataToSave };
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setAutoSaving(false);
    }
  }, [onAutoSave, generateAutoName, initialData]);

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
          const dataToSubmit = { ...formData };
          if (!dataToSubmit.name.trim() && dataToSubmit.content.trim()) {
            dataToSubmit.name = generateAutoName(dataToSubmit.content);
            setFormData(prev => ({ ...prev, name: dataToSubmit.name }));
          }
          if (dataToSubmit.name.trim() || dataToSubmit.content.trim()) {
            onSubmit(dataToSubmit);
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
  }, [formData, initialData, triggerAutoSave, onSubmit, generateAutoName]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStatusToggle = () => {
    const updatedData = {
      ...formData,
      status: formData.status === 'draft' ? 'archived' : 'draft'
    };
    
    setFormData(updatedData);
    
    // Immediately trigger auto-save for status changes
    if (onAutoSave && initialData) {
      triggerAutoSave(updatedData);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // Auto-generate name if empty but has content
      const dataToSubmit = { ...formData };
      if (!dataToSubmit.name.trim() && dataToSubmit.content.trim()) {
        dataToSubmit.name = generateAutoName(dataToSubmit.content);
        // Update the form state with the generated name
        setFormData(prev => ({ ...prev, name: dataToSubmit.name }));
      }
      
      await onSubmit(dataToSubmit);
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
        {!hideNameField && (
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
        )}

        {!hideStatusField && (
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
        )}

        {!hideProjectField && (
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
        )}
      </div>

      <div className="form-group">
        <label htmlFor="content">Content</label>
        <textarea
          ref={contentTextareaRef}
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

      {!hideFormActions && (
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
      )}
    </form>
  );
});

PromptForm.displayName = 'PromptForm';

export default PromptForm;