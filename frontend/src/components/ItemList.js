import React from 'react';

function ItemList({ items, onDelete }) {
  if (items.length === 0) {
    return (
      <div className="loading">
        No items found. Create your first item using the form above.
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const handleDelete = (item) => {
    if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      onDelete(item.id);
    }
  };

  return (
    <div>
      {items.map((item) => (
        <div key={item.id} className="item">
          <h3>{item.name}</h3>
          {item.description && <p>{item.description}</p>}
          <div className="item-meta">
            <div>Created: {formatDate(item.created_at)}</div>
            {item.updated_at !== item.created_at && (
              <div>Updated: {formatDate(item.updated_at)}</div>
            )}
            <div>ID: {item.id}</div>
          </div>
          <button
            onClick={() => handleDelete(item)}
            className="btn btn-danger"
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}

export default ItemList;