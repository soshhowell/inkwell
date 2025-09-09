import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import Header from './components/Header';
import PromptsSidebar from './components/PromptsSidebar';
import PromptDetails from './components/PromptDetails';
import ProjectEdit from './components/ProjectEdit';
import ProjectWhiteboard from './components/ProjectWhiteboard';
import ResizableLayout from './components/ResizableLayout';
import './App.css';

function PromptApp() {
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();
  const [prompts, setPrompts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('draft');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [showNewForm, setShowNewForm] = useState(false);

  // Extract project ID from URL params, use 0 if not present (for "all projects")
  const urlProjectId = params.projectId ? parseInt(params.projectId) : 0;

  // Fetch prompts and projects on component mount
  useEffect(() => {
    fetchProjects();
  }, []);

  // Set selected project based on URL parameter
  useEffect(() => {
    setSelectedProjectId(urlProjectId);
  }, [urlProjectId]);

  // Fetch prompts when project selection or status filter changes
  useEffect(() => {
    if (selectedProjectId !== null) {
      fetchPrompts();
    }
  }, [selectedProjectId, statusFilter]);

  // Handle URL parameter changes
  useEffect(() => {
    // Check for new prompt routes
    if (location.pathname.endsWith('/prompt/new') || params.promptId === 'new') {
      setSelectedPrompt(null);
      setShowNewForm(true);
    } else if (params.promptId) {
      // Convert promptId to number since URL params are strings  
      const promptId = parseInt(params.promptId);
      fetchPromptById(promptId);
    } else {
      // Root path - show empty state
      setSelectedPrompt(null);
      setShowNewForm(false);
    }
  }, [params.promptId, location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchProjects = async () => {
    try {
      const response = await axios.get('/api/projects');
      setProjects(response.data);
    } catch (err) {
      setError('Failed to fetch projects: ' + (err.response?.data?.detail || err.message));
    }
  };

  const fetchPrompts = async () => {
    try {
      setLoading(true);
      
      // Use project-based API if we have a project ID from URL
      let url;
      if (selectedProjectId !== null) {
        url = `/api/${selectedProjectId}/prompts`;
        const params = new URLSearchParams();
        
        if (statusFilter && statusFilter !== 'all') {
          params.append('status', statusFilter);
        }
        
        if (params.toString()) {
          url += '?' + params.toString();
        }
      } else {
        // Fallback to legacy API
        url = '/api/prompts?';
        const params = new URLSearchParams();
        
        if (statusFilter && statusFilter !== 'all') {
          params.append('status', statusFilter);
        }
        
        url += params.toString();
      }
      
      const response = await axios.get(url);
      setPrompts(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch prompts: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchPromptById = async (promptId) => {
    try {
      let url;
      if (selectedProjectId !== null && selectedProjectId !== 0) {
        // Use project-based API for specific projects
        url = `/api/${selectedProjectId}/prompt/${promptId}`;
      } else {
        // Use legacy API for all projects (project_id = 0) or when no project selected
        url = `/api/prompts/${promptId}`;
      }
      
      const response = await axios.get(url);
      setSelectedPrompt(response.data);
      setShowNewForm(false);
      setError(null);
    } catch (err) {
      setError('Failed to fetch prompt: ' + (err.response?.data?.detail || err.message));
      // If prompt not found, redirect to project root or home
      if (err.response?.status === 404) {
        if (selectedProjectId !== null && selectedProjectId !== 0) {
          navigate(`/${selectedProjectId}`);
        } else {
          navigate('/');
        }
      }
    }
  };

  const createPrompt = async (promptData) => {
    try {
      // If a project is selected, set the project_id on new prompts
      const promptWithProject = {
        ...promptData,
        project_id: promptData.project_id || selectedProjectId
      };
      
      let url;
      let response;
      
      if (selectedProjectId !== null) {
        // Use project-based API
        url = `/api/${selectedProjectId}/prompts`;
        response = await axios.post(url, promptWithProject);
      } else {
        // Use legacy API
        url = '/api/prompts';
        response = await axios.post(url, promptWithProject);
      }
      
      const newPrompt = response.data;
      setPrompts([newPrompt, ...prompts]);
      
      // Navigate to the newly created prompt using appropriate URL structure
      if (selectedProjectId !== null && selectedProjectId !== 0) {
        navigate(`/${selectedProjectId}/prompt/${newPrompt.id}`);
      } else {
        navigate(`/prompt/${newPrompt.id}`);
      }
      
      setError(null);
      return newPrompt;
    } catch (err) {
      setError('Failed to create prompt: ' + (err.response?.data?.detail || err.message));
      throw err;
    }
  };

  const updatePrompt = async (promptData) => {
    try {
      if (!selectedPrompt) return;
      
      let url;
      if (selectedProjectId !== null && selectedProjectId !== 0) {
        // Use project-based API for specific projects
        url = `/api/${selectedProjectId}/prompt/${selectedPrompt.id}`;
      } else {
        // Use legacy API for all projects (project_id = 0) or when no project selected
        url = `/api/prompts/${selectedPrompt.id}`;
      }
      
      const response = await axios.put(url, promptData);
      const updatedPrompt = response.data;
      
      // Update the prompts list with the updated prompt
      setPrompts(prompts.map(prompt => 
        prompt.id === selectedPrompt.id ? updatedPrompt : prompt
      ));
      
      // Update the selected prompt state
      setSelectedPrompt(updatedPrompt);
      
      // Refresh the prompts list to ensure we have the latest data
      // This is especially important when project assignments change
      fetchPrompts();
      
      // Clear any existing errors, but don't show success message since we have auto-save status
      setError(null);
      return updatedPrompt;
    } catch (err) {
      setError('Failed to update prompt: ' + (err.response?.data?.detail || err.message));
      throw err;
    }
  };

  const deletePrompt = async (promptId) => {
    try {
      let url;
      if (selectedProjectId !== null && selectedProjectId !== 0) {
        // Use project-based API for specific projects
        url = `/api/${selectedProjectId}/prompt/${promptId}`;
      } else {
        // Use legacy API for all projects (project_id = 0) or when no project selected
        url = `/api/prompts/${promptId}`;
      }
      
      await axios.delete(url);
      setPrompts(prompts.filter(prompt => prompt.id !== promptId));
      
      // If we deleted the selected prompt, navigate back to appropriate home
      if (selectedPrompt && selectedPrompt.id === promptId) {
        if (selectedProjectId !== null && selectedProjectId !== 0) {
          navigate(`/${selectedProjectId}`);
        } else {
          navigate('/');
        }
        setSelectedPrompt(null);
      }
      
      setSuccess('Prompt deleted successfully!');
      setError(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to delete prompt: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleNewPrompt = () => {
    if (selectedProjectId !== null && selectedProjectId !== 0) {
      navigate(`/${selectedProjectId}/prompt/new`);
    } else {
      navigate('/prompt/new');
    }
  };

  const handleSelectPrompt = (prompt) => {
    if (selectedProjectId !== null && selectedProjectId !== 0) {
      navigate(`/${selectedProjectId}/prompt/${prompt.id}`);
    } else {
      navigate(`/prompt/${prompt.id}`);
    }
  };

  const handleCancelForm = () => {
    setShowNewForm(false);
    setError(null);
    setSuccess(null);
  };

  const handleSelectProject = (projectId) => {
    setSelectedProjectId(projectId);
    // Clear selected prompt when changing project
    setSelectedPrompt(null);
    // Navigate to project-specific URL
    if (projectId !== 0) {
      navigate(`/${projectId}`);
    } else {
      navigate('/0'); // 0 means "all projects"
    }
  };

  const handleNewProject = async (projectName) => {
    try {
      const response = await axios.post('/api/projects', { name: projectName });
      const newProject = response.data;
      setProjects([...projects, newProject]);
      setSelectedProjectId(newProject.id);
      setSuccess('Project created successfully!');
      setError(null);
      setTimeout(() => setSuccess(null), 3000);
      navigate(`/${newProject.id}/prompt/new`);
      return newProject;
    } catch (err) {
      setError('Failed to create project: ' + (err.response?.data?.detail || err.message));
      throw err;
    }
  };

  const handleEditProject = (projectId) => {
    navigate(`/project/${projectId}`);
  };

  const handleStatusFilterChange = (newStatusFilter) => {
    setStatusFilter(newStatusFilter);
  };

  const handlePromptsReordered = () => {
    // Refresh prompts after reordering
    fetchPrompts();
  };

  // Find the currently selected project
  const selectedProject = selectedProjectId ? projects.find(p => p.id === selectedProjectId) : null;

  return (
    <div className="App">
      <Header />
      <ResizableLayout
        leftPanel={
          <PromptsSidebar 
            prompts={prompts} 
            onSelectPrompt={handleSelectPrompt}
            selectedPromptId={selectedPrompt?.id}
            onNewPrompt={handleNewPrompt}
            loading={loading}
            projects={projects}
            selectedProjectId={selectedProjectId}
            onSelectProject={handleSelectProject}
            onNewProject={handleNewProject}
            onEditProject={handleEditProject}
            statusFilter={statusFilter}
            onStatusFilterChange={handleStatusFilterChange}
            onPromptsReordered={handlePromptsReordered}
          />
        }
        mainContent={
          <main className="main-content">
            <PromptDetails
              selectedPrompt={selectedPrompt}
              showNewForm={showNewForm}
              onCreatePrompt={createPrompt}
              onUpdatePrompt={updatePrompt}
              onDeletePrompt={deletePrompt}
              onCancelForm={handleCancelForm}
              error={error}
              success={success}
              projects={projects}
              selectedProjectId={selectedProjectId}
            />
          </main>
        }
        rightPanel={
          <ProjectWhiteboard
            selectedProject={selectedProject}
            onError={setError}
            onSuccess={setSuccess}
          />
        }
      />
    </div>
  );
}

function ProjectEditApp() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get('/api/projects');
      setProjects(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch projects: ' + (err.response?.data?.detail || err.message));
      setLoading(false);
    }
  };

  const handleSelectProject = (projectId) => {
    setSelectedProjectId(projectId);
    if (projectId !== 0) {
      navigate(`/${projectId}`);
    } else {
      navigate('/0');
    }
  };

  const handleNewProject = async (projectName) => {
    try {
      const response = await axios.post('/api/projects', { name: projectName });
      const newProject = response.data;
      setProjects([...projects, newProject]);
      setSelectedProjectId(newProject.id);
      setSuccess('Project created successfully!');
      setError(null);
      setTimeout(() => setSuccess(null), 3000);
      navigate(`/${newProject.id}/prompt/new`);
      return newProject;
    } catch (err) {
      setError('Failed to create project: ' + (err.response?.data?.detail || err.message));
      throw err;
    }
  };

  const handleEditProject = (projectId) => {
    navigate(`/project/${projectId}`);
  };

  return (
    <div className="App">
      <Header />
      <ResizableLayout
        leftPanel={
          <PromptsSidebar 
            prompts={[]} 
            onSelectPrompt={() => {}}
            selectedPromptId={null}
            onNewPrompt={() => navigate('/0')}
            loading={false}
            projects={projects}
            selectedProjectId={selectedProjectId}
            onSelectProject={handleSelectProject}
            onNewProject={handleNewProject}
            onEditProject={handleEditProject}
            hidePrompts={true}
          />
        }
        mainContent={
          <main className="main-content">
            <ProjectEdit onProjectUpdated={fetchProjects} />
          </main>
        }
        rightPanel={null}
      />
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Legacy routes without project_id */}
        <Route path="/" element={<PromptApp />} />
        <Route path="/prompt/new" element={<PromptApp />} />
        <Route path="/prompt/:promptId" element={<PromptApp />} />
        
        {/* New project-based routes */}
        <Route path="/:projectId" element={<PromptApp />} />
        <Route path="/:projectId/prompt/new" element={<PromptApp />} />
        <Route path="/:projectId/prompt/:promptId" element={<PromptApp />} />
        
        {/* Project edit route */}
        <Route path="/project/:projectId" element={<ProjectEditApp />} />
      </Routes>
    </Router>
  );
}

export default App;