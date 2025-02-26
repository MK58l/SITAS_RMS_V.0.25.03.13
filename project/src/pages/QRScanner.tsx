import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import PayPalButton from '../components/PayPalButton';
import emailjs from '@emailjs/browser';
import QRCode from 'react-qr-code';

const QRScanner = () => {
  const { isAuthenticated, supabase, user } = useAuth();
  const [tableId, setTableId] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [showPayPal, setShowPayPal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Fetch available tables and check for QR code parameter
  useEffect(() => {
    const fetchTablesAndCheckQR = async () => {
      try {
        const { data, error } = await supabase
          .from('tables')
          .select('*')
          .eq('status', 'available');
        
        if (error) throw error;
        setTables(data || []);

        // Check for table parameter in URL
        const tableNumber = searchParams.get('table');
        if (tableNumber && data) {
          const selectedTable = data.find((t: any) => t.table_number === tableNumber);
          if (selectedTable) {
            handleTableSelection(selectedTable);
            navigate('/qr-scanner', { replace: true }); // Clean URL after selection
          }
        }
      } catch (error) {
        console.error('Error:', error);
        toast.error('Failed to load tables');
      }
    };

    fetchTablesAndCheckQR();
  }, []);

  // Handle table selection
  const handleTableSelection = (table: any) => {
    setTableId(table.id);
    setTables(prev => prev.filter(t => t.id !== table.id));
    toast.success(`Table ${table.table_number} selected`);
    fetchMenuItems();
  };

  // Fetch menu items
  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_available', true);
      
      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      console.error('Error fetching menu:', error);
      toast.error('Failed to load menu');
    }
  };

  // Add item to cart
  const addToCart = (item: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      return existing
        ? prev.map(i => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i))
        : [...prev, { ...item, quantity: 1 }];
    });
    toast.success(`Added ${item.name}`);
  };

  // Update item quantity in cart
  const updateQuantity = (itemId: number, delta: number) => {
    setCart(prev =>
      prev.map(item =>
        item.id === itemId
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  };

  // Remove item from cart
  const removeFromCart = (itemId: number) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  // Place order
  const placeOrder = async () => {
    if (!tableId || !user?.id || cart.length === 0) {
      toast.error('Complete your order setup');
      return;
    }
  
    try {
      setIsPlacingOrder(true);

      const { data: order, error } = await supabase
        .from('orders')
        .insert([{
          table_id: tableId,
          user_id: user.id,
          total_amount: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
          status: 'pending',
          payment_status: 'unpaid',
          order_items: cart.map(item => ({
            menu_item_id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price
          }))
        }])
        .select()
        .single();

      if (error) throw error;

      setCurrentOrder(order);
      setShowPayPal(true);
      toast.success('Order registered! Complete the payment process...');
    } catch (error: any) {
      toast.error(error.message || 'Failed to place order');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Updated payment success handler
  const handlePaymentSuccess = async (details: any) => {
    try {
      if (!currentOrder) throw new Error('No active order');
      if (!user?.email) throw new Error('User email not found');

      // Update order status
      const { error } = await supabase
        .from('orders')
        .update({
          payment_id: details.id,
          payment_status: 'paid',
          status: 'confirmed'
        })
        .eq('id', currentOrder.id);

      if (error) throw error;

      // Send confirmation email ONLY after successful payment
      sendOrderConfirmationEmail(user.email, currentOrder);

      // Clear cart and navigate
      setCart([]);
      setShowPayPal(false);
      navigate('/order-confirmation', { state: { order: currentOrder } });
      toast.success('Payment successful!');
    } catch (error: any) {
      toast.error(error.message || 'Payment update failed');
    }
  };

  const handlePaymentError = (error: any) => {
    toast.error('Payment failed');
    setShowPayPal(false);
  };

  const sendOrderConfirmationEmail = (userEmail: string, order: any) => {
    const orderItemsText = order.order_items
      .map(
        (item: any) =>
          `${item.name} (x${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}`
      )
      .join('\n');
  
    const emailParams = {
      user_email: userEmail,
      order_id: order.id,
      total_amount: `$${order.total_amount.toFixed(2)}`,
      name: user?.name || "Guest",
      hotel_name: "Your Hotel Name",
      hotel_address: "Hotel Address",
      hotel_contact: "+91-XXXXXXXXXX",
      order_items: orderItemsText
    };
  
    emailjs
      .send(
        'service_o51ew0e',
        'template_0dntpue',
        emailParams,
        'Wq9LPEIYq_4-UHOkQ'
      )
      .then(() => toast.success('Order confirmation email sent'))
      .catch(() => toast.error('Failed to send confirmation email'));
  };
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) return <Navigate to="/login" />;

  return (
    <div className="min-h-screen bg-gray-50 py-12 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {!tableId ? (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-lg shadow px-6 py-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Scan Table QR Code to Start Ordering
              </h2>
              
              <div className="mt-8">
                <h3 className="text-xl font-medium text-gray-900 mb-4">
                  Available Tables
                </h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {tables.length > 0 ? (
                    tables.map(table => (
                      <div key={table.id} className="text-center">
                        <div className="bg-white p-2 rounded-lg mb-2">
                          <QRCode
                            value={`${window.location.origin}/qr-scanner?table=${table.table_number}`}
                            size={128}
                          />
                        </div>
                        <button
                          onClick={() => handleTableSelection(table)}
                          className="btn-primary"
                        >
                          Table {table.table_number}
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No tables available</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Menu Section */}
            <div className="lg:col-span-2">
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Menu</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {menuItems.length > 0 ? (
                    menuItems.map(item => (
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
                          <span className="font-bold">${item.price}</span>
                          <button
                            onClick={() => addToCart(item)}
                            className="btn-primary"
                          >
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No menu items available</p>
                  )}
                </div>
              </div>
            </div>

            {/* Cart Section */}
            <div className="bg-white shadow rounded-lg p-6 h-fit sticky top-24">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Order</h2>
              <div className="space-y-4">
                {cart.length > 0 ? (
                  cart.map(item => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          ×
                        </button>
                        <span className="text-gray-900">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="quantity-button"
                        >
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="quantity-button"
                        >
                          +
                        </button>
                        <span className="w-20 text-right">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">Your cart is empty</p>
                )}

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-medium">Total:</span>
                    <span className="font-bold text-xl">
                      ${cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}
                    </span>
                  </div>

                  {showPayPal ? (
                    <div className="space-y-4">
                      <PayPalButton
                        amount={cart.reduce((sum, item) => sum + item.price * item.quantity, 0)}
                        onSuccess={handlePaymentSuccess}
                        onError={handlePaymentError}
                      />
                      <button
                        onClick={() => setShowPayPal(false)}
                        className="w-full text-white-600 underline hover:text-white-800 text-sm"
                      >
                        Cancel Payment
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={placeOrder}
                      disabled={isPlacingOrder || cart.length === 0}
                      className={`w-full btn-primary ${
                        isPlacingOrder || cart.length === 0
                          ? 'opacity-50 cursor-not-allowed'
                          : ''
                      }`}
                    >
                      {isPlacingOrder ? 'Processing...' : 'Proceed to Payment'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRScanner;