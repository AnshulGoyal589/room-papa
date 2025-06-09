'use client';

import React, { useState } from 'react';
import { Booking, PropertyBooking } from '@/lib/mongodb/models/Booking';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Calendar, Clock, Hash, Hotel, MapPin, Moon, Users, X, FileText, CheckCircle, Briefcase, Plane, Car, User, AlertCircle
} from 'lucide-react';

// --- Helper Functions and Components ---

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

// --- Booking Card Component ---
const BookingCard = ({ booking, onSelect }: { booking: Booking; onSelect: (booking: Booking) => void }) => {
    const isProperty = booking.type === 'property';
    const propertyBooking = isProperty ? (booking as PropertyBooking) : null;
    const checkIn = new Date(propertyBooking?.bookingDetails.checkIn || booking.tripDetails.locationFrom);
    
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 flex flex-col hover:border-blue-500 hover:shadow-xl transition-all"
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
                        <Calendar size={14} className="mr-2.5 text-gray-500" />
                        <span className="font-semibold">{formatDate(checkIn.toISOString())}</span>
                    </div>
                    <div className="flex items-center text-gray-700">
                        <Hash size={14} className="mr-2.5 text-gray-500" />
                        <span>ID: {booking._id?.toString() || 'N/A'}</span>
                    </div>
                </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 border-t flex justify-end">
                 <button 
                    onClick={() => onSelect(booking)}
                    className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm font-semibold hover:bg-blue-700 transition-colors"
                >
                    View Details
                </button>
            </div>
        </motion.div>
    );
};

