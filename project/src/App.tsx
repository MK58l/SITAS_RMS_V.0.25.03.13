import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import StaffDashboard from './pages/StaffDashboard';
import ChefDashboard from './pages/ChefDashboard';
import MenuPage from './pages/MenuPage';
import TableBooking from './pages/TableBooking';
import QRScanner from './pages/QRScanner';
import MenuManagement from './pages/admin/MenuManagement';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Chatbot } from './components/Chatbot/Chatbot';
import OrderConfirmation from './pages/OrderConfirmation';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/admin/*" element={<AdminDashboard />} />
              <Route path="/staff" element={<StaffDashboard />} />
              <Route path="/chef" element={<ChefDashboard />} />
              <Route path="/menu" element={<MenuPage />} />
              <Route path="/book-table" element={<TableBooking />} />
              <Route path="/scan-qr" element={<QRScanner />} />
              <Route path="/admin/menu" element={<MenuManagement />} />
              <Route path="/order-confirmation" element={<OrderConfirmation />} />
            </Routes>
            <Toaster 
              position="top-center"
              toastOptions={{
                className: 'dark:bg-gray-800 dark:text-white',
              }}
            />
            <Chatbot />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;