import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const MenuPage = () => {
  const { supabase } = useAuth();
  const [menuItems, setMenuItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [expandedCategories, setExpandedCategories] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const { data, error } = await supabase
          .from('menu_items')
          .select(`
            *,
            category:menu_categories(name)
          `)
          .order('category_id');

        if (error) throw error;
        setMenuItems(data || []);
      } catch (error) {
        console.error('Error fetching menu items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, [supabase]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <div className="text-xl">Loading menu...</div>
      </div>
    );
  }

  const groupedMenuItems = menuItems.reduce((acc, item) => {
    const categoryName = item.category?.name || 'Other';
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(item);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">Our Menu</h1>
        
        {Object.entries(groupedMenuItems).map(([category, items]) => {
          const showAll = expandedCategories[category];
          const displayItems = showAll ? items : items.slice(0, 3);
          const hasMoreItems = items.length > 3;

          return (
            <div key={category} className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6">
                {category}
              </h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {displayItems.map((item: any) => (
                  <div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{item.name}</h3>
                      <p className="mt-2 text-gray-500 dark:text-gray-300 text-sm">{item.description}</p>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                          {formatPrice(item.price)}
                        </span>
                        {item.is_available ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-700 text-green-800 dark:text-green-200">
                            Available
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-700 text-red-800 dark:text-red-200">
                            Sold Out
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {hasMoreItems && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => toggleCategory(category)}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
                  >
                    {showAll ? 'View Less' : `View More (${items.length - 3})`}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MenuPage;