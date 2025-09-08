import React, { useState } from 'react';
import './PromptsSidebar.css';

const PromptsSidebar = ({ 
  prompts, 
  onSelectPrompt, 
  selectedPromptId, 
  onNewPrompt, 
  loading,
  projects,
  selectedProjectId,
  onSelectProject,
  onNewProject,
  onEditProject,
  hidePrompts = false,
  statusFilter = 'draft',
  onStatusFilterChange
}) => {
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const handleNewProjectSubmit = async (e) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      try {
        await onNewProject(newProjectName.trim());
        setNewProjectName('');
        setShowNewProjectForm(false);
      } catch (error) {
        console.error('Failed to create project:', error);
      }
    }
  };

  const handleNewProjectCancel = () => {
    setNewProjectName('');
    setShowNewProjectForm(false);
  };

  if (loading) {
    return (
      <aside className="prompts-sidebar">
        <div className="prompts-header">
          <h3>Prompts</h3>
        </div>
        <div className="prompts-loading">Loading prompts...</div>
      </aside>
    );
  }

  return (
    <aside className="prompts-sidebar">
      <div className="project-selector">
        <label htmlFor="project-select">Project:</label>
        <div className="project-selector-row">
          <select 
            id="project-select"
            value={selectedProjectId || ''} 
            onChange={(e) => onSelectProject(e.target.value ? parseInt(e.target.value) : null)}
            className="project-select"
          >
            <option value="">All Projects</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          {selectedProjectId && (
            <button 
              className="edit-project-btn" 
              onClick={() => onEditProject(selectedProjectId)}
              title="Edit project"
            >
              ✏️
            </button>
          )}
          <button 
            className="new-project-btn" 
            onClick={() => setShowNewProjectForm(true)}
            title="Add new project"
          >
            ➕
          </button>
        </div>
        
        {showNewProjectForm && (
          <form onSubmit={handleNewProjectSubmit} className="new-project-form">
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Project name"
              className="new-project-input"
              autoFocus
            />
            <div className="new-project-buttons">
              <button type="submit" className="save-project-btn">Save</button>
              <button type="button" className="cancel-project-btn" onClick={handleNewProjectCancel}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {!hidePrompts && (
        <>
          <div className="prompts-header">
            <h3>
              Prompts ({prompts.length})
              {selectedProjectId && projects.find(p => p.id === selectedProjectId) && (
                <span className="project-filter-label">
                  - {projects.find(p => p.id === selectedProjectId)?.name}
                </span>
              )}
            </h3>
            <button className="new-prompt-btn" onClick={onNewPrompt}>
              ➕ New Prompt
            </button>
          </div>
          
          <div className="status-filters">
            <button 
              className={`status-filter-btn ${statusFilter === 'draft' ? 'active' : ''}`}
              onClick={() => onStatusFilterChange('draft')}
            >
              Draft
            </button>
            <button 
              className={`status-filter-btn ${statusFilter === 'archived' ? 'active' : ''}`}
              onClick={() => onStatusFilterChange('archived')}
            >
              Archive
            </button>
            <button 
              className={`status-filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => onStatusFilterChange('all')}
            >
              All
            </button>
          </div>
          <div className="prompts-list">
            {prompts.length === 0 ? (
              <div className="no-prompts">No prompts yet. Create your first prompt!</div>
            ) : (
              prompts.map((prompt) => (
                <button
                  key={prompt.id}
                  className={`prompt-button ${selectedPromptId === prompt.id ? 'prompt-button-selected' : ''}`}
                  onClick={() => onSelectPrompt(prompt)}
                >
                  <div className="prompt-button-content">
                    <span className="prompt-name">{prompt.name}</span>
                    <span className={`prompt-status status-${prompt.status}`}>
                      {prompt.status}
                    </span>
                  </div>
                  {prompt.project_name && (
                    <div className="prompt-project">{prompt.project_name}</div>
                  )}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </aside>
  );
};

export default PromptsSidebar;