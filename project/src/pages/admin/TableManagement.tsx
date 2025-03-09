import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Edit2, Trash2, Calendar } from 'lucide-react';
import Modal from '../../components/Modal';
import { toast } from 'react-hot-toast';

const TableManagement = () => {
  const { supabase } = useAuth();
  const [tables, setTables] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewReservationsModalOpen, setIsViewReservationsModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [formData, setFormData] = useState({
    table_number: '',
    capacity: 2,
    status: 'available',
  });
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .order('table_number');
      
      if (error) throw error;
      setTables(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tables:', error);
      toast.error('Failed to fetch tables');
      setLoading(false);
    }
  };

  const fetchReservations = async (tableId) => {
    try {
      const { data, error } = await supabase
        .from('reservations_with_users')
        .select('*')
        .eq('table_id', tableId)
        .gte('reservation_date', selectedDate)
        .lte('reservation_date', new Date(new Date(selectedDate).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('reservation_date')
        .order('reservation_time');
      
      if (error) throw error;
      setReservations(data || []);
    } catch (error) {
      console.error('Error fetching reservations:', error);
      toast.error('Failed to fetch reservations');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updateData = {
        table_number: parseInt(formData.table_number),
        capacity: parseInt(formData.capacity),
        status: formData.status,
        is_reserved: formData.status === 'reserved'
      };

      let error;
      if (selectedTable) {
        ({ error } = await supabase
          .from('tables')
          .update(updateData)
          .eq('id', selectedTable.id));
      } else {
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=table_${formData.table_number}`;
        ({ error } = await supabase
          .from('tables')
          .insert([{ ...updateData, qr_code: qrCodeUrl }]));
      }

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      toast.success(selectedTable ? 'Table updated successfully' : 'Table added successfully');
      setIsModalOpen(false);
      setSelectedTable(null);
      await fetchTables();
    } catch (error) {
      console.error('Error saving table:', error);
      toast.error(error.message || 'Failed to save table');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this table? All reservations for this table will also be deleted.')) return;
    
    try {
      const { error } = await supabase
        .from('tables')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Table deleted successfully');
      fetchTables();
    } catch (error) {
      console.error('Error deleting table:', error);
      toast.error('Failed to delete table');
    }
  };
  const handleViewReservations = (table) => {
    setSelectedTable(table);
    fetchReservations(table.id);
    setIsViewReservationsModalOpen(true);
  };

  const handleCancelReservation = async (reservationId) => {
    if (!confirm('Are you sure you want to cancel this reservation?')) return;
    
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'cancelled' })
        .eq('id', reservationId);
      
      if (error) throw error;
      
      toast.success('Reservation cancelled successfully');
      fetchReservations(selectedTable.id);
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      toast.error('Failed to cancel reservation');
    }
  };

  const formatDate = (dateString) => {
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-IN', options);
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500 dark:text-gray-400">Loading tables...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Table Management</h2>
        <button
          onClick={() => {
            setSelectedTable(null);
            setFormData({
              table_number: '',
              capacity: 2,
              status: 'available',
            });
            setIsModalOpen(true);
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Table
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tables.map(table => (
          <div 
            key={`table-${table.id}-${table.status}`} 
            className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden"
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Table {table.table_number}</h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  table.status === 'available' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' :
                  table.status === 'reserved' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100' :
                  table.status === 'occupied' ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100'
                }`}>
                  {table.status}
                </span>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Capacity: {table.capacity} people
                </p>
                
                <div className="mt-4 flex flex-col space-y-2">
                  <button
                    onClick={() => handleViewReservations(table)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    View Reservations
                  </button>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedTable(table);
                        setFormData({
                          table_number: table.table_number.toString(),
                          capacity: table.capacity,
                          status: table.status,
                        });
                        setIsModalOpen(true);
                      }}
                      className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </button>
                    
                    <button
                      onClick={() => handleDelete(table.id)}
                      className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-red-300 dark:border-red-700 shadow-sm text-sm font-medium rounded-md text-red-700 dark:text-red-400 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Table Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTable(null);
        }}
        title={selectedTable ? 'Edit Table' : 'Add New Table'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Table Number
            </label>
            <input
              type="number"
              value={formData.table_number}
              onChange={(e) => setFormData({ ...formData, table_number: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Capacity
            </label>
            <input
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
              min="1"
              max="20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="available">Available</option>
              <option value="reserved">Reserved</option>
              <option value="occupied">Occupied</option>
              <option value="cleaning">Cleaning</option>
            </select>
          </div>

          <div className="mt-5 sm:mt-6 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setSelectedTable(null);
              }}
              className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
            >
              {selectedTable ? 'Update' : 'Add'} Table
            </button>
          </div>
        </form>
      </Modal>
      {/* View Reservations Modal */}
      <Modal
        isOpen={isViewReservationsModalOpen}
        onClose={() => {
          setIsViewReservationsModalOpen(false);
          setSelectedTable(null);
        }}
        title={selectedTable ? `Reservations for Table ${selectedTable.table_number}` : 'Reservations'}
      >
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Filter by date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              if (selectedTable) {
                fetchReservations(selectedTable.id);
              }
            }}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        
        {reservations.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 my-4">
            No reservations found for this table.
          </p>
        ) : (
          <div className="space-y-4 mt-4 max-h-96 overflow-y-auto">
            {reservations.map(reservation => (
              <div 
                key={reservation.id} 
                className={`border rounded-lg p-4 ${
                  reservation.status === 'cancelled' 
                    ? 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900' 
                    : 'border-indigo-200 bg-indigo-50 dark:border-indigo-900 dark:bg-indigo-900/20'
                }`}
              >
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatDate(reservation.reservation_date)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatTime(reservation.reservation_time)} - {formatTime(
                        new Date(`2000-01-01T${reservation.reservation_time}`)
                          .getTime() + reservation.duration * 60000
                      )}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      Customer: {reservation.raw_user_meta_data.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Email: {reservation.email}
                    </p>
                    {reservation.special_requests && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        <span className="font-medium">Special Requests:</span> {reservation.special_requests}
                      </p>
                    )}
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium h-fit ${
                    reservation.status === 'confirmed' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' 
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {reservation.status === 'confirmed' ? 'Confirmed' : 'Cancelled'}
                  </span>
                </div>
                
                {reservation.status === 'confirmed' && (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => handleCancelReservation(reservation.id)}
                      className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Cancel Reservation
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TableManagement;