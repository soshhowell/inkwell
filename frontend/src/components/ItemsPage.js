import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ItemList from './ItemList';
import ItemForm from './ItemForm';

const ItemsPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch items on component mount
  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/items');
      setItems(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch items: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const createItem = async (itemData) => {
    try {
      const response = await axios.post('/api/items', itemData);
      setItems([response.data, ...items]);
      setSuccess('Item created successfully!');
      setError(null);
      setTimeout(() => setSuccess(null), 3000);
      return response.data;
    } catch (err) {
      setError('Failed to create item: ' + (err.response?.data?.detail || err.message));
      throw err;
    }
  };

  const deleteItem = async (itemId) => {
    try {
      await axios.delete(`/api/items/${itemId}`);
      setItems(items.filter(item => item.id !== itemId));
      setSuccess('Item deleted successfully!');
      setError(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to delete item: ' + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Items Management</h1>
        <p>Create, view, and manage your items</p>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div className="grid">
        <div className="card">
          <h2>Create New Item</h2>
          <ItemForm onSubmit={createItem} />
        </div>

        <div className="card">
          <h2>Items ({items.length})</h2>
          {loading ? (
            <div className="loading">Loading items...</div>
          ) : (
            <ItemList items={items} onDelete={deleteItem} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemsPage;