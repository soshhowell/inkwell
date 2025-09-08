import React, { useState } from 'react';

function ItemForm({ onSubmit }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      alert('Please enter a name for the item');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || null
      });
      
      // Reset form on success
      setName('');
      setDescription('');
    } catch (error) {
      // Error is handled by parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="name">Name *</label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter item name"
          disabled={isSubmitting}
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter item description (optional)"
          rows="3"
          disabled={isSubmitting}
        />
      </div>
      
      <button 
        type="submit" 
        className="btn"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Creating...' : 'Create Item'}
      </button>
    </form>
  );
}

export default ItemForm;