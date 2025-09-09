import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import axios from 'axios';
import './PromptsSidebar.css';

const SortableItem = ({ id, prompt, onSelectPrompt, selectedPromptId }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`prompt-item-wrapper ${isDragging ? 'prompt-item-dragging' : ''}`}
    >
      <button
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
      <div
        className="drag-handle"
        {...attributes}
        {...listeners}
        title="Drag to reorder"
      >
        ☰
      </div>
    </div>
  );
};

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
  onStatusFilterChange,
  onPromptsReordered
}) => {
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [localPrompts, setLocalPrompts] = useState(prompts);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  React.useEffect(() => {
    setLocalPrompts(prompts);
  }, [prompts]);

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

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (active && over && active.id !== over.id) {
      const oldIndex = localPrompts.findIndex(prompt => prompt.id === active.id);
      const newIndex = localPrompts.findIndex(prompt => prompt.id === over.id);
      
      const newPrompts = arrayMove(localPrompts, oldIndex, newIndex);
      setLocalPrompts(newPrompts);

      try {
        // Send reorder request to backend using project-based API if available
        let url;
        if (selectedProjectId !== null) {
          url = `/api/${selectedProjectId}/prompts/reorder`;
        } else {
          url = '/api/prompts/reorder';
        }
        
        await axios.post(url, {
          prompt_ids: newPrompts.map(prompt => prompt.id)
        });

        // Notify parent to refresh data
        if (onPromptsReordered) {
          onPromptsReordered();
        }
      } catch (error) {
        console.error('Failed to reorder prompts:', error);
        // Revert on error
        setLocalPrompts(prompts);
      }
    }
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
            value={selectedProjectId === null ? '' : selectedProjectId} 
            onChange={(e) => onSelectProject(e.target.value ? parseInt(e.target.value) : 0)}
            className="project-select"
          >
            <option value={0}>All Projects</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          {selectedProjectId && selectedProjectId !== 0 && (
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
            {localPrompts.length === 0 ? (
              <div className="no-prompts">No prompts yet. Create your first prompt!</div>
            ) : (
              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext 
                  items={localPrompts.map(prompt => prompt.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {localPrompts.map((prompt) => (
                    <SortableItem
                      key={prompt.id}
                      id={prompt.id}
                      prompt={prompt}
                      onSelectPrompt={onSelectPrompt}
                      selectedPromptId={selectedPromptId}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </div>
        </>
      )}
    </aside>
  );
};

export default PromptsSidebar;