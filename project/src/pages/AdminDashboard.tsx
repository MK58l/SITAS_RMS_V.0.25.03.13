import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, Routes, Route, Link, useLocation } from 'react-router-dom';
import { BarChart3, Users, Table as TableIcon, DollarSign, Settings, UtensilsCrossed } from 'lucide-react';
import RevenueChart from '../components/RevenueChart';
import StaffManagement from '../components/StaffManagement';
import MenuManagement from './admin/MenuManagement';
import TableManagement from './admin/TableManagement';

const AdminDashboard = () => {
  const { user, supabase } = useAuth();
  const [revenue, setRevenue] = useState({ daily: 0, weekly: 0, monthly: 0 });
  const [staff, setStaff] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Daily Revenue',
        data: [],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
    ],
  });

  const location = useLocation();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch revenue data
      const { data: revenueData, error: revenueError } = await supabase
        .from('revenue_transactions')
        .select('amount, created_at')
        .eq('status', 'completed')
        .order('created_at', { ascending: true });

      if (revenueError) throw revenueError;

      if (revenueData) {
        const now = new Date();
        const daily = revenueData
          .filter(t => new Date(t.created_at).toDateString() === now.toDateString())
          .reduce((sum, t) => sum + Number(t.amount), 0);
        
        const weekly = revenueData
          .filter(t => {
            const date = new Date(t.created_at);
            return date >= new Date(now - 7 * 24 * 60 * 60 * 1000);
          })
          .reduce((sum, t) => sum + Number(t.amount), 0);
        
        const monthly = revenueData
          .filter(t => {
            const date = new Date(t.created_at);
            return date.getMonth() === now.getMonth();
          })
          .reduce((sum, t) => sum + Number(t.amount), 0);

        setRevenue({ daily, weekly, monthly });

        // Process data for chart
        const last7Days = [...Array(7)].map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return d.toISOString().split('T')[0];
        }).reverse();

        const dailyRevenue = last7Days.map(date => {
          return revenueData
            .filter(t => t.created_at.startsWith(date))
            .reduce((sum, t) => sum + Number(t.amount), 0);
        });

        setRevenueData({
          labels: last7Days.map(date => new Date(date).toLocaleDateString()),
          datasets: [{
            label: 'Daily Revenue',
            data: dailyRevenue,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
          }],
        });
      }

      // Fetch staff data
      const { data: staffData, error: staffError } = await supabase
        .from('staff_shifts_with_users')
        .select('*')
        .eq('status', 'active');

      if (staffError) throw staffError;
      if (staffData) {
        setStaff(staffData);
      }

      // Fetch tables data
      const { data: tablesData, error: tablesError } = await supabase
        .from('tables')
        .select('*')
        .order('table_number');

      if (tablesError) throw tablesError;
      if (tablesData) {
        setTables(tablesData);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  if (!user || user.user_metadata.role !== 'admin') {
    return <Navigate to="/login" />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-xl dark:text-white">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Admin Dashboard</h1>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            <Link
              to="/admin"
              className={`${
                location.pathname === '/admin'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              } flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              <BarChart3 className="mr-2 h-5 w-5" />
              Revenue
            </Link>
            <Link
              to="/admin/menu"
              className={`${
                location.pathname === '/admin/menu'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              } flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              <UtensilsCrossed className="mr-2 h-5 w-5" />
              Menu Management
            </Link>
            <Link
              to="/admin/staff"
              className={`${
                location.pathname === '/admin/staff'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              } flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              <Users className="mr-2 h-5 w-5" />
              Staff Management
            </Link>
            <Link
              to="/admin/tables"
              className={`${
                location.pathname === '/admin/tables'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              } flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              <TableIcon className="mr-2 h-5 w-5" />
              Tables
            </Link>
          </nav>
        </div>

        <Routes>
          <Route path="/" element={
            <div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <DollarSign className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Daily Revenue</dt>
                          <dd className="text-lg font-medium text-gray-900 dark:text-white">${revenue.daily.toFixed(2)}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <DollarSign className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Weekly Revenue</dt>
                          <dd className="text-lg font-medium text-gray-900 dark:text-white">${revenue.weekly.toFixed(2)}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <DollarSign className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Monthly Revenue</dt>
                          <dd className="text-lg font-medium text-gray-900 dark:text-white">${revenue.monthly.toFixed(2)}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <RevenueChart data={revenueData} />
            </div>
          } />
          
          <Route path="/menu" element={<MenuManagement />} />
          
          <Route path="/staff" element={
            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Staff Management</h3>
                <StaffManagement />
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700">
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {staff.map((shift: any) => (
                    <li key={shift.id} className="px-4 py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {shift.raw_user_meta_data.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{shift.email}</p>
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(shift.start_time).toLocaleTimeString()} - 
                          {shift.end_time ? new Date(shift.end_time).toLocaleTimeString() : 'Ongoing'}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          } />
          
          <Route path="/tables" element={<TableManagement />} />
        </Routes>
      </div>
    </div>
  );
};

export default AdminDashboard;