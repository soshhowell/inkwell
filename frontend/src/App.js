import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import Header from './components/Header';
import PromptsSidebar from './components/PromptsSidebar';
import PromptDetails from './components/PromptDetails';
import ProjectEdit from './components/ProjectEdit';
import ProjectWhiteboard from './components/ProjectWhiteboard';
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

  // Fetch prompts and projects on component mount
  useEffect(() => {
    fetchProjects();
    fetchPrompts();
  }, []);

  // Fetch prompts when project selection or status filter changes
  useEffect(() => {
    fetchPrompts();
  }, [selectedProjectId, statusFilter]);

  // Handle URL parameter changes
  useEffect(() => {
    // Check for /prompt/new directly from path
    if (location.pathname === '/prompt/new') {
      setSelectedPrompt(null);
      setShowNewForm(true);
    } else if (params.promptId === 'new') {
      // Show new prompt form
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
      let url = '/api/prompts?';
      const params = new URLSearchParams();
      
      if (selectedProjectId) {
        params.append('project_id', selectedProjectId);
      }
      
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      url += params.toString();
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
      const response = await axios.get(`/api/prompts/${promptId}`);
      setSelectedPrompt(response.data);
      setShowNewForm(false);
      setError(null);
    } catch (err) {
      setError('Failed to fetch prompt: ' + (err.response?.data?.detail || err.message));
      // If prompt not found, redirect to home
      if (err.response?.status === 404) {
        navigate('/');
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
      
      const response = await axios.post('/api/prompts', promptWithProject);
      const newPrompt = response.data;
      setPrompts([newPrompt, ...prompts]);
      navigate(`/prompt/${newPrompt.id}`); // Navigate to the newly created prompt
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
      
      const response = await axios.put(`/api/prompts/${selectedPrompt.id}`, promptData);
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
      await axios.delete(`/api/prompts/${promptId}`);
      setPrompts(prompts.filter(prompt => prompt.id !== promptId));
      // If we deleted the selected prompt, navigate back to home
      if (selectedPrompt && selectedPrompt.id === promptId) {
        navigate('/');
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
    navigate('/prompt/new');
  };

  const handleSelectPrompt = (prompt) => {
    navigate(`/prompt/${prompt.id}`);
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
    navigate('/');
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
      navigate('/prompt/new');
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

  // Find the currently selected project
  const selectedProject = selectedProjectId ? projects.find(p => p.id === selectedProjectId) : null;

  return (
    <div className="App">
      <Header />
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
      />
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
      <ProjectWhiteboard
        selectedProject={selectedProject}
        onError={setError}
        onSuccess={setSuccess}
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
    navigate('/');
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
      navigate('/prompt/new');
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
      <PromptsSidebar 
        prompts={[]} 
        onSelectPrompt={() => {}}
        selectedPromptId={null}
        onNewPrompt={() => navigate('/')}
        loading={false}
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelectProject={handleSelectProject}
        onNewProject={handleNewProject}
        onEditProject={handleEditProject}
        hidePrompts={true}
      />
      <main className="main-content">
        <ProjectEdit onProjectUpdated={fetchProjects} />
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PromptApp />} />
        <Route path="/prompt/new" element={<PromptApp />} />
        <Route path="/prompt/:promptId" element={<PromptApp />} />
        <Route path="/project/:projectId" element={<ProjectEditApp />} />
      </Routes>
    </Router>
  );
}

export default App;