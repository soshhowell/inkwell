import React, { useState, useRef, useEffect } from 'react';
import PromptForm from './PromptForm';

const PromptDetails = ({ 
  selectedPrompt, 
  showNewForm, 
  onCreatePrompt, 
  onUpdatePrompt, 
  onDeletePrompt,
  onCancelForm,
  error,
  success,
  projects = [],
  selectedProjectId = null
}) => {
  const [formStatus, setFormStatus] = useState({ submitting: false, autoSaving: false, hasUnsavedChanges: false });
  const [promptName, setPromptName] = useState('');
  const formRef = useRef();
  
  // Create a virtual prompt for new prompts
  const currentPrompt = selectedPrompt || { 
    id: 'new', 
    name: '', 
    status: 'draft', 
    content: '', 
    project_id: selectedProjectId || '' 
  };
  const isNewPrompt = !selectedPrompt;

  // Update prompt name when switching between different prompts (but not when updating the same prompt)
  useEffect(() => {
    if (selectedPrompt) {
      setPromptName(selectedPrompt.name || '');
    } else {
      // Clear the name when switching to new prompt mode
      setPromptName('');
      // Focus on content area for new prompts
      if (showNewForm && formRef.current && formRef.current.focusContent) {
        setTimeout(() => {
          formRef.current.focusContent();
        }, 100);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPrompt?.id, showNewForm]); // Only depend on the prompt ID, not the name

  // Handle manual submit button click (works for both create and update)
  const handleManualSubmit = () => {
    if (formRef.current && formRef.current.submitForm) {
      formRef.current.submitForm();
    }
  };

  // Handle archive/draft toggle
  const handleArchiveToggle = () => {
    if (formRef.current && formRef.current.toggleStatus) {
      formRef.current.toggleStatus();
    }
  };

  // Auto-save handler (works for both new and existing prompts)
  const handleAutoSave = async (formData) => {
    if (isNewPrompt) {
      // For new prompts, auto-save by creating the prompt if there's content
      if (formData.content.trim() && onCreatePrompt) {
        await onCreatePrompt(formData);
        // Update the name field if it was auto-generated
        if (formData.name && formData.name !== promptName) {
          setPromptName(formData.name);
        }
      }
    } else if (onUpdatePrompt) {
      // For existing prompts, update the prompt
      await onUpdatePrompt(formData);
      // Update the name field if it was auto-generated
      if (formData.name && formData.name !== promptName) {
        setPromptName(formData.name);
      }
    }
  };
  
  // Show empty state only when no prompt is selected AND not in new form mode
  if (!selectedPrompt && !showNewForm) {
    return (
      <div className="prompt-details">
        <div className="empty-state">
          <div className="empty-state-icon">💬</div>
          <h2>Select a prompt to view details</h2>
          <p>Choose a prompt from the list on the left to see its details and options.</p>
          <p>Or click "New Prompt" to create a new one.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="prompt-details">
      <div className="prompt-details-header">
        <div>
          <input
            type="text"
            className="prompt-name-input"
            value={promptName}
            onChange={(e) => {
              setPromptName(e.target.value);
              if (formRef.current && formRef.current.updateName) {
                formRef.current.updateName(e.target.value);
              }
            }}
            placeholder="Enter prompt name"
            disabled={formStatus.submitting}
          />
          <div className="prompt-meta">
            {!isNewPrompt && currentPrompt && (
              <>
                <span className="prompt-id-badge">#{currentPrompt.id}</span>
                <span className={`prompt-status-badge status-${currentPrompt.status}`}>
                  {currentPrompt.status}
                </span>
              </>
            )}
            <div className="auto-save-status">
              {formStatus.autoSaving && <span className="auto-saving">Auto-saving...</span>}
              {!formStatus.autoSaving && formStatus.hasUnsavedChanges && <span className="unsaved">Unsaved changes</span>}
              {!formStatus.autoSaving && !formStatus.hasUnsavedChanges && <span className="saved">Saved</span>}
            </div>
            {currentPrompt?.project_name && (
              <span className="prompt-project-badge">📁 {currentPrompt.project_name}</span>
            )}
          </div>
        </div>
        <div className="prompt-actions">
          <button 
            className="btn"
            onClick={handleManualSubmit}
            disabled={formStatus.submitting}
          >
            {formStatus.submitting ? (isNewPrompt ? 'Creating...' : 'Updating...') : (isNewPrompt ? 'Create Prompt' : 'Update Prompt')}
          </button>
          {!isNewPrompt && currentPrompt && (
            <button 
              className="btn btn-secondary"
              onClick={handleArchiveToggle}
              disabled={formStatus.submitting}
            >
              {currentPrompt.status === 'draft' ? 'Archive' : 'Draft'}
            </button>
          )}
          {!isNewPrompt && currentPrompt ? (
            <button 
              className="btn btn-danger" 
              onClick={() => onDeletePrompt(currentPrompt.id)}
            >
              Delete
            </button>
          ) : (
            <button className="btn btn-secondary" onClick={onCancelForm}>
              Cancel
            </button>
          )}
        </div>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div className="card">
        <PromptForm 
          ref={formRef}
          onSubmit={isNewPrompt ? onCreatePrompt : onUpdatePrompt} 
          initialData={isNewPrompt ? null : currentPrompt}
          projects={projects}
          selectedProjectId={selectedProjectId}
          onAutoSave={handleAutoSave}
          onStatusChange={setFormStatus}
          hideFormActions={true}
          hideNameField={true}
          hideStatusField={true}
          hideProjectField={true}
        />
      </div>
    </div>
  );
};

export default PromptDetails;