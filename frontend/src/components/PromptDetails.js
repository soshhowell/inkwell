import React from 'react';
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
  // Auto-save handler for existing prompts
  const handleAutoSave = async (formData) => {
    if (selectedPrompt && onUpdatePrompt) {
      await onUpdatePrompt(formData);
    }
  };

  // Auto-save handler for new prompts
  const handleNewPromptAutoSave = async (formData) => {
    // Only autosave if there's actually content to save
    if (formData.name.trim() || formData.content.trim()) {
      // Create the prompt automatically
      await onCreatePrompt(formData);
    }
  };
  if (showNewForm) {
    return (
      <div className="prompt-details">
        <div className="prompt-details-header">
          <h1>Create New Prompt</h1>
          <button className="btn btn-secondary" onClick={onCancelForm}>
            Cancel
          </button>
        </div>
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}
        <div className="card">
          <PromptForm 
            onSubmit={onCreatePrompt} 
            projects={projects}
            selectedProjectId={selectedProjectId}
            onAutoSave={handleNewPromptAutoSave}
          />
        </div>
      </div>
    );
  }

  if (!selectedPrompt) {
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
          <h1>Edit Prompt</h1>
          <div className="prompt-meta">
            <span className="prompt-id-badge">#{selectedPrompt.id}</span>
            <span className={`prompt-status-badge status-${selectedPrompt.status}`}>
              {selectedPrompt.status}
            </span>
            {selectedPrompt.project_name && (
              <span className="prompt-project-badge">📁 {selectedPrompt.project_name}</span>
            )}
          </div>
        </div>
        <div className="prompt-actions">
          <button 
            className="btn btn-danger" 
            onClick={() => onDeletePrompt(selectedPrompt.id)}
          >
            Delete
          </button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div className="card">
        <PromptForm 
          onSubmit={onUpdatePrompt} 
          initialData={selectedPrompt}
          projects={projects}
          selectedProjectId={selectedProjectId}
          onAutoSave={handleAutoSave}
        />
      </div>
    </div>
  );
};

export default PromptDetails;