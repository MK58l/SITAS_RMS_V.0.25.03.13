  import React, { useState } from 'react';
  import { useNavigate, Link } from 'react-router-dom';
  import { useAuth } from '../contexts/AuthContext';
  import { Lock, Mail, Phone } from 'lucide-react';
  import { toast } from 'react-hot-toast';

  const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [isOtpLogin, setIsOtpLogin] = useState(false);
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login, supabase } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);

      try {
        if (isOtpLogin) {
          // Handle OTP login
          const { data, error } = await supabase.auth.verifyOtp({
            phone,
            token: otp,
            type: 'sms'
          });

          if (error) throw error;

          // Show welcome message based on user role
          if (data?.user?.user_metadata?.role) {
            const role = data.user.user_metadata.role;
            const name = data.user.user_metadata.name;
            toast.success(`Welcome back, ${role === 'admin' ? 'Admin' : role === 'chef' ? 'Chef' : 'Staff'} ${name}!`);
          }

          navigate('/dashboard');
        } else {
          await login(email, password);
          
          // Get user data
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user?.user_metadata?.role) {
            const role = user.user_metadata.role;
            const name = user.user_metadata.name;
            toast.success(`Welcome back, ${role === 'admin' ? 'Admin' : role === 'chef' ? 'Chef' : 'Staff'} ${name}!`);
          }

          navigate('/dashboard');
        }
      } catch (error: any) {
        toast.error(error.message || 'Failed to login');
      } finally {
        setIsLoading(false);
      }
    };

    const handleSendOtp = async () => {
      try {
        const { error } = await supabase.auth.signInWithOtp({
          phone,
        });

        if (error) throw error;
        toast.success('OTP sent to your phone');
      } catch (error: any) {
        toast.error(error.message || 'Failed to send OTP');
      }
    };

    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center px-4 pt-20">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 p-10 rounded-lg shadow-2xl">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white">Welcome Back</h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mt-2">Sign in to continue</p>

          <div className="mt-4 text-center">
            <button
              onClick={() => setIsOtpLogin(!isOtpLogin)}
              className="text-indigo-600 dark:text-indigo-400 hover:underline transition"
            >
              {isOtpLogin ? 'Use email instead' : 'Use phone number instead'}
            </button>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            {isOtpLogin ? (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-2.5 text-gray-500 dark:text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>
                {phone && (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="w-full bg-indigo-600 text-white py-3 rounded-md hover:bg-indigo-700 transition duration-200"
                  >
                    Send OTP
                  </button>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">OTP</label>
                  <input
                    type="text"
                    name="otp"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full pl-3 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter OTP"
                  />
                </div>
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
