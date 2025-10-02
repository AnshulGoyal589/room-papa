// components/manager/BookingDetailModal.tsx

import { BookingDetails } from '@/lib/mongodb/models/Booking';

interface BookingDetailModalProps {
  booking: BookingDetails;
  onClose: () => void;
}

// Helper to format currency
const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export default function BookingDetailModal({ booking, onClose }: BookingDetailModalProps) {
  if (!booking) return null;

  return (
    // Overlay
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-60 flex justify-center items-center p-4"
      onClick={onClose} // Close modal if overlay is clicked
    >
      {/* Modal Content */}
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Booking Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
        </div>

        <div className="p-6 space-y-6">
          {/* Trip Details Section */}
          <div className="p-4 border rounded-md">
            <h3 className="text-lg font-semibold mb-2 text-[#003c95]">Trip Information</h3>
            <p><strong>Title:</strong> {booking.tripDetails.title}</p>
            <p><strong>Location:</strong> {booking.tripDetails.locationTo}</p>
            <p><strong>Type:</strong> <span className="capitalize">{booking.type}</span></p>
          </div>

          {/* Guest Details Section */}
          <div className="p-4 border rounded-md">
            <h3 className="text-lg font-semibold mb-2 text-[#003c95]">Guest Details</h3>
            <p><strong>Name:</strong> {booking.guestDetails.firstName} {booking.guestDetails.lastName}</p>
            <p><strong>Email:</strong> {booking.guestDetails.email}</p>
            <p><strong>Phone:</strong> {booking.guestDetails.phone}</p>
            {booking.guestDetails.specialRequests && (
                <p><strong>Special Requests:</strong> {booking.guestDetails.specialRequests}</p>
            )}
          </div>

          {/* Booking & Price Details Section */}
          <div className="p-4 border rounded-md">
            <h3 className="text-lg font-semibold mb-2 text-[#003c95]">Booking & Price Details</h3>
            <p><strong>Check-in:</strong> {new Date(booking.bookingDetails.checkIn).toLocaleDateString()}</p>
            <p><strong>Check-out:</strong> {new Date(booking.bookingDetails.checkOut).toLocaleDateString()}</p>
            <p><strong>Nights:</strong> {booking.bookingDetails.numberOfNights}</p>
            <p><strong>Guests:</strong> {booking.bookingDetails.adults} Adults, {booking.bookingDetails.children} Children</p>
            <p><strong>Total Price:</strong> <span className="font-bold">{formatCurrency(booking.bookingDetails.totalPrice, booking.bookingDetails.currency)}</span></p>
          </div>
        </div>

        <div className="p-4 bg-gray-50 border-t text-right">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Close
            </button>
        </div>
      </div>
    </div>
  );
}