import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-hot-toast";
import { Navigate } from "react-router-dom";
import { Calendar, Clock, Users, Info } from "lucide-react";
import Modal from "../components/Modal";
import emailjs from "@emailjs/browser";

const TableBooking = () => {
  const { user, isAuthenticated, supabase } = useAuth();
  const [loading, setLoading] = useState(false);
  const [tables, setTables] = useState([]);
  const [userBookings, setUserBookings] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [showTableModal, setShowTableModal] = useState(false);
  const [formData, setFormData] = useState({
    reservation_date: new Date().toISOString().split("T")[0], // Default to today
    reservation_time: "",
    guests: 2, // Default to 2 guests
    special_requests: "",
  });

  useEffect(() => {
    fetchTables();
    if (isAuthenticated && user) {
      fetchUserBookings();
    }
  }, [isAuthenticated, user]);

  const fetchTables = async () => {
    try {
      const { data, error } = await supabase
        .from("tables")
        .select("*")
        .order("table_number");

      if (error) throw error;
      setTables(data || []);
    } catch (error) {
      console.error("Error fetching tables:", error);
      toast.error("Failed to load available tables");
    }
  };

  const fetchUserBookings = async () => {
    try {
      const { data, error } = await supabase
        .from("reservations")
        .select(
          `
          *,
          table:table_id (
            table_number,
            capacity
          )
        `
        )
        .eq("user_id", user.id)
        .order("reservation_date", { ascending: false });

      if (error) throw error;
      setUserBookings(data || []);
    } catch (error) {
      console.error("Error fetching user bookings:", error);
    }
  };

  const sendBookingConfirmationEmail = (userEmail, booking) => {
    const reservationDateTime = new Date(
      `${booking.reservation_date}T${booking.reservation_time}`
    );
    const reservationEndTime = new Date(
      reservationDateTime.getTime() + booking.duration * 60000
    );

    const emailParams = {
      user_email: userEmail,
      booking_id: booking.id,
      table_number: booking.table.table_number,
      reservation_date: formatDate(booking.reservation_date),
      reservation_time: `${formatTime(reservationDateTime)} - ${formatTime(
        reservationEndTime
      )}`,
      guests: booking.guests,
      special_requests: booking.special_requests || "",
      restaurant_name: "Your Restaurant Name",
      restaurant_address: "Restaurant Address",
      restaurant_contact: "+91-XXXXXXXXXX",
      subject: `Your Table Booking Confirmation at Your Restaurant Name`,
    };

    emailjs
      .send(
        "service_o51ew0e",
        "template_gpv02pb",
        emailParams,
        "Wq9LPEIYq_4-UHOkQ"
      )
      .then(() => toast.success("Booking confirmation email sent"))
      .catch((error) => {
        console.error("Email sending failed:", error);
        toast.error("Failed to send confirmation email");
      });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTable) {
      toast.error("Please select a table first");
      return;
    }

    setLoading(true);

    try {
      const reservationDateTime = new Date(
        `${formData.reservation_date}T${formData.reservation_time}`
      );
      const reservationEndTime = new Date(reservationDateTime.getTime() + 90 * 60000);

      const { data: existingReservations, error: checkError } = await supabase
        .from("reservations")
        .select("*")
        .eq("table_id", selectedTable.id)
        .gte("reservation_date", formData.reservation_date)
        .lte("reservation_date", formData.reservation_date);

      if (checkError) throw checkError;

      const hasConflict = existingReservations.some((reservation) => {
        const resTime = new Date(`${reservation.reservation_date}T${reservation.reservation_time}`);
        const resEndTime = new Date(resTime.getTime() + reservation.duration * 60000);

        return (
          (reservationDateTime >= resTime && reservationDateTime < resEndTime) ||
          (reservationEndTime > resTime && reservationEndTime <= resEndTime) ||
          (reservationDateTime <= resTime && reservationEndTime >= resEndTime)
        );
      });

      if (hasConflict) {
        toast.error("This table is already booked for the selected time");
        setLoading(false);
        return;
      }

      const { data: reservation, error: reservationError } = await supabase
        .from("reservations")
        .insert([
          {
            table_id: selectedTable.id,
            user_id: user.id,
            reservation_date: formData.reservation_date,
            reservation_time: formData.reservation_time,
            guests: formData.guests, // Include guests
            duration: 90,
            special_requests: formData.special_requests,
            status: "confirmed",
          },
        ])
        .select()
        .single();

      if (reservationError) throw reservationError;

      await supabase
        .from("table_status_history")
        .insert([
          {
            table_id: selectedTable.id,
            status: "reserved",
            changed_by: user.id,
            notes: `Reserved for ${formData.guests} guests on ${formData.reservation_date} at ${formData.reservation_time}`,
          },
        ]);

      sendBookingConfirmationEmail(user.email, { ...reservation, table: selectedTable });

      fetchUserBookings();

      setFormData({
        reservation_date: new Date().toISOString().split("T")[0],
        reservation_time: "",
        guests: 2,
        special_requests: "",
      });
      setSelectedTable(null);

      toast.success("Table booked successfully!");
    } catch (error) {
      console.error("Booking error:", error);
      toast.error(error.message || "Failed to book table");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "guests" ? Number(value) : value, // Ensure guests is a number
    }));
  };

  const handleTableSelect = (table) => {
    if (table.capacity < formData.guests) {
      toast.error(`This table only accommodates ${table.capacity} guests`);
      return;
    }

    setSelectedTable(table);
    setShowTableModal(false);
  };

  const cancelReservation = async (reservationId) => {
    if (!confirm("Are you sure you want to cancel this reservation?")) return;

    try {
      const { error } = await supabase
        .from("reservations")
        .update({ status: "cancelled" })
        .eq("id", reservationId);

      if (error) throw error;

      toast.success("Reservation cancelled successfully");
      fetchUserBookings();
    } catch (error) {
      console.error("Error cancelling reservation:", error);
      toast.error("Failed to cancel reservation");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (time) => {
    return new Date(time).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Table Booking</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Book a Table</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="reservation_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      <Calendar className="inline-block w-4 h-4 mr-1" />
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
                      className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="reservation_time" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      <Clock className="inline-block w-4 h-4 mr-1" />
                      Time
                    </label>
                    <input
                      type="time"
                      name="reservation_time"
                      id="reservation_time"
                      required
                      value={formData.reservation_time}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="guests" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <Users className="inline-block w-4 h-4 mr-1" />
                    Number of Guests
                  </label>
                  <select
                    name="guests"
                    id="guests"
                    required
                    value={formData.guests}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map((num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? 'Guest' : 'Guests'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="special_requests" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Special Requests (Optional)
                  </label>
                  <textarea
                    name="special_requests"
                    id="special_requests"
                    rows={3}
                    value={formData.special_requests}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                    placeholder="Any special requests or preferences..."
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowTableModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Select Table
                  </button>
                  
                  {selectedTable && (
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      Selected: Table {selectedTable.table_number} (Capacity: {selectedTable.capacity})
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <Info className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200">Booking Information</h3>
                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Reservations are for 1.5 hours from the booking time</li>
                          <li>Please arrive 10 minutes before your reservation time</li>
                          <li>Cancellations should be made at least 2 hours in advance</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading || !selectedTable}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 dark:bg-indigo-700 dark:hover:bg-indigo-600"
                  >
                    {loading ? 'Booking...' : 'Book Table'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Your Bookings */}
          <div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Your Bookings</h2>
              
              {userBookings.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">You don't have any bookings yet.</p>
              ) : (
                <div className="space-y-4">
                  {userBookings.map((booking) => (
                    <div 
                      key={booking.id} 
                      className={`border rounded-lg p-4 ${
                        booking.status === 'cancelled' 
                          ? 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900' 
                          : 'border-indigo-200 bg-indigo-50 dark:border-indigo-900 dark:bg-indigo-900/20'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            Table {booking.table.table_number}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(booking.reservation_date)}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {formatTime(booking.reservation_time)} - {formatTime(
                              new Date(`2000-01-01T${booking.reservation_time}`)
                                .getTime() + booking.duration * 60000
                            )}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Capacity: {booking.table.capacity} people
                          </p>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          booking.status === 'confirmed' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' 
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {booking.status === 'confirmed' ? 'Confirmed' : 'Cancelled'}
                        </span>
                      </div>
                      
                      {booking.status === 'confirmed' && (
                        <div className="mt-4 flex justify-end">
                          <button
                            onClick={() => cancelReservation(booking.id)}
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
            </div>
          </div>
        </div>
      </div>

      {/* Table Selection Modal */}
      <Modal
        isOpen={showTableModal}
        onClose={() => setShowTableModal(false)}
        title="Select a Table"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          {tables
            .filter(table => table.capacity >= formData.guests)
            .map(table => (
              <div
                key={table.id}
                onClick={() => handleTableSelect(table)}
                className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <h3 className="font-medium text-gray-900 dark:text-white">Table {table.table_number}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Capacity: {table.capacity} people</p>
                <div className="mt-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    table.status === 'available' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' 
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                  }`}>
                    {table.status}
                  </span>
                </div>
              </div>
            ))}
        </div>
        {tables.filter(table => table.capacity >= formData.guests).length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400 my-4">
            No tables available for {formData.guests} guests. Please select a smaller party size.
          </p>
        )}
      </Modal>
    </div>
  );
};

export default TableBooking;