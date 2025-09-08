import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './ProjectEdit.css';

const ProjectEdit = ({ onProjectUpdated }) => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    name: ''
  });

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/projects/${projectId}`);
      const projectData = response.data;
      setProject(projectData);
      setFormData({ name: projectData.name });
      setError(null);
    } catch (err) {
      setError('Failed to load project: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Project name is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      const response = await axios.put(`/api/projects/${projectId}`, {
        name: formData.name.trim()
      });
      
      const updatedProject = response.data;
      setProject(updatedProject);
      setSuccess('Project updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
      
      // Notify parent component to refresh projects list
      if (onProjectUpdated) {
        onProjectUpdated();
      }
    } catch (err) {
      setError('Failed to update project: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setSaving(true);
      setError(null);
      
      await axios.delete(`/api/projects/${projectId}`);
      navigate('/');
    } catch (err) {
      setError('Failed to delete project: ' + (err.response?.data?.detail || err.message));
      setSaving(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="project-edit">
        <div className="project-edit-loading">Loading project...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="project-edit">
        <div className="project-edit-error">Project not found</div>
        <button className="btn btn-secondary" onClick={handleBack}>
          ← Back to Prompts
        </button>
      </div>
    );
  }

  return (
    <div className="project-edit">
      <div className="project-edit-header">
        <div>
          <button className="back-btn" onClick={handleBack}>
            ← Back to Prompts
          </button>
          <h1>Edit Project</h1>
          <div className="project-meta">
            <span className="project-id-badge">#{project.id}</span>
            <span className="project-created">
              Created {new Date(project.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div className="card">
        <form onSubmit={handleSubmit} className="project-form">
          <div className="form-group">
            <label htmlFor="name">Project Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter project name"
              disabled={saving}
            />
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={saving || !formData.name.trim()}
            >
              {saving ? 'Saving...' : 'Update Project'}
            </button>
            
            {project.name !== 'Default' && (
              <button 
                type="button" 
                className="btn btn-danger"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={saving}
              >
                Delete Project
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Delete Project</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete "<strong>{project.name}</strong>"?</p>
              <p className="warning-text">
                All prompts in this project will be moved to the Default project.
                This action cannot be undone.
              </p>
            </div>
            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={saving}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={saving}
              >
                {saving ? 'Deleting...' : 'Delete Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectEdit;