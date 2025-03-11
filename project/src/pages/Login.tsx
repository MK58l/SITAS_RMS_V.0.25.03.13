import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock, Mail } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone] = useState('');
  const [isOtpLogin] = useState(false);
  const [otp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, supabase } = useAuth();
  const navigate = useNavigate();

const handleGoogleLogin = async () => {
  setIsLoading(true);
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'email profile openid',
        redirectTo: 'https://devanshi-dhabalia2003-rms-updated-2402.vercel.app/dashboard', // Update this URL
      },
    });

    if (error) throw error;

    setTimeout(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        localStorage.setItem('toastMessage', `Welcome back, ${user.email}!`);
        navigate('/dashboard');
      }
    }, 2000);

  } catch (error) {
    toast.error(error.message || 'Failed to login with Google');
    setIsLoading(false);
  }
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isOtpLogin) {
        const { data, error } = await supabase.auth.verifyOtp({
          phone,
          token: otp,
          type: 'sms',
        });
        if (error) throw error;
        if (data?.user?.user_metadata?.role) {
          const role = data.user.user_metadata.role;
          const name = data.user.user_metadata.name;
          localStorage.setItem('toastMessage', `Welcome back, ${role === 'admin' ? 'Admin' : role === 'chef' ? 'Chef' : 'Staff'} ${name}!`);
        }
        navigate('/dashboard');
      } else {
        await login(email, password);
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.user_metadata?.role) {
          const role = user.user_metadata.role;
          const name = user.user_metadata.name;
          localStorage.setItem('toastMessage', `Welcome back, ${role === 'admin' ? 'Admin' : role === 'chef' ? 'Chef' : 'Staff'} ${name}!`);
        }
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center px-4 pt-20">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 p-10 rounded-lg shadow-2xl">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white">Welcome Back</h2>
        <p className="text-center text-gray-600 dark:text-gray-400 mt-2">Sign in to continue</p>

        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full mt-6 flex items-center justify-center gap-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-white py-3 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition duration-200 disabled:opacity-50"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
            className="w-6 h-6"
          >
            <path
              fill="#FFC107"
              d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
            />
            <path
              fill="#FF3D00"
              d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
            />
            <path
              fill="#4CAF50"
              d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
            />
            <path
              fill="#1976D2"
              d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
            />
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
          <span className="px-3 text-gray-500 dark:text-gray-400 text-sm">or</span>
          <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {isOtpLogin ? (
            <>
              {/* OTP login fields (if needed) */}
            </>
          ) : (
            <>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-2.5 text-gray-500 dark:text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-2.5 text-gray-500 dark:text-gray-400" />
                  <input
                    type="password"
                    name="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter your password"
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white py-3 rounded-md hover:bg-indigo-700 transition duration-200 disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          New here?{' '}
          <Link to="/register" className="text-indigo-600 dark:text-indigo-400 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;