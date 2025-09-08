import React from 'react';

const Dashboard = () => {
  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome to your Inkwell dashboard</p>
      </div>
      
      <div className="grid">
        <div className="card">
          <h2>📊 System Status</h2>
          <div className="status-grid">
            <div className="status-item">
              <span className="status-label">Backend API</span>
              <span className="status-value status-healthy">✅ Healthy</span>
            </div>
            <div className="status-item">
              <span className="status-label">Database</span>
              <span className="status-value status-healthy">✅ Connected</span>
            </div>
            <div className="status-item">
              <span className="status-label">Frontend</span>
              <span className="status-value status-healthy">✅ Running</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h2>🚀 Quick Actions</h2>
          <div className="action-buttons">
            <button className="btn">View API Docs</button>
            <button className="btn btn-secondary">Create New Item</button>
            <button className="btn btn-secondary">Manage Users</button>
          </div>
        </div>

        <div className="card">
          <h2>📈 Statistics</h2>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">24</div>
              <div className="stat-label">Total Items</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">3</div>
              <div className="stat-label">API Endpoints</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">100%</div>
              <div className="stat-label">Uptime</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;