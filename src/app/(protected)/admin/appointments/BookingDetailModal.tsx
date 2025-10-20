import { Booking } from '@/lib/mongodb/models/Booking';
import Image from 'next/image';
import {
  FaUser, FaEnvelope, FaPhone, FaCalendarAlt, FaMoon, FaUsers,
  FaMapMarkerAlt, FaBuilding, FaConciergeBell, FaMoneyBillWave, FaShieldAlt,
  FaBed, FaSmoking, FaPaw, FaGlassCheers, FaClock
} from 'react-icons/fa';


// Props for the main modal component
interface BookingDetailModalProps {
  booking: Booking;
  onClose: () => void;
}

// Helper to format currency
const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
};

// Helper to format dates and times
const formatDateTime = (isoString: string) => {
  return new Date(isoString).toLocaleString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

// A reusable component for each section
const DetailSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="mb-6">
    <h3 className="text-xl font-bold text-[#003c95] border-b pb-2 mb-4">{title}</h3>
    <div className="space-y-3">{children}</div>
  </div>
);

// A reusable component for key-value pairs with icons
const DetailItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number | React.ReactNode }) => (
  <div className="flex items-start">
    <span className="text-[#003c95] mr-3 mt-1">{icon}</span>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-semibold text-gray-800">{value}</p>
    </div>
  </div>
);