// --- NEW: Cancel Confirmation Modal ---
const CancelConfirmationModal = ({ onConfirm, onCancel, isCancelling }: { onConfirm: () => void; onCancel: () => void; isCancelling: boolean; }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[60] backdrop-blur-sm"
            onClick={onCancel} // Allow closing by clicking outside
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-lg p-6 shadow-xl max-w-sm w-full text-center"
                onClick={(e) => e.stopPropagation()}
            >
                <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
                <h3 className="text-lg font-semibold text-gray-800 mt-4">Are you sure?</h3>
                <p className="text-sm text-gray-500 mt-2">
                    This action cannot be undone. Your booking will be permanently cancelled.
                </p>
                <div className="mt-6 flex justify-center space-x-3">
                    <button
                        onClick={onCancel}
                        disabled={isCancelling}
                        className="px-4 py-2 text-sm font-semibold bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50"
                    >
                        No, keep it
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isCancelling}
                        className="px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-400 disabled:cursor-wait flex items-center justify-center"
                    >
                        {isCancelling && (
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                        {isCancelling ? 'Cancelling...' : 'Yes, cancel booking'}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};


// --- Booking Detail Modal (Modified for Cancellation) ---
const BookingDetailModal = ({ booking, onClose, onBookingUpdate }: { booking: Booking; onClose: () => void; onBookingUpdate: (updatedBooking: Booking) => void; }) => {
    const isProperty = booking.type === 'property';
    const propertyBooking = isProperty ? (booking as PropertyBooking) : null;
    const guestDetails = propertyBooking?.guestDetails || booking.guestDetails;

    const [isCancelling, setIsCancelling] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [cancelError, setCancelError] = useState<string | null>(null);

    const handleConfirmCancel = async () => {
        setIsCancelling(true);
        setCancelError(null);
        try {
            const response = await fetch(`/api/bookings/${booking._id}/cancel`, {
                method: 'POST',
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(errorData || "Failed to cancel booking.");
            }

            const updatedBooking = await response.json();
            onBookingUpdate(updatedBooking);
            setShowCancelConfirm(false); 
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            setCancelError(errorMessage);
            // Hide the confirmation modal on error to show the error message in the main modal
            setShowCancelConfirm(false);
        } finally {
            setIsCancelling(false);
        }
    };

    const isCancellable = booking.status === 'confirmed' && new Date(booking.bookingDetails.checkIn) > new Date();

    const Section = ({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) => (
        <div>
            <div className="flex items-center mb-3">
                {icon}
                <h4 className="font-bold text-lg text-gray-800">{title}</h4>
            </div>
            <div className="pl-8 space-y-4">{children}</div>
        </div>
    );
    
    return (
       <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, y: 30 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 30 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                    className="bg-gray-50 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-5 sticky top-0 bg-white/80 backdrop-blur-lg border-b z-10 flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{booking.tripDetails.title}</h2>
                            <p className="text-sm text-gray-500">{booking.tripDetails.locationTo}</p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                    </div>
                    
                    <div className="p-6 space-y-8 flex-grow">
                        {propertyBooking && (
                            <Section title="Your Stay" icon={<Hotel size={20} className="mr-3 text-blue-600"/>}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                                    <div className="flex items-start"><Calendar size={16} className="mr-3 text-gray-500 mt-1"/><div><p className="font-semibold text-gray-500">Check-in</p><p className="text-gray-800 font-bold">{new Date(propertyBooking.bookingDetails.checkIn).toLocaleString('en-US', { dateStyle: 'full' })}</p></div></div>
                                    <div className="flex items-start"><Calendar size={16} className="mr-3 text-gray-500 mt-1"/><div><p className="font-semibold text-gray-500">Check-out</p><p className="text-gray-800 font-bold">{new Date(propertyBooking.bookingDetails.checkOut).toLocaleString('en-US', { dateStyle: 'full' })}</p></div></div>
                                    <div className="flex items-start"><Moon size={16} className="mr-3 text-gray-500 mt-1"/><div><p className="font-semibold text-gray-500">Duration</p><p className="text-gray-800 font-bold">{propertyBooking.bookingDetails.numberOfNights} nights</p></div></div>
                                    <div className="flex items-start"><Users size={16} className="mr-3 text-gray-500 mt-1"/><div><p className="font-semibold text-gray-500">Guests</p><p className="text-gray-800 font-bold">{propertyBooking.bookingDetails.totalGuests} ({propertyBooking.bookingDetails.adults} Adults, {propertyBooking.bookingDetails.children} Children)</p></div></div>
                                    {guestDetails.arrivalTime && <div className="flex items-start"><Clock size={16} className="mr-3 text-gray-500 mt-1"/><div><p className="font-semibold text-gray-500">Arrival Time</p><p className="text-gray-800 font-bold">{guestDetails.arrivalTime}</p></div></div>}
                                </div>
                                <div className="pt-4 border-t">
                                    <h5 className="font-semibold text-gray-700 mb-2">Room Selections</h5>
                                    <div className="space-y-2 rounded-lg text-sm">
                                        {propertyBooking.bookingDetails.roomsDetail.map((room, index) => (
                                            <div key={`${room.categoryId}-${index}`} className="flex justify-between items-center p-2 bg-white border rounded-md">
                                                <div><span className="font-semibold bg-gray-200 text-gray-700 px-2 py-0.5 rounded-md mr-2">{room.qty} x</span><span>{room.title}</span></div>
                                                <span className="text-gray-600">{booking.bookingDetails.currency} {(room.estimatedPricePerRoomNight * room.qty).toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Section>
                        )}
                        
                        <Section title="Guest Details" icon={<User size={20} className="mr-3 text-blue-600"/>}>
                            <div className="text-sm space-y-2">
                                <p><span className="font-semibold w-24 inline-block">Main Contact:</span> {guestDetails.firstName} {guestDetails.lastName}</p>
                                <p><span className="font-semibold w-24 inline-block">Email:</span> {guestDetails.email}</p>
                                <p><span className="font-semibold w-24 inline-block">Phone:</span> {guestDetails.phone}</p>
                                {guestDetails.travelingFor === 'work' && <p><span className="font-semibold w-24 inline-block">Travel Type:</span><span className="ml-2 inline-flex items-center bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full"><Briefcase size={12} className="mr-1"/>Work</span></p>}
                            </div>
                        </Section>
                        
                        <Section title="Extras & Requests" icon={<CheckCircle size={20} className="mr-3 text-blue-600"/>}>
                            <div className="text-sm space-y-3">
                                {(guestDetails.addOns?.wantsAirportShuttle || guestDetails.addOns?.wantsCarRental) && (
                                    <div>
                                        <h5 className="font-semibold mb-1">Add-ons Requested:</h5>
                                        <ul className="list-disc list-inside text-gray-700">
                                            {guestDetails.addOns.wantsAirportShuttle && <li className="flex items-center"><Plane size={14} className="mr-2"/>Airport Shuttle</li>}
                                            {guestDetails.addOns.wantsCarRental && <li className="flex items-center"><Car size={14} className="mr-2"/>Car Rental</li>}
                                        </ul>
                                    </div>
                                )}
                                {guestDetails.specialRequests && (
                                    <div>
                                        <h5 className="font-semibold mb-1">Special Requests:</h5>
                                        <p className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg italic text-gray-700">&apos;{guestDetails.specialRequests}&apos;</p>
                                    </div>
                                )}
                            </div>
                        </Section>
                        
                        <Section title="Payment Details" icon={<FileText size={20} className="mr-3 text-blue-600"/>}>
                            <div className="text-sm space-y-2 p-4 bg-white rounded-lg border border-gray-200">
                                <div className="flex justify-between"><span>Subtotal</span><span>{propertyBooking?.bookingDetails.subtotal.toFixed(2)}</span></div>
                                <div className="flex justify-between"><span>Service Fee</span><span>{propertyBooking?.bookingDetails.serviceFee.toFixed(2)}</span></div>
                                <div className="flex justify-between pb-2 border-b"><span>Taxes</span><span>{propertyBooking?.bookingDetails.taxes.toFixed(2)}</span></div>
                                <div className="flex justify-between font-bold text-lg mt-2"><span>Total Paid</span><span>{booking.bookingDetails.currency} {booking.bookingDetails.totalPrice.toFixed(2)}</span></div>
                                {propertyBooking?.bookingDetails.payment && <p className="text-xs text-green-600 text-right mt-1">Paid via {propertyBooking.bookingDetails.payment.provider}</p>}
                            </div>
                        </Section>
                    </div>

                    <div className="p-4 bg-white/80 backdrop-blur-lg border-t flex justify-between items-center sticky bottom-0">
                         <div>
                            {isCancellable && (
                                <button
                                    onClick={() => setShowCancelConfirm(true)}
                                    className="text-sm font-semibold text-red-600 hover:text-red-800 transition-colors"
                                >
                                    Cancel Booking
                                </button>
                            )}
                            {booking.status === 'cancelled' && <p className="text-sm font-semibold text-red-500">This booking has been cancelled.</p>}
                            {booking.status === 'confirmed' && !isCancellable && <p className="text-sm font-semibold text-gray-500">This booking can no longer be cancelled.</p>}
                         </div>
                        <button onClick={onClose} className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-700">Close</button>
                    </div>
                     {cancelError && <div className="p-3 bg-red-100 text-red-700 text-sm text-center border-t border-red-200">Error: {cancelError}</div>}
                </motion.div>
            </motion.div>

            <AnimatePresence>
                {showCancelConfirm && (
                    <CancelConfirmationModal
                        isCancelling={isCancelling}
                        onConfirm={handleConfirmCancel}
                        onCancel={() => {
                            setShowCancelConfirm(false);
                            setCancelError(null); // Clear error when closing confirm modal
                        }}
                    />
                )}
            </AnimatePresence>
       </>
    );
};

// --- Main List Component ---
export default function BookingsList({ initialBookings }: { initialBookings: Booking[] }) {
    const [bookings, setBookings] = useState<Booking[]>(initialBookings);
    const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

    const handleBookingUpdate = (updatedBooking: Booking) => {
        setBookings(currentBookings =>
            currentBookings.map(b =>
                b._id === updatedBooking._id ? updatedBooking : b
            )
        );
        if (selectedBooking?._id === updatedBooking._id) {
            setSelectedBooking(updatedBooking);
        }
    };

    const filteredBookings = bookings.filter(booking => {
        if (filter === 'all') return true;
        const checkInDate = new Date(booking.bookingDetails.checkIn);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (filter === 'upcoming') return checkInDate >= today;
        if (filter === 'past') return checkInDate < today;
        return true;
    });

    return (
        <div>
            <div className="flex items-center space-x-2 mb-6 bg-white p-2 rounded-lg shadow-sm border w-fit">
                {(['all', 'upcoming', 'past'] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                            filter === f ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            <AnimatePresence>
                {filteredBookings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredBookings.map(booking => (
                            <BookingCard key={booking._id?.toString() || 'fallback-key'} booking={booking} onSelect={setSelectedBooking} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 px-6 bg-white rounded-lg shadow-sm border">
                         <FileText size={48} className="mx-auto text-gray-300" />
                        <h3 className="mt-4 text-xl font-semibold text-gray-800">No Bookings Found</h3>
                        <p className="mt-1 text-gray-500">
                            You have no {filter !== 'all' && filter} bookings. Why not plan your next trip?
                        </p>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {selectedBooking && (
                    <BookingDetailModal 
                        booking={selectedBooking} 
                        onClose={() => setSelectedBooking(null)}
                        onBookingUpdate={handleBookingUpdate}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}