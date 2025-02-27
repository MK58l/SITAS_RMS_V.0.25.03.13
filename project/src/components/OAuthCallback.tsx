// src/components/OAuthCallback.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const OAuthCallback = () => {
  const { supabase } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        toast.error('Error verifying session');
        navigate('/login');
        return;
      }

      if (session?.user) {
        // Handle user metadata and welcome message here
        const role = session.user.user_metadata?.role;
        const name = session.user.user_metadata?.name || 
                    session.user.user_metadata?.full_name;
        
        if (role) {
          toast.success(`Welcome back, ${
            role === 'admin' ? 'Admin' : 
            role === 'chef' ? 'Chef' : 'Staff'
          } ${name}!`);
        } else {
          toast.success(`Welcome ${name || ''}!`);
        }
        
        navigate('/dashboard');
      } else {
        navigate('/login');
      }
    };

    checkSession();
  }, [supabase, navigate]);

  return <div>Loading...</div>;
};

export default OAuthCallback;