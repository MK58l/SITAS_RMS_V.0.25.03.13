import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { QrCode, ShoppingCart } from 'lucide-react';
import PayPalButton from '../components/PayPalButton';

const QRScanner = () => {
  const { isAuthenticated, supabase, user } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [tableId, setTableId] = useState<number | null>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [showPayPal, setShowPayPal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAvailableTables();
  }, []);

  useEffect(() => {
    if (tableId) {
      fetchMenuItems();
    }
  }, [tableId]);

  const fetchAvailableTables = async () => {
    try {
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('status', 'available');

      if (error) throw error;
      setTables(data || []);
    } catch (error) {
      console.error('Error fetching available tables:', error);
      toast.error('Failed to load available tables');
    }
  };

  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select(`
          *,
          category:category_id (
            name,
            sort_order
          )
        `)
        .eq('is_available', true)
        .order('category_id');

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      toast.error('Failed to load menu items');
    }
  };

  const handleQRScan = async (qrData: { data: string }) => {
    try {
      const tableNumber = qrData.data.split('_')[1];
      const table = tables.find(t => t.table_number === tableNumber);

      if (table) {
        setTableId(table.id);
        setScanning(false);
        toast.success(`Connected to Table ${tableNumber}`);
        setTables(prevTables => prevTables.filter(t => t.id !== table.id));
      } else {
        toast.error('Invalid or unavailable table');
        setScanning(false);
      }
    } catch (error) {
      console.error('Error processing QR code:', error);
      toast.error('Invalid QR code');
      setScanning(false);
    }
  };

  const handleTableSelect = (table: any) => {
    setTableId(table.id);
    setTables(prevTables => prevTables.filter(t => t.id !== table.id));
    toast.success(`Connected to Table ${table.table_number}`);
  };

  const addToCart = (item: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i =>
          i.id === item.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    toast.success(`Added ${item.name} to cart`);
  };

  const removeFromCart = (itemId: number) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId: number, quantity: number) => {
    if (quantity < 1) return;
    setCart(prev =>
      prev.map(item =>
        item.id === itemId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const handlePaymentSuccess = async (details: any) => {
    try {
      if (!currentOrder) return;

      // Update order with payment details
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_status: 'completed',
          payment_id: details.id,
          payment_details: details
        })
        .eq('id', currentOrder.id);

      if (updateError) throw updateError;

      toast.success('Payment successful! Your order has been confirmed.');
      setCart([]);
      setShowPayPal(false);
      setCurrentOrder(null);
      navigate('/orders');
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('Error confirming payment. Please contact support.');
    }
  };

  const handlePaymentError = (error: any) => {
    console.error('Payment error:', error);
    toast.error('Payment failed. Please try again.');
    setShowPayPal(false);
  };

const placeOrder = async () => {
  console.log('Placing order...');
  console.log('Table ID:', tableId);
  console.log('Table ID Type:', typeof tableId);

  if (!tableId || cart.length === 0) {
    toast.error('Please add items to your cart before placing an order');
    return;
  }

  if (!user?.id) {
    toast.error('You must be logged in to place an order');
    return;
  }

  if (isPlacingOrder) return;

  try {
    setIsPlacingOrder(true);
    console.log('Checking if table exists in database...');

    // 🔍 Ensure `table_id` exists
    const { data: tableExists, error: tableError } = await supabase
      .from('tables')
      .select('id')
      .eq('id', tableId.trim()) // 🔹 Ensure no spaces or encoding issues
      .single();

    console.log('Table Exists:', tableExists);

    if (!tableExists || tableError) {
      toast.error('Invalid or unavailable table');
      setIsPlacingOrder(false);
      return;
    }

    // 🔹 Force UUID Format
    const formattedTableId = tableId.trim(); 
    console.log('Formatted Table ID:', formattedTableId);

    // 🔹 Insert Order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          table_id: formattedTableId, // 🔹 Ensure table_id is correct
          user_id: user.id,
          total_amount: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
          status: 'pending',
          payment_status: 'pending',
          preparation_status: 'pending',
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (orderError) throw orderError;

    console.log('Order placed successfully:', order);

    setCurrentOrder(order);
    setShowPayPal(true);
  } catch (error: any) {
    console.error('Error placing order:', error);
    toast.error(error.message || 'Failed to place order.');
    setShowPayPal(false);
  } finally {
    setIsPlacingOrder(false);
  }
};

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {!tableId ? (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-lg shadow px-6 py-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Scan Table QR Code</h2>
              <div className="space-y-6">
                <p className="text-gray-500">
                  Scan the QR code on your table to start ordering.
                </p>

                <div className="border-4 border-dashed border-gray-200 rounded-lg h-64 flex items-center justify-center">
                  {scanning ? (
                    <div className="text-gray-500">Scanning...</div>
                  ) : (
                    <button
                      onClick={() => {
                        setScanning(true);
                        setTimeout(() => {
                          handleQRScan({ data: 'table_1' });
                        }, 1000);
                      }}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      <QrCode className="h-5 w-5 mr-2" />
                      Start Scanning
                    </button>
                  )}
                </div>
                <div className="mt-4">
                  <h3 className="text-xl font-medium text-gray-900">Or select a table</h3>
                  <div className="mt-2 space-y-2 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {tables.map(table => (
                      <button
                        key={table.id}
                        onClick={() => handleTableSelect(table)}
                        className="w-full text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-md"
                      >
                        Table {table.table_number}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Menu</h2>
                {Object.entries(
                  menuItems.reduce((acc, item) => {
                    const category = item.category?.name || 'Other';
                    if (!acc[category]) acc[category] = [];
                    acc[category].push(item);
                    return acc;
                  }, {})
                ).map(([category, items]) => (
                  <div key={category} className="mb-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">{category}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {items.map((item: any) => (
                        <div key={item.id} className="border rounded-lg p-4">
                          {item.image_url && (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-full h-48 object-cover rounded-lg mb-4"
                            />
                          )}
                          <h4 className="font-medium text-gray-900">{item.name}</h4>
                          <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                          <div className="mt-4 flex items-center justify-between">
                            <span className="font-bold text-lg">${item.price}</span>
                            <button
                              onClick={() => addToCart(item)}
                              className="bg-indigo-600 text-white rounded-full px-4 py-2 hover:bg-indigo-700"
                            >
                              Add to Cart
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Cart</h2>
              <div className="space-y-4">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div className="flex items-center">
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-600 hover:text-red-700 mr-2"
                      >
                        &times;
                      </button>
                      <span className="text-gray-900">{item.name}</span>
                    </div>
                    <div className="flex items-center">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="text-gray-500 hover:text-gray-700 mr-2"
                      >
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="text-gray-500 hover:text-gray-700 ml-2"
                      >
                        +
                      </button>
                    </div>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center mt-4">
                  <span className="font-medium text-gray-900">Total</span>
                  <span className="font-bold text-xl">
                    ${cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2)}
                  </span>
                </div>
                
                {showPayPal ? (
                  <div className="mt-6">
                    <PayPalButton
                      amount={cart.reduce((total, item) => total + (item.price * item.quantity), 0)}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                    />
                  </div>
                ) : (
                  <button
                    onClick={placeOrder}
                    disabled={isPlacingOrder || cart.length === 0}
                    className={`w-full mt-6 ${
                      isPlacingOrder || cart.length === 0
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700'
                    } text-white py-3 rounded-md text-lg transition-colors`}
                  >
                    {isPlacingOrder ? 'Processing...' : 'Place Order'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRScanner;