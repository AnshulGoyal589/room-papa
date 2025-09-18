// FILE: components/booking/BookingsList.tsx

'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Calendar, Hash, Hotel, MapPin, Moon, Users, X, FileText, Briefcase, Plane, User, AlertCircle, Building
} from 'lucide-react';
import { Booking } from '@/lib/mongodb/models/Booking';

// --- Helper Functions ---

const getStatusClasses = (status: string) => {
    switch (status) {
        case 'confirmed': return 'bg-green-100 text-green-800 ring-green-600/20';
        case 'pending': return 'bg-yellow-100 text-yellow-800 ring-yellow-600/20';
        case 'cancelled': return 'bg-red-100 text-red-800 ring-red-600/20';
        default: return 'bg-gray-100 text-gray-800 ring-gray-600/20';
    }
};

const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
});

const getBookingIcon = (type: Booking['type']) => {
    switch (type) {
        case 'property': return <Hotel size={16} className="mr-2 text-[#001d2c]" />;
        case 'trip': return <Briefcase size={16} className="mr-2 text-purple-600" />;
        case 'travelling': return <Plane size={16} className="mr-2 text-teal-600" />;
        default: return <Briefcase size={16} className="mr-2 text-gray-600" />;
    }
};

// --- Booking Card Component ---
const BookingCard = ({ booking, onSelect }: { booking: Booking; onSelect: (booking: Booking) => void }) => {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 flex flex-col hover:border-[#001d2c] hover:shadow-xl transition-all"
        >
            <div className="p-4 flex-grow">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-gray-900 pr-4">{booking.tripDetails.title}</h3>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ring-1 ring-inset ${getStatusClasses(booking.status)}`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                </div>
                <div className="flex items-center text-sm text-gray-500 mb-4">
                    <MapPin size={14} className="mr-1.5" />
                    <span>{booking.tripDetails.locationTo}</span>
                </div>
                <div className="space-y-3 text-sm border-t pt-3">
                    <div className="flex items-center text-gray-700">
                        {getBookingIcon(booking.type)}
                        <span className="font-semibold">{formatDate(booking.bookingDetails.checkIn)}</span>
                        {booking.type === 'property' && <span className="ml-auto text-xs text-gray-500">{booking.bookingDetails.numberOfNights} nights</span>}
                    </div>
                    <div className="flex items-center text-gray-700">
                        <Hash size={14} className="mr-2.5 text-gray-500" />
                        {/* The _id from MongoDB is an object on the server, but a string after JSON serialization */}
                        <span>ID: {(booking._id as unknown as string).slice(-8)}</span>
                    </div>
                </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 border-t flex justify-end">
                <button 
                    onClick={() => onSelect(booking)}
                    className="bg-[#001d2c] text-white px-4 py-1.5 rounded-md text-sm font-semibold hover:bg-[#001d2c] transition-colors"
                >
                    View Details
                </button>
            </div>
        </motion.div>
    );
};

// --- Cancel Confirmation Modal ---
const CancelConfirmationModal = ({ onConfirm, onCancel, isCancelling }: { onConfirm: () => void; onCancel: () => void; isCancelling: boolean; }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[60] backdrop-blur-sm"
            onClick={onCancel} 
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-lg p-6 shadow-xl max-w-sm w-full text-center"
                onClick={(e) => e.stopPropagation()}
            >
                <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
                <h3 className="text-lg font-semibold text-gray-800 mt-4">Are you sure?</h3>
                <p className="text-sm text-gray-500 mt-2">This action cannot be undone. Your booking will be permanently cancelled.</p>
                <div className="mt-6 flex justify-center space-x-3">
                    <button onClick={onCancel} disabled={isCancelling} className="px-4 py-2 text-sm font-semibold bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50">No, keep it</button>
                    <button onClick={onConfirm} disabled={isCancelling} className="px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-400 disabled:cursor-wait">
                        {isCancelling ? 'Cancelling...' : 'Yes, cancel'}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};


// --- Booking Detail Modal ---
const BookingDetailModal = ({ booking, onClose, onBookingUpdate }: { booking: Booking; onClose: () => void; onBookingUpdate: (updatedBooking: Booking) => void; }) => {
    const [isCancelling, setIsCancelling] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);

    const isCheckInFuture = new Date(booking.bookingDetails.checkIn) > new Date();
    // In a real app, you would check a `cancellationPolicy` field from the booking data.
    // For this example, we'll assume any confirmed future booking is cancellable.
    const isCancellable = booking.status === 'confirmed' && isCheckInFuture;

    const handleConfirmCancel = async () => {
        setIsCancelling(true);
        try {
            const response = await fetch(`/api/bookings/${booking._id}/cancel`, { method: 'POST' });
            if (!response.ok) throw new Error('Failed to cancel booking.');
            const updatedBooking = await response.json();
            onBookingUpdate(updatedBooking); // Update the state in the parent component
            setShowCancelConfirm(false); // Close the confirmation modal
        } catch (error) {
            console.error(error);
            // Here you would show a toast message to the user
        } finally {
            setIsCancelling(false);
        }
    };

    const Section = ({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) => (
        <div>
            <div className="flex items-center mb-3">{icon}<h4 className="font-bold text-lg text-gray-800">{title}</h4></div>
            <div className="pl-8 space-y-4">{children}</div>
        </div>
    );

    return (
       <>
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 30 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                    className="bg-gray-50 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-5 sticky top-0 bg-white/80 backdrop-blur-lg border-b z-10 flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{booking.tripDetails.title}</h2>
                            <p className="text-sm text-gray-500">{booking.tripDetails.locationTo}</p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                    </div>
                    
                    {/* Body */}
                    <div className="p-6 space-y-8 flex-grow">
                        {/* Type-Specific Details using Discriminated Union */}
                        {booking.type === 'property' && (
                            <Section title="Your Stay" icon={<Hotel size={20} className="mr-3 text-[#001d2c]"/>}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                                    <div className="flex items-start"><Calendar size={16} className="mr-3 mt-1"/><div><p className="font-semibold">Check-in</p><p>{formatDate(booking.bookingDetails.checkIn)}</p></div></div>
                                    <div className="flex items-start"><Calendar size={16} className="mr-3 mt-1"/><div><p className="font-semibold">Check-out</p><p>{formatDate(booking.bookingDetails.checkOut)}</p></div></div>
                                    <div className="flex items-start"><Moon size={16} className="mr-3 mt-1"/><div><p className="font-semibold">Duration</p><p>{booking.bookingDetails.numberOfNights} nights</p></div></div>
                                    <div className="flex items-start"><Users size={16} className="mr-3 mt-1"/><div><p className="font-semibold">Guests</p><p>{booking.bookingDetails.totalGuests} ({booking.bookingDetails.adults} Adults, {booking.bookingDetails.children} Children)</p></div></div>
                                </div>
                            </Section>
                        )}
                        {booking.type === 'trip' && (
                             <Section title="Your Trip" icon={<Briefcase size={20} className="mr-3 text-purple-600"/>}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                                    <div className="flex items-start"><Calendar size={16} className="mr-3 mt-1"/><div><p className="font-semibold">Start Date</p><p>{formatDate(booking.bookingDetails.checkIn)}</p></div></div>
                                    <div className="flex items-start"><Calendar size={16} className="mr-3 mt-1"/><div><p className="font-semibold">End Date</p><p>{formatDate(booking.bookingDetails.checkOut)}</p></div></div>
                                    <div className="flex items-start"><Users size={16} className="mr-3 mt-1"/><div><p className="font-semibold">Guests</p><p>{booking.bookingDetails.totalGuests}</p></div></div>
                                </div>
                            </Section>
                        )}
                        {booking.type === 'travelling' && (
                            <Section title="Your Travel" icon={<Plane size={20} className="mr-3 text-teal-600"/>}>
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                                    <div className="flex items-start"><Calendar size={16} className="mr-3 mt-1"/><div><p className="font-semibold">Departure</p><p>{formatDate(booking.bookingDetails.checkIn)}</p></div></div>
                                    <div className="flex items-start"><MapPin size={16} className="mr-3 mt-1"/><div><p className="font-semibold">From / To</p><p>{booking.tripDetails.locationFrom} to {booking.tripDetails.locationTo}</p></div></div>
                                    <div className="flex items-start"><Users size={16} className="mr-3 mt-1"/><div><p className="font-semibold">Passengers</p><p>{booking.bookingDetails.totalGuests}</p></div></div>
                                    <div className="flex items-start"><Building size={16} className="mr-3 mt-1"/><div><p className="font-semibold">Transport</p><p>{booking.tripDetails.transportType}</p></div></div>
                               </div>
                           </Section>
                        )}

                        <Section title="Guest Details" icon={<User size={20} className="mr-3 text-[#001d2c]"/>}>
                            <div className="text-sm space-y-2">
                                <p><span className="font-semibold w-28 inline-block">Main Contact:</span> {booking.guestDetails.firstName} {booking.guestDetails.lastName}</p>
                                <p><span className="font-semibold w-28 inline-block">Email:</span> {booking.guestDetails.email}</p>
                                <p><span className="font-semibold w-28 inline-block">Phone:</span> {booking.guestDetails.phone}</p>
                            </div>
                        </Section>
                        
                        <Section title="Payment Details" icon={<FileText size={20} className="mr-3 text-[#001d2c]"/>}>
                             <div className="text-sm space-y-2 p-4 bg-white rounded-lg border">
                                {booking.type === 'property' && (
                                    <>
                                      <div className="flex justify-between"><span>Subtotal</span><span>{booking.bookingDetails.subtotal.toFixed(2)}</span></div>
                                      <div className="flex justify-between"><span>Service Fee</span><span>{booking.bookingDetails.serviceFee.toFixed(2)}</span></div>
                                      <div className="flex justify-between pb-2 border-b"><span>Taxes</span><span>{booking.bookingDetails.taxes.toFixed(2)}</span></div>
                                    </>
                                )}
                                <div className="flex justify-between font-bold text-lg mt-2"><span>Total Paid</span><span>{booking.bookingDetails.currency} {booking.bookingDetails.totalPrice.toFixed(2)}</span></div>
                            </div>
                        </Section>
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-white/80 backdrop-blur-lg border-t flex justify-between items-center sticky bottom-0">
                         <div>
                            {isCancellable && (
                                <button onClick={() => setShowCancelConfirm(true)} className="text-sm font-semibold text-red-600 hover:text-red-800 transition-colors">Cancel Booking</button>
                            )}
                            {booking.status === 'cancelled' && <p className="text-sm font-semibold text-red-500">This booking has been cancelled.</p>}
                         </div>
                        <button onClick={onClose} className="bg-[#001d2c] text-white px-5 py-2 rounded-lg font-semibold hover:bg-[#001d2c]">Close</button>
                    </div>
                </motion.div>
            </motion.div>

            <AnimatePresence>
                {showCancelConfirm && <CancelConfirmationModal isCancelling={isCancelling} onConfirm={handleConfirmCancel} onCancel={() => setShowCancelConfirm(false)} />}
            </AnimatePresence>
       </>
    );
};

// --- Main List Component ---
export default function BookingsList({ initialBookings }: { initialBookings: Booking[] }) {
    // Take the server-provided bookings and put them into client state so they can be updated.
    const [bookings, setBookings] = useState<Booking[]>(initialBookings);
    const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

    // This function allows the modal to update the list's state after a cancellation.
    const handleBookingUpdate = (updatedBooking: Booking) => {
        setBookings(currentBookings =>
            currentBookings.map(b => (b._id as unknown as string) === (updatedBooking._id as unknown as string) ? updatedBooking : b)
        );
        // If the updated booking is the one currently selected, update it in the modal too
        if (selectedBooking?._id === updatedBooking._id) {
            setSelectedBooking(updatedBooking);
        }
    };

    const filteredBookings = bookings.filter(booking => {
        if (filter === 'all') return true;
        const checkInDate = new Date(booking.bookingDetails.checkIn);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize today's date to the beginning of the day
        if (filter === 'upcoming') return checkInDate >= today;
        if (filter === 'past') return checkInDate < today;
        return true;
    });

    return (
        <div>
            {/* Filter Controls */}
            <div className="flex items-center space-x-2 mb-6 bg-white p-2 rounded-lg shadow-sm border w-fit">
                {(['all', 'upcoming', 'past'] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${filter === f ? 'bg-[#001d2c] text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {/* Bookings Grid */}
            <AnimatePresence>
                {filteredBookings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredBookings.map(booking => <BookingCard key={(booking._id as unknown as string)} booking={booking} onSelect={setSelectedBooking} />)}
                    </div>
                ) : (
                    <div className="text-center py-16 px-6 bg-white rounded-lg shadow-sm border">
                         <FileText size={48} className="mx-auto text-gray-300" />
                        <h3 className="mt-4 text-xl font-semibold text-gray-800">No Bookings Found</h3>
                        <p className="mt-1 text-gray-500">You have no {filter !== 'all' ? filter : ''} bookings.</p>
                    </div>
                )}
            </AnimatePresence>

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedBooking && <BookingDetailModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} onBookingUpdate={handleBookingUpdate}/>}
            </AnimatePresence>
        </div>
    );
}