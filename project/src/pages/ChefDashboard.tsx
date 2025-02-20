import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Clock, ChefHat, Bell, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ChefDashboard = () => {
  const { user, supabase } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState('all');
  const [tables, setTables] = useState([]);

  useEffect(() => {
    if (user?.user_metadata?.role === 'chef') {
      toast.success(`Welcome back, Chef ${user.user_metadata.name}!`);
    }
    fetchTables();
    fetchOrders();
    
    // Set up real-time subscription for new orders
    const ordersSubscription = supabase
      .channel('orders')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders' 
      }, payload => {
        toast.success(`New order received for Table ${payload.new.table_number}`);
        fetchOrders();
      })
      .subscribe();

    return () => {
      ordersSubscription.unsubscribe();
    };
  }, [selectedTable]);

  const fetchTables = async () => {
    try {
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .order('table_number');

      if (error) throw error;
      setTables(data || []);
    } catch (error) {
      console.error('Error fetching tables:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          table:tables(table_number),
          order_items (
            *,
            menu_item:menu_items (
              name,
              preparation_time,
              category:menu_categories(name)
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (selectedTable !== 'all') {
        query = query.eq('table_id', selectedTable);
      }

      const { data, error } = await query;

      if (error) throw error;
      setOrders(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const { error: orderError } = await supabase
        .from('orders')
        .update({ preparation_status: status })
        .eq('id', orderId);

      if (orderError) throw orderError;

      const { error: notificationError } = await supabase
        .from('chef_notifications')
        .insert([{
          order_id: orderId,
          status,
          notes: `Order marked as ${status} by chef`
        }]);

      if (notificationError) throw notificationError;

      toast.success(`Order status updated to ${status}`);
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  if (!user || user.user_metadata.role !== 'chef') {
    return <Navigate to="/login" />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-xl dark:text-white">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
              <ChefHat className="h-8 w-8 mr-2" />
              Chef Dashboard
            </h1>
          </div>
          <div className="mt-4 md:mt-0">
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">All Tables</option>
              {tables.map((table) => (
                <option key={table.id} value={table.id}>
                  Table {table.table_number}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Orders Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {orders.map((order: any) => (
            <div key={order.id} className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Table {order.table.table_number}
                  </h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    order.preparation_status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' :
                    order.preparation_status === 'preparing' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100' :
                    order.preparation_status === 'ready' ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100'
                  }`}>
                    {order.preparation_status}
                  </span>
                </div>

                <div className="space-y-4">
                  {order.order_items.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.menu_item.name}
                          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                            ({item.menu_item.category.name})
                          </span>
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Quantity: {item.quantity}</p>
                      </div>
                      {item.menu_item.preparation_time && (
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <Clock className="h-4 w-4 mr-1" />
                          {item.menu_item.preparation_time}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex space-x-3">
                  <button
                    onClick={() => updateOrderStatus(order.id, 'preparing')}
                    disabled={order.preparation_status === 'completed'}
                    className="flex-1 bg-yellow-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 dark:bg-yellow-700 dark:hover:bg-yellow-600"
                  >
                    Start Preparing
                  </button>
                  <button
                    onClick={() => updateOrderStatus(order.id, 'ready')}
                    disabled={order.preparation_status === 'completed'}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-600"
                  >
                    Mark Ready
                  </button>
                  <button
                    onClick={() => updateOrderStatus(order.id, 'completed')}
                    disabled={order.preparation_status === 'completed'}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 dark:bg-green-700 dark:hover:bg-green-600"
                  >
                    Complete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChefDashboard;