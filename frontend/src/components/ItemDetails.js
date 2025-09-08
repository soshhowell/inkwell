import React from 'react';
import ItemForm from './ItemForm';

const ItemDetails = ({ 
  selectedItem, 
  showNewForm, 
  onCreateItem, 
  onUpdateItem, 
  onDeleteItem,
  onCancelForm,
  error,
  success 
}) => {
  if (showNewForm) {
    return (
      <div className="item-details">
        <div className="item-details-header">
          <h1>Create New Item</h1>
          <button className="btn btn-secondary" onClick={onCancelForm}>
            Cancel
          </button>
        </div>
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}
        <div className="card">
          <ItemForm onSubmit={onCreateItem} />
        </div>
      </div>
    );
  }

  if (!selectedItem) {
    return (
      <div className="item-details">
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <h2>Select an item to view details</h2>
          <p>Choose an item from the list on the left to see its details and options.</p>
          <p>Or click "New Item" to create a new one.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="item-details">
      <div className="item-details-header">
        <div>
          <h1>{selectedItem.name}</h1>
          <span className="item-id-badge">#{selectedItem.id}</span>
        </div>
        <div className="item-actions">
          <button className="btn btn-secondary">Edit</button>
          <button 
            className="btn btn-danger" 
            onClick={() => onDeleteItem(selectedItem.id)}
          >
            Delete
          </button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div className="card">
        <h3>Description</h3>
        <p className="item-description-full">
          {selectedItem.description || 'No description provided.'}
        </p>
      </div>

      <div className="card">
        <h3>Metadata</h3>
        <div className="metadata-grid">
          <div className="metadata-item">
            <label>Created</label>
            <span>{new Date(selectedItem.created_at).toLocaleString()}</span>
          </div>
          <div className="metadata-item">
            <label>Updated</label>
            <span>{new Date(selectedItem.updated_at).toLocaleString()}</span>
          </div>
          <div className="metadata-item">
            <label>ID</label>
            <span>{selectedItem.id}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetails;