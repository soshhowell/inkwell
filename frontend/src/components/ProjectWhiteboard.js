import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import './ProjectWhiteboard.css';

const ProjectWhiteboard = ({ selectedProject, onError, onSuccess }) => {
  const [whiteboardContent, setWhiteboardContent] = useState('');
  const [autoSaving, setAutoSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [lastSavedContent, setLastSavedContent] = useState('');
  
  const autoSaveTimeoutRef = useRef(null);
  const syncTimeoutRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Load whiteboard content when selected project changes
  useEffect(() => {
    if (selectedProject) {
      setWhiteboardContent(selectedProject.whiteboard || '');
      setLastSavedContent(selectedProject.whiteboard || '');
      setHasUnsavedChanges(false);
    } else {
      setWhiteboardContent('');
      setLastSavedContent('');
      setHasUnsavedChanges(false);
    }

    // Clear timeouts when project changes
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = null;
    }
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }
  }, [selectedProject]);

  // Auto-save function
  const triggerAutoSave = useCallback(async (content) => {
    if (!selectedProject || content === lastSavedContent) return;
    
    setAutoSaving(true);
    try {
      await axios.put(`/api/projects/${selectedProject.id}/whiteboard`, {
        whiteboard: content
      });
      setLastSavedContent(content);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to save whiteboard:', error);
      if (onError) {
        onError('Failed to save whiteboard: ' + (error.response?.data?.detail || error.message));
      }
    } finally {
      setAutoSaving(false);
    }
  }, [selectedProject, lastSavedContent, onError]);

  // Manual save function for keyboard shortcuts
  const handleManualSave = useCallback(async () => {
    if (!selectedProject) return;
    
    // Cancel any pending auto-save to avoid duplicate saves
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = null;
    }
    
    // Trigger immediate save with current content
    await triggerAutoSave(whiteboardContent);
  }, [selectedProject, whiteboardContent, triggerAutoSave]);

  // Keyboard shortcut handler
  const handleKeyDown = useCallback((e) => {
    // Check for Cmd+S (Mac) or Ctrl+S (Windows/Linux)
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault(); // Prevent browser's default save behavior
      handleManualSave();
    }
  }, [handleManualSave]);

  // Add keyboard event listener
  useEffect(() => {
    // Add event listener to document for global keyboard shortcuts
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Sync check function (polls for updates from other windows)
  const checkForUpdates = useCallback(async () => {
    if (!selectedProject || isTyping) return;

    try {
      const response = await axios.get(`/api/projects/${selectedProject.id}`);
      const serverContent = response.data.whiteboard || '';
      
      // Only update if content has changed and user hasn't made local changes
      if (serverContent !== lastSavedContent && !hasUnsavedChanges) {
        setWhiteboardContent(serverContent);
        setLastSavedContent(serverContent);
      }
    } catch (error) {
      console.error('Failed to sync whiteboard:', error);
    }
  }, [selectedProject, isTyping, hasUnsavedChanges, lastSavedContent]);

  // Handle content change
  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setWhiteboardContent(newContent);
    setHasUnsavedChanges(newContent !== lastSavedContent);
    setIsTyping(true);

    // Clear existing timeouts
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set typing to false after 1 second of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);

    // Auto-save after 2 seconds of inactivity
    autoSaveTimeoutRef.current = setTimeout(() => {
      triggerAutoSave(newContent);
    }, 2000);
  };

  // Set up periodic sync check
  useEffect(() => {
    if (!selectedProject) return;

    const setupSyncInterval = () => {
      syncTimeoutRef.current = setTimeout(() => {
        checkForUpdates();
        setupSyncInterval(); // Schedule next check
      }, 5000); // Check every 5 seconds
    };

    setupSyncInterval();

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [selectedProject, checkForUpdates]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Get auto-save status text
  const getAutoSaveStatus = () => {
    if (autoSaving) {
      return <span className="auto-saving">Saving...</span>;
    }
    if (hasUnsavedChanges) {
      return <span className="unsaved">Unsaved changes</span>;
    }
    return <span className="saved">Saved</span>;
  };

  if (!selectedProject) {
    return (
      <div className="project-whiteboard">
        <div className="whiteboard-header">
          <h3>Project Whiteboard</h3>
        </div>
        <div className="whiteboard-empty">
          <div className="empty-state">
            <div className="empty-state-icon">📝</div>
            <h4>No project selected</h4>
            <p>Select a project to view and edit its whiteboard notes.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="project-whiteboard">
      <div className="whiteboard-header">
        <div>
          <h3>Project Whiteboard</h3>
          <span className="project-name">{selectedProject.name}</span>
        </div>
        <div className="auto-save-status">
          {getAutoSaveStatus()}
        </div>
      </div>
      <div className="whiteboard-content">
        <textarea
          value={whiteboardContent}
          onChange={handleContentChange}
          placeholder="Write your project notes here... 

This is your project's whiteboard - a place for:
• Project ideas and brainstorming
• Meeting notes and decisions
• To-do items and action plans
• Important links and references
• Anything else related to this project

Your notes will be automatically saved as you type."
          className="whiteboard-textarea"
        />
      </div>
    </div>
  );
};

export default ProjectWhiteboard;