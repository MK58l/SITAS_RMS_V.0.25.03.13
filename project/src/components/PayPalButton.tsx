import React, { useEffect } from 'react';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import { PayPalButtons } from '@paypal/react-paypal-js';

interface PayPalButtonProps {
  amount: number;
  onSuccess: (details: any) => void;
  onError: (error: any) => void;
}

const PayPalButton: React.FC<PayPalButtonProps> = ({ amount, onSuccess, onError }) => {
  return (
    <PayPalScriptProvider options={{ 
      clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID,
      currency: "USD"
    }}>
      <PayPalButtons
        style={{ layout: "vertical" }}
        createOrder={(data, actions) => {
          return actions.order.create({
            purchase_units: [
              {
                amount: {
                  value: amount.toString(),
                  currency_code: "USD"
                },
              },
            ],
          });
        }}
        onApprove={async (data, actions) => {
          if (actions.order) {
            const details = await actions.order.capture();
            onSuccess(details);
          }
        }}
        onError={(err) => {
          onError(err);
        }}
      />
    </PayPalScriptProvider>
  );
};

export default PayPalButton;