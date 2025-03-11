import React, { useEffect, useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const Chatbot: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || user?.user_metadata?.role !== 'customer') return;

    const script = document.createElement('script');
    script.src = "https://www.chatbase.co/embed.min.js";
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [isAuthenticated, user]); // Re-run when auth status or user changes

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  // Only show to authenticated customers
  if (!isAuthenticated || user?.user_metadata?.role !== 'customer') return null;

  return (
    <div className="fixed bottom-8 right-8 z-[1000]">
      {isOpen ? (
        <div className="relative animate-slide-up">
          <div className="absolute -top-3 -right-3 z-50">
            <button
              onClick={() => setIsOpen(false)}
              className="bg-red-500 hover:bg-red-600 text-white rounded-full w-10 h-10 flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              aria-label="Close chat"
            >
              <X size={16} className="transform hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>
          <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden transform transition-all duration-300">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                <div className="animate-pulse flex space-x-4">
                  <div className="rounded-full bg-gray-200 h-12 w-12"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                  </div>
                </div>
              </div>
            )}
            <iframe 
              src={`https://www.chatbase.co/chatbot-iframe/I-fFwTJZY7JV0vzwB-I2W`}
              width="380px"
              height="520px"
              style={{
                border: 'none',
                backgroundColor: 'white',
              }}
              className="rounded-2xl"
              frameBorder="0"
              title="Restaurant Assistant"
              onLoad={handleIframeLoad}
            />
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-[rgb(79,70,229)] hover:bg-[rgb(67,56,202)] text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 group overflow-hidden"
          aria-label="Open chat"
        >
          <MessageCircle 
            size={28} 
            className="group-hover:animate-bounce transition-transform duration-300" 
          />
        </button>
      )}
    </div>
  );
};