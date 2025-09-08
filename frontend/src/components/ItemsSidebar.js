import React from 'react';
import './ItemsSidebar.css';

const ItemsSidebar = ({ items, onSelectItem, selectedItemId, onNewItem, loading }) => {
  if (loading) {
    return (
      <aside className="items-sidebar">
        <div className="items-header">
          <h3>Items</h3>
        </div>
        <div className="items-loading">Loading items...</div>
      </aside>
    );
  }

  return (
    <aside className="items-sidebar">
      <div className="items-header">
        <h3>Items ({items.length})</h3>
        <button className="new-item-btn" onClick={onNewItem}>
          ➕ New Item
        </button>
      </div>
      <div className="items-list">
        {items.length === 0 ? (
          <div className="no-items">No items yet. Create your first item!</div>
        ) : (
          items.map((item) => (
            <button
              key={item.id}
              className={`item-button ${selectedItemId === item.id ? 'item-button-selected' : ''}`}
              onClick={() => onSelectItem(item)}
            >
              {item.name}
            </button>
          ))
        )}
      </div>
    </aside>
  );
};

export default ItemsSidebar;