import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const OrderConfirmation = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!state?.order) {
      toast.error('Invalid order confirmation');
      navigate('/');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <h2 className="text-2xl font-bold mb-4 text-green-600">Payment Successful!</h2>
        <p className="text-gray-600 mb-6">
          Order #{state?.order?.id} confirmed. Total paid: ${state?.order?.total_amount}
        </p>
        <button
          onClick={() => navigate('/')}
          className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700"
        >
          Return to Menu
        </button>
      </div>
    </div>
  );
};

export default OrderConfirmation;