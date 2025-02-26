import React from 'react';
import { Link } from 'react-router-dom';
import { UtensilsCrossed, CalendarCheck, QrCode } from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      {/* Hero Section */}
      <div className="relative bg-indigo-600 h-[500px]">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80"
            alt="Restaurant interior"
            className="w-full h-full object-cover opacity-30"
          />
        </div>
        <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Welcome to Our Restaurant
          </h1>
          <p className="mt-6 text-xl text-indigo-100 max-w-3xl">
            Experience fine dining at its best. Book a table or order directly through our digital menu system.
          </p>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Book a Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-600 text-white mb-4">
              <CalendarCheck className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Book a Table</h3>
            <p className="text-gray-500 dark:text-gray-300 mb-4">
              Reserve your table in advance and skip the waiting line.
            </p>
            <Link
              to="/book-table"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Book Now
            </Link>
          </div>

          {/* View Menu */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-600 text-white mb-4">
              <UtensilsCrossed className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">View Menu</h3>
            <p className="text-gray-500 dark:text-gray-300 mb-4">
              Explore our diverse menu offerings and specialties.
            </p>
            <Link
              to="/menu"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              View Menu
            </Link>
          </div>

          {/* QR Code Ordering */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-600 text-white mb-4">
              <QrCode className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">QR Code Ordering</h3>
            <p className="text-gray-500 dark:text-gray-300 mb-4">
              Scan your table's QR code to order directly from your phone.
            </p>
            <Link
              to="/scan-qr"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Scan QR
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
