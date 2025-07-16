import React, { useState, useEffect, useContext } from 'react';
import AuthContext from '../../Authentication/AuthContext';
import apiCall from '../../../hooks/apiCall';

function CategoryManager() {
  const { auth } = useContext(AuthContext);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [newSubcategory, setNewSubcategory] = useState('');
  const userEmail = auth?.email;
  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      console.log("fetchCategories");
      try {
        const response = await apiCall.post('Categories/Add', {
  userId: userEmail,
  name: newCategory,
  parentCategory: null
});
        console.log('Categories/List', response);
        setCategories(response.data || []);
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };

    if (userEmail) {
      fetchCategories();
    }
  }, [userEmail]);

  const addCategory = async () => {
    if (!newCategory.trim()) return;

    try {
      await apiCall.post('Categories/Add', {
        userId: userEmail,
        name: newCategory,
        parentCategory: null
      });
        console.log('Categories/Add', response);
      
      setNewCategory('');
      refreshCategories();
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  const addSubcategory = async () => {
    if (!selectedCategory || !newSubcategory.trim()) return;

    try {
      await apiCall.post('Categories/Add', {
        userId: userEmail,
        name: newSubcategory,
        parentCategory: selectedCategory
      });

      setNewSubcategory('');
      refreshCategories();
    } catch (error) {
      console.error('Error adding subcategory:', error);
    }
  };

  const refreshCategories = async () => {
    try {
      const response = await apiCall.get('Categories/List', { params: { userId: userEmail } });
      setCategories(response.data || []);
    } catch (error) {
      console.error('Failed to refresh categories:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold">Manage Categories</h1>
      </div>

      {/* Add Category */}
      <div>
        <label className="block text-sm font-medium mb-1">Add Category</label>
        <div className="flex space-x-2">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="flex-1 rounded border px-3 py-2"
            placeholder="e.g., Casa"
          />
          <button
            onClick={addCategory}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Add
          </button>
        </div>
      </div>

      {/* Add Subcategory */}
      <div>
        <label className="block text-sm font-medium mb-1">Add Subcategory</label>
        <div className="flex space-x-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex-1 rounded border px-3 py-2"
          >
            <option value="">Select category</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
          <input
            type="text"
            value={newSubcategory}
            onChange={(e) => setNewSubcategory(e.target.value)}
            className="flex-1 rounded border px-3 py-2"
            placeholder="e.g., Quarto"
          />
          <button
            onClick={addSubcategory}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            Add
          </button>
        </div>
      </div>

      {/* Display Categories */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Categories</h2>
        <ul className="space-y-2">
          {categories.map(cat => (
            <li key={cat.id} className="border p-3 rounded">
              <strong>{cat.name}</strong>
              {cat.subcategories?.length > 0 && (
                <ul className="ml-4 list-disc text-sm text-gray-600">
                  {cat.subcategories.map(sub => (
                    <li key={sub.id}>{sub.name}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default CategoryManager;