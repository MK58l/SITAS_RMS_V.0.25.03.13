import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import Modal from '../../components/Modal';
import { toast } from 'react-hot-toast';

const MenuManagement = () => {
  const { supabase } = useAuth();
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    image_url: '',
    is_available: true,
  });
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    sort_order: 0,
  });

  useEffect(() => {
    fetchCategories();
    fetchMenuItems();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_categories')
        .select('*')
        .order('sort_order');

      if (error) throw error;
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to fetch categories');
    }
  };

  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select(
          `*,
          menu_categories (
            name
          )`
        )
        .order('name');

      if (error) throw error;
      setMenuItems(data);
      console.log('Fetched Menu Items:', data.map(item => ({ id: item.id, name: item.name, price: item.price }))); // Debug: Check price values
    } catch (error) {
      console.error('Error fetching menu items:', error);
      toast.error('Failed to fetch menu items');
    }
  };

  const formatPrice = (price) => {
    console.log('Price value received:', price); // Debug: Check input price value
    const formattedPrice = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0, // Adjust this if you want to display decimal places
    }).format(price); // No division by 100 needed

    console.log('Formatted Price:', formattedPrice); // Debug: Check formatted price
    return formattedPrice;
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      if (!categoryForm.name.trim()) {
        throw new Error('Category name is required');
      }

      const categoryData = {
        name: categoryForm.name.trim(),
        description: categoryForm.description?.trim() || null,
        sort_order: categoryForm.sort_order || 0,
      };

      let response;
      if (editingCategory) {
        response = await supabase
          .from('menu_categories')
          .update(categoryData)
          .eq('id', editingCategory.id);
      } else {
        response = await supabase
          .from('menu_categories')
          .insert([categoryData]);
      }

      if (response.error) throw response.error;

      toast.success(editingCategory ? 'Category updated' : 'Category added');
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
      setCategoryForm({
        name: '',
        description: '',
        sort_order: categories.length + 1,
      });

      // Fetch updated categories
      await fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error(error.message || 'Failed to save category');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.name.trim()) {
        throw new Error('Name is required');
      }

      if (!formData.price || isNaN(parseFloat(formData.price))) {
        throw new Error('Valid price is required');
      }

      if (!formData.category_id) {
        throw new Error('Category is required');
      }

      // Verify that the category exists
      const { data: categoryExists } = await supabase
        .from('menu_categories')
        .select('id')
        .eq('id', formData.category_id)
        .single();

      if (!categoryExists) {
        throw new Error('Selected category does not exist');
      }

      const menuItemData = {
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        price: parseFloat(formData.price), // No conversion to cents
        category_id: formData.category_id,
        image_url: formData.image_url?.trim() || null,
        is_available: formData.is_available,
      };

      console.log('Form Data before submission:', formData); // Debug: Check form data
      console.log('Menu Item Data to be submitted:', menuItemData); // Debug: Check submitted data

      let response;
      if (editingItem) {
        response = await supabase
          .from('menu_items')
          .update(menuItemData)
          .eq('id', editingItem.id);

        console.log('Update Response:', response); // Debug: Check update response

        if (response.error) throw response.error;

        // Update the local state immediately
        setMenuItems((prevItems) =>
          prevItems.map((item) =>
            item.id === editingItem.id ? { ...item, ...menuItemData } : item
          )
        );
      } else {
        response = await supabase
          .from('menu_items')
          .insert([menuItemData]);

        if (response.error) throw response.error;

        // Fetch updated menu items after adding a new item
        await fetchMenuItems();
      }

      toast.success(editingItem ? 'Menu item updated' : 'Menu item added');
      setIsModalOpen(false);
      setEditingItem(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        category_id: '',
        image_url: '',
        is_available: true,
      });

      // Fetch updated menu items to ensure the local state is in sync
      await fetchMenuItems();
      console.log('Updated Menu Items:', menuItems); // Debug: Check updated state
    } catch (error) {
      console.error('Error saving menu item:', error);
      toast.error(error.message || 'Failed to save menu item');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Remove the deleted item from the local state
      setMenuItems((prevItems) => prevItems.filter((item) => item.id !== id));
      toast.success('Menu item deleted');
    } catch (error) {
      console.error('Error deleting menu item:', error);
      toast.error('Failed to delete menu item');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (
      !confirm(
        'Are you sure you want to delete this category? All menu items in this category will be deleted.'
      )
    )
      return;

    try {
      // First, delete all menu items in this category
      const { error: menuItemsError } = await supabase
        .from('menu_items')
        .delete()
        .eq('category_id', id);

      if (menuItemsError) throw menuItemsError;

      // Then delete the category
      const { error: categoryError } = await supabase
        .from('menu_categories')
        .delete()
        .eq('id', id);

      if (categoryError) throw categoryError;

      // Update local state
      setCategories((prevCategories) =>
        prevCategories.filter((category) => category.id !== id)
      );
      setMenuItems((prevItems) =>
        prevItems.filter((item) => item.category_id !== id)
      );

      toast.success('Category and associated items deleted');
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    }
  };

  const toggleAvailability = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ is_available: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      // Update the local state immediately
      setMenuItems((prevItems) =>
        prevItems.map((item) =>
          item.id === id ? { ...item, is_available: !currentStatus } : item
        )
      );

      toast.success(`Item ${!currentStatus ? 'available' : 'unavailable'}`);
    } catch (error) {
      console.error('Error updating availability:', error);
      toast.error('Failed to update availability');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 pt-20">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Menu Management
        </h2>
        <div className="flex space-x-4">
          <button
            onClick={() => {
              setEditingCategory(null);
              setCategoryForm({
                name: '',
                description: '',
                sort_order: categories.length,
              });
              setIsCategoryModalOpen(true);
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Category
          </button>
          <button
            onClick={() => {
              setEditingItem(null);
              setFormData({
                name: '',
                description: '',
                price: '',
                category_id: '',
                image_url: '',
                is_available: true,
              });
              setIsModalOpen(true);
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Menu Item
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {categories.map((category) => (
          <div
            key={category.id}
            className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden"
          >
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {category.name}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {category.description}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setEditingCategory(category);
                    setCategoryForm({
                      name: category.name,
                      description: category.description,
                      sort_order: category.sort_order,
                    });
                    setIsCategoryModalOpen(true);
                  }}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <Edit2 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDeleteCategory(category.id)}
                  className="text-red-400 hover:text-red-500 dark:hover:text-red-300"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {menuItems
                .filter((item) => item.category_id === category.id)
                .map((item) => {
                  console.log('Rendering Item:', item.name, 'Price:', item.price); // Debug: Check price value
                  return (
                    <div
                      key={item.id}
                      className="px-4 py-4 sm:px-6 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-4">
                        {item.image_url && (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {item.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {formatPrice(item.price)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() =>
                            toggleAvailability(item.id, item.is_available)
                          }
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            item.is_available
                              ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                              : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                          }`}
                        >
                          {item.is_available ? 'Available' : 'Unavailable'}
                        </button>
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setFormData({
                              name: item.name,
                              description: item.description || '',
                              price: item.price.toString(), // Ensure price is correctly populated
                              category_id: item.category_id,
                              image_url: item.image_url || '',
                              is_available: item.is_available,
                            });
                            console.log('Form Data after setting:', formData); // Debug: Check form data
                            setIsModalOpen(true);
                          }}
                          className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                        >
                          <Edit2 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-400 hover:text-red-500 dark:hover:text-red-300"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>

      {/* Menu Item Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        title={editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Price (₹)
            </label>
            <input
              type="number"
              step="1"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Category
            </label>
            <select
              value={formData.category_id}
              onChange={(e) =>
                setFormData({ ...formData, category_id: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Image URL
            </label>
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) =>
                setFormData({ ...formData, image_url: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_available}
              onChange={(e) =>
                setFormData({ ...formData, is_available: e.target.checked })
              }
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Available
            </label>
          </div>

          <div className="mt-5 sm:mt-6 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setEditingItem(null);
              }}
              className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
            >
              {editingItem ? 'Update' : 'Add'} Menu Item
            </button>
          </div>
        </form>
      </Modal>

      {/* Category Modal */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        title={editingCategory ? 'Edit Category' : 'Add Category'}
      >
        <form onSubmit={handleCategorySubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Category Name
            </label>
            <input
              type="text"
              value={categoryForm.name}
              onChange={(e) =>
                setCategoryForm({ ...categoryForm, name: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              value={categoryForm.description}
              onChange={(e) =>
                setCategoryForm({ ...categoryForm, description: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Sort Order
            </label>
            <input
              type="number"
              value={categoryForm.sort_order}
              onChange={(e) =>
                setCategoryForm({
                  ...categoryForm,
                  sort_order: parseInt(e.target.value),
                })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>

          <div className="mt-5 sm:mt-6 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => {
                setIsCategoryModalOpen(false);
                setEditingCategory(null);
              }}
              className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
            >
              {editingCategory ? 'Update' : 'Add'} Category
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MenuManagement;