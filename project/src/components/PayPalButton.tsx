import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';

const PayPalButton = ({ amount, onSuccess, onError }: { 
  amount: number;
  onSuccess: (details: any) => void;
  onError: (error: any) => void;
}) => {
  const CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID; // Use import.meta.env

  if (!CLIENT_ID) {
    console.error('PayPal Client ID is missing. Check your .env file.');
    return <div>PayPal integration is currently unavailable.</div>;
  }

  return (
    <PayPalScriptProvider 
      options={{ 
        'client-id': CLIENT_ID,
        currency: 'USD',
        intent: 'capture'
      }}
    >
      <PayPalButtons
        style={{ layout: 'vertical' }}
        createOrder={(_, actions) => actions.order.create({
          purchase_units: [{
            amount: {
              value: amount.toFixed(2),
              breakdown: {
                item_total: {
                  value: amount.toFixed(2),
                  currency_code: 'USD'
                }
              }
            }
          }]
        })}
        onApprove={(_, actions) => actions.order!.capture().then(onSuccess)}
        onError={onError}
      />
    </PayPalScriptProvider>
  );
};

export default PayPalButton;