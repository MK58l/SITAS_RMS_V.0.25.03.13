import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Navigate } from 'react-router-dom';

const TableBooking = () => {
  const { user, isAuthenticated, supabase } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    reservation_date: '',
    reservation_time: '',
    guests: 2,
  });

  useEffect(() => {
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    setFormData(prev => ({
      ...prev,
      reservation_date: today
    }));
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Find available table based on capacity and status
      const { data: availableTables, error: tableError } = await supabase
        .from('tables')
        .select('*')
        .eq('status', 'available')
        .gte('capacity', formData.guests)
        .order('capacity', { ascending: true })
        .limit(1);

      if (tableError) throw tableError;

      if (!availableTables || availableTables.length === 0) {
        toast.error('No tables available for the selected number of guests');
        return;
      }

      const table = availableTables[0];

      // Create reservation
      const { error: reservationError } = await supabase
        .from('reservations')
        .insert([
          {
            table_id: table.id,
            user_id: user?.id,
            reservation_date: formData.reservation_date,
            reservation_time: formData.reservation_time,
            duration: 120, // 2 hours default
          },
        ]);

      if (reservationError) throw reservationError;

      // Update table status
      const { error: updateError } = await supabase
        .from('tables')
        .update({ 
          status: 'reserved',
          is_reserved: true 
        })
        .eq('id', table.id);

      if (updateError) throw updateError;

      // Add to table status history
      const { error: historyError } = await supabase
        .from('table_status_history')
        .insert([{
          table_id: table.id,
          status: 'reserved',
          changed_by: user?.id,
          notes: `Reserved for ${formData.guests} guests on ${formData.reservation_date} at ${formData.reservation_time}`
        }]);

      if (historyError) throw historyError;

      toast.success('Table booked successfully!');
      // Reset form
      setFormData({
        reservation_date: new Date().toISOString().split('T')[0],
        reservation_time: '',
        guests: 2,
      });
    } catch (error: any) {
      console.error('Booking error:', error);
      toast.error(error.message || 'Failed to book table');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow px-6 py-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Book a Table</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="reservation_date" className="block text-sm font-medium text-gray-700">
                Date
              </label>
              <input
                type="date"
                name="reservation_date"
                id="reservation_date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={formData.reservation_date}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="reservation_time" className="block text-sm font-medium text-gray-700">
                Time
              </label>
              <input
                type="time"
                name="reservation_time"
                id="reservation_time"
                required
                value={formData.reservation_time}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="guests" className="block text-sm font-medium text-gray-700">
                Number of Guests
              </label>
              <select
                name="guests"
                id="guests"
                required
                value={formData.guests}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? 'Guest' : 'Guests'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Booking...' : 'Book Table'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TableBooking;