// Badge for booking status
const StatusBadge = ({ status }: { status: string }) => {
  const baseClasses = 'px-3 py-1 text-sm font-bold rounded-full capitalize';
  const statusClasses = {
    confirmed: 'bg-green-100 text-green-800',
    succeeded: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    cancelled: 'bg-red-100 text-red-800',
    failed: 'bg-red-100 text-red-800',
  };
  // @ts-expect-error - TypeScript doesn't infer status as a key of statusClasses object
  return <span className={`${baseClasses} ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
};


// --- Main Component ---

export default function BookingDetailModal({ booking, onClose }: BookingDetailModalProps) {
  if (!booking) return null;

  const { infoDetails, bookingDetails, guestDetails } = booking;

  return (
    // Overlay
    <div
      className="fixed inset-0 bg-black/60 z-100 flex justify-center items-center p-4 transition-opacity"
      onClick={onClose}
    >
      {/* Modal Content */}
      <div
        className="bg-gray-50 rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b flex justify-between items-center bg-white rounded-t-xl">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-800">Booking Confirmation</h2>
            <p className="text-sm text-gray-500">Booking ID: {booking._id?.toString() ?? 'N/A'}</p> 
          </div>
          <div className='flex items-center space-x-4'>
            <StatusBadge status={booking.status || 'pending'} />
            <button onClick={onClose} className="text-gray-400 hover:text-gray-800 text-3xl">&times;</button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Property & Trip Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg bg-white">
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900">{infoDetails.title}</h3>
              <DetailItem icon={<FaBuilding />} label="Property Type" value={<span className="capitalize">{infoDetails.type}</span>} />
              <DetailItem icon={<FaMapMarkerAlt />} label="Location" value={infoDetails.location ? `${infoDetails.location.address}, ${infoDetails.location.city}` : 'N/A'} />
              <DetailItem icon={<FaCalendarAlt />} label="Check-in" value={formatDateTime(bookingDetails.checkIn)} />
              <DetailItem icon={<FaCalendarAlt />} label="Check-out" value={formatDateTime(bookingDetails.checkOut)} />
              <DetailItem icon={<FaMoon />} label="Duration" value={`${bookingDetails.numberOfNights} Night(s)`} />
              <DetailItem icon={<FaUsers />} label="Guests" value={`${bookingDetails.adults} Adults, ${bookingDetails.children} Children`} />
              <DetailItem icon={<FaConciergeBell />} label="Meal Plan" value={<span className="capitalize">{bookingDetails.selectedMealPlan.replace(/([A-Z])/g, ' $1').trim()}</span>} />
            </div>
            <div>
                {infoDetails.bannerImage?.url ? (
                <Image 
                  src={infoDetails.bannerImage.url} 
                  alt={infoDetails.bannerImage?.alt || infoDetails.title} 
                  className="rounded-lg w-full h-full object-cover"
                  width={400}
                  height={300}
                />
                ) : (
                <div className="rounded-lg w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">No image</div>
                )}
            </div>
          </div>
          
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Guest Details */}
            <DetailSection title="Guest Information">
              <div className='p-4 border rounded-lg bg-white grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <DetailItem icon={<FaUser />} label="Full Name" value={`${guestDetails.firstName} ${guestDetails.lastName}`} />
                <DetailItem icon={<FaEnvelope />} label="Email" value={guestDetails.email} />
                <DetailItem icon={<FaPhone />} label="Phone" value={guestDetails.phone} />
                <DetailItem icon={<FaMapMarkerAlt />} label="Country" value={guestDetails.country} />
                <DetailItem icon={<FaUser />} label="Booking For" value={<span className='capitalize'>{guestDetails.bookingFor}</span>} />
                <DetailItem icon={<FaBed />} label="Traveling For" value={<span className='capitalize'>{guestDetails.travellingFor}</span>} />
              </div>
            </DetailSection>

            {/* Payment Details */}
            <DetailSection title="Payment & Price Details">
              <div className="p-4 border rounded-lg bg-white space-y-2">
                <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatCurrency(bookingDetails.subtotal, bookingDetails.currency)}</span></div>
                <div className="flex justify-between text-gray-600"><span>Service Fee</span><span>{formatCurrency(bookingDetails.serviceFee, bookingDetails.currency)}</span></div>
                <div className="flex justify-between text-gray-600"><span>Taxes</span><span>{formatCurrency(bookingDetails.taxes, bookingDetails.currency)}</span></div>
                <hr className="my-2" />
                <div className="flex justify-between font-bold text-lg text-gray-900">
                  <span>Total Paid</span>
                  <span>{formatCurrency(bookingDetails.totalPrice, bookingDetails.currency)}</span>
                </div>
                <div className="pt-3 text-sm">
                    <p className='flex items-center'>
                      <FaMoneyBillWave className="mr-2 text-green-600" />
                      Paid via <strong className='capitalize mx-1'>{bookingDetails.payment.provider}</strong>
                      <StatusBadge status={bookingDetails.payment.status || 'pending'} />
                    </p>
                    <p className="text-gray-500 mt-1">Payment ID: {bookingDetails.payment.paymentId}</p>
                </div>
              </div>
            </DetailSection>
          </div>

          {/* House Rules */}
          <DetailSection title="Hotel Policies">
            <div className='p-4 border rounded-lg bg-white grid grid-cols-2 md:grid-cols-4 gap-4'>
                <DetailItem icon={<FaClock />} label="Check-in Time" value={infoDetails?.houseRules?.checkInTime ?? 'N/A'} />
                <DetailItem icon={<FaClock />} label="Check-out Time" value={infoDetails?.houseRules?.checkOutTime ?? 'N/A'} />
                <DetailItem icon={<FaSmoking />} label="Smoking" value={infoDetails?.houseRules?.smokingAllowed ? 'Allowed' : 'Not Allowed'} />
                <DetailItem icon={<FaPaw />} label="Pets" value={infoDetails?.houseRules?.petsAllowed ? 'Allowed' : 'Not Allowed'} />
                <DetailItem icon={<FaGlassCheers />} label="Parties" value={infoDetails?.houseRules?.partiesAllowed ? 'Allowed' : 'Not Allowed'} />
            </div>
             <div className="p-4 border rounded-lg bg-white">
                <h4 className="font-semibold text-gray-700 mb-2">Reservation Policy</h4>
                <div className="flex flex-wrap gap-2">
                  {(infoDetails.reservationPolicy ?? []).map(policy => (
                    <span key={policy} className="bg-blue-100 text-blue-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">
                      <FaShieldAlt className="inline mr-1" />{policy}
                    </span>
                  ))}
                </div>
            </div>
          </DetailSection>

        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-100 border-t text-right rounded-b-xl">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}