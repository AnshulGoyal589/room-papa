'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Image from 'next/image';
import {
    Star as StarIcon, CheckCircle, Users, Wifi, ParkingSquare, Wind, Utensils, Info, AlertTriangle, Car, Bus, ChevronDown, ChevronUp
} from 'lucide-react';
import RazorpayPaymentButton from '@/components/payment/RazorpayPaymentButton';
import { PropertyType } from '@/types';
import { DisplayableRoomOffer } from '@/types/booking';
import { Location } from '@/lib/mongodb/models/Components';

// --- Constants and Interfaces (Unchanged) ---
const RESERVATION_DATA_KEY = 'reservationData_v1';
const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";

interface ReservationData {
    propertyId: string;
    propertyTitle: string;
    propertyImage: string | null;
    propertyLocation: Location;
    propertyRating: number | null;
    checkInDate: string;
    checkOutDate: string;
    reservationPolicy : string[];
    days: number;
    adultCount: number;
    childCount: number;
    globalGuestCount: number;
    totalSelectedPhysicalRooms: number;
    selectedOffers: Record<string, number>;
    selectedMealPlan: string;
    displayableRoomOffers: DisplayableRoomOffer[];
    pricingDetails: {
        subtotalNights: number;
        serviceCharge: number;
        taxesApplied: number;
        totalBookingPricing: number;
        currency: string;
        totalBookingPricePerNight: number;
    };
    ownerId: string;
    propertyType: PropertyType;
}

// --- Helper Components ---
const renderRatingStars = (rating: number) => (
    <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
            <StarIcon key={i} className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} />
        ))}
    </div>
);

const Stepper = () => (
    <div className="flex items-center justify-between max-w-lg mx-auto mb-6">
        <div className="flex items-center text-blue-600">
            <CheckCircle className="w-6 h-6 mr-2" />
            <span className="font-semibold">Your Selection</span>
        </div>
        <div className="flex-1 border-t-2 border-gray-300 mx-4"></div>
        <div className="flex items-center text-blue-600 font-bold">
            <span className="flex items-center justify-center w-6 h-6 mr-2 border-2 border-blue-600 rounded-full text-sm">2</span>
            <span>Your Details</span>
        </div>
        <div className="flex-1 border-t-2 border-gray-300 mx-4"></div>
        <div className="flex items-center text-gray-400">
            <span className="flex items-center justify-center w-6 h-6 mr-2 border-2 border-gray-400 rounded-full text-sm">3</span>
            <span>Finish booking</span>
        </div>
    </div>
);


// --- Main Component ---
export default function ReservationForm({ propertyId }: { propertyId: string }) {
    const router = useRouter();
    const { user, isLoaded, isSignedIn } = useUser();

    // --- State Management (Original + New states for Booking.com fields) ---
    const [reservationDetails, setReservationDetails] = useState<ReservationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Form data
    const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', phone: '', guestFullName: '' });
    const [country, setCountry] = useState('India');
    // const [countryCode, setCountryCode] = useState('+91');
    const [guestDetailsPerRoom, setGuestDetailsPerRoom] = useState<Record<string, { guestName: string }>>({});

    // --- NEW STATE ---
    const [bookingFor, setBookingFor] = useState<'self' | 'someone_else'>('self');
    const [travelingFor, setTravelingFor] = useState<'leisure' | 'work'>('leisure');
    const [gstDetails, setGstDetails] = useState({ number: '', businessName: '' });
    
    // UI/Options state
    const [wantsRoomsTogether, setWantsRoomsTogether] = useState(false);
    const [wantsAirportShuttle, setWantsAirportShuttle] = useState(false);
    const [wantsCarRental, setWantsCarRental] = useState(false);
    const [specialRequests, setSpecialRequests] = useState('');
    const [arrivalTime, setArrivalTime] = useState('');
    const [showPriceDetails, setShowPriceDetails] = useState(false);
    const [bookingConfirmed, setBookingConfirmed] = useState(false);
    // const [paymentError, setPaymentError] = useState<string | null>(null);

    // --- Logic Hooks (Unchanged) ---
    useEffect(() => {
        const storedData = localStorage.getItem(RESERVATION_DATA_KEY);
        if (!storedData) {
            setError("Booking details not found. Please start over."); setLoading(false);
            router.push(`/properties/${propertyId}`); return;
        }
        try {
            const parsedData: ReservationData = JSON.parse(storedData);
            if (parsedData.propertyId !== propertyId) {
                setError("Mismatched booking data. Redirecting..."); setLoading(false);
                localStorage.removeItem(RESERVATION_DATA_KEY);
                router.push(`/properties/${propertyId}`); return;
            }
            // console.log("testing: ", parsedData);
            setReservationDetails(parsedData);
        } catch (error) {
            console.error("Error parsing reservation data:", error);
            setError("Could not read booking details. Please start over.");
            localStorage.removeItem(RESERVATION_DATA_KEY);
            router.push(`/properties/${propertyId}`);
        } finally { setLoading(false); }
    }, [propertyId, router]);

    useEffect(() => {
        if (isLoaded && isSignedIn && user) {
            setFormData(prev => ({ ...prev, firstName: user.firstName || '', lastName: user.lastName || '', email: user.primaryEmailAddress?.emailAddress || '' }));
        }
    }, [isLoaded, isSignedIn, user]);

    // --- Dynamic Room Instances for Form ---
    const roomInstances = useMemo(() => {
        if (!reservationDetails) return [];
        const instances: { key: string; offer: DisplayableRoomOffer }[] = [];
        Object.entries(reservationDetails.selectedOffers).forEach(([offerId, qty]) => {
            const offer = reservationDetails.displayableRoomOffers.find(o => o.offerId === offerId);
            if (offer) {
                for (let i = 0; i < qty; i++) {
                    instances.push({ key: `${offerId}-${i}`, offer });
                }
            }
        });
        return instances;
    }, [reservationDetails]);
    
    // --- Handlers ---
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleGstChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setGstDetails(prev => ({...prev, [name]: value}));
    }

    const handleGuestDetailChange = (key: string, field: string, value: string) => {
        setGuestDetailsPerRoom(prev => ({
            ...prev,
            [key]: { ...prev[key], [field]: value }
        }));
    };

    // --- Loading and Error States (Unchanged) ---
    if (loading) { return <div className="flex justify-center items-center min-h-screen bg-gray-100"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto"></div></div>; }
    if (error || !reservationDetails) { return <div className="container mx-auto px-4 py-16 text-center"><h2 className="text-2xl font-bold text-red-600 mb-4">{error || 'Could not load reservation.'}</h2><button onClick={() => router.push('/properties')} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Find Properties</button></div>; }
    
    const { propertyTitle, propertyImage, propertyLocation, propertyRating, checkInDate, checkOutDate, days, globalGuestCount, pricingDetails } = reservationDetails;
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    // --- Final Booking.com Styled JSX ---
    return (
        <>
            <div className="bg-white min-h-screen">
                <div className="container mx-auto max-w-screen-xl py-5 px-4">
                    <Stepper />
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Left Column - Booking Summary */}
                        <div className="lg:col-span-1 space-y-4 lg:sticky top-5 self-start">
                            {/* ... (This section is unchanged, so it is collapsed for brevity) ... */}
                            <div className="border border-gray-300 rounded-md p-4 space-y-4">
                                <div className="flex space-x-4">
                                    {propertyImage && <div className="relative w-24 h-20 rounded-md overflow-hidden flex-shrink-0"><Image src={propertyImage} alt={propertyTitle} layout="fill" objectFit="cover" /></div>}
                                    <div>
                                        <span className="text-xs">Hotel</span>
                                        {propertyRating && renderRatingStars(propertyRating)}
                                        <h3 className="font-bold text-gray-800 leading-tight">{propertyTitle}</h3>
                                        <p className="text-xs text-gray-600 mt-1">{propertyLocation.address}</p>
                                    </div>
                                </div>
                                {propertyRating && <div className="flex items-center gap-2"><div className="bg-blue-600 text-white font-bold text-sm px-2 py-1 rounded-md">{propertyRating.toFixed(1)}</div><span className="font-semibold">Good</span><span className="text-xs text-gray-500">1,012 reviews</span></div>}
                                <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
                                    <span className="flex items-center"><Wifi size={14} className="mr-1.5"/>Free Wifi</span>
                                    <span className="flex items-center"><ParkingSquare size={14} className="mr-1.5"/>Parking</span>
                                    <span className="flex items-center"><Wind size={14} className="mr-1.5"/>Air conditioning</span>
                                    <span className="flex items-center"><Utensils size={14} className="mr-1.5"/>Restaurant</span>
                                </div>
                            </div>
                            <div className="border border-gray-300 rounded-md p-4 space-y-3">
                                <h3 className="font-bold text-lg">Your booking details</h3>
                                <div className="flex justify-between items-start">
                                    <div><p className="font-semibold">Check-in</p><p className="text-gray-800 font-bold text-sm">{checkIn.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</p><p className="text-xs text-gray-500">From 3:00 PM</p></div>
                                    <div className="text-right"><p className="font-semibold">Check-out</p><p className="text-gray-800 font-bold text-sm">{checkOut.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</p><p className="text-xs text-gray-500">Until 12:00 PM</p></div>
                                </div>
                                <div><p className="font-semibold text-sm">Total length of stay:</p><p className="text-gray-600 text-sm">{days} {days === 1 ? 'night' : 'nights'}</p></div>
                                <hr/>
                                <div><p className="font-semibold">You selected</p><p className="text-blue-600 font-bold text-sm">{roomInstances.length} room{roomInstances.length > 1 && 's'} for {globalGuestCount} guests</p><button onClick={() => router.back()} className="text-blue-600 text-sm font-semibold hover:underline">Change your selection</button></div>
                            </div>
                            <div className="border border-gray-300 rounded-md p-4">
                                <h3 className="font-bold text-lg">Your price summary</h3>
                                <div className="flex justify-between items-baseline mt-2">
                                    <span className="text-xl font-bold">Price</span>
                                    <div>
                                        <p className="font-bold text-xl text-right">{pricingDetails.currency} {pricingDetails.totalBookingPricing.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                        <p className="text-xs text-gray-500 text-right">+ {pricingDetails.currency} {pricingDetails.taxesApplied.toLocaleString(undefined, { minimumFractionDigits: 2 })} taxes and fees</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowPriceDetails(!showPriceDetails)} className="text-blue-600 text-sm font-semibold hover:underline flex items-center mt-2">Price information {showPriceDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
                                {showPriceDetails && <div className="text-xs mt-2 space-y-1 bg-gray-50 p-2 rounded">
                                    <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span>{pricingDetails.currency} {pricingDetails.subtotalNights.toFixed(2)}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-600">Service charge</span><span>{pricingDetails.currency} {pricingDetails.serviceCharge.toFixed(2)}</span></div>
                                    <div className="flex justify-between border-t pt-1"><span className="text-gray-600">Taxes</span><span>{pricingDetails.currency} {pricingDetails.taxesApplied.toFixed(2)}</span></div>
                                </div>}
                            </div>
                        </div>

                        {/* Right Column - User Details & Forms */}
                        <div className="lg:col-span-2 space-y-6">
                            {isSignedIn && user && <div className="bg-blue-50 border border-blue-200 rounded-md p-4 flex items-center space-x-4"><Image src={user.imageUrl} alt="user avatar" width={40} height={40} className="rounded-full" /><p>You are signed in as <span className="font-bold">{user.emailAddresses[0].emailAddress}</span></p></div>}
                            
                            <div className="bg-white p-6 rounded-lg border border-gray-200">
                                <h2 className="text-2xl font-bold text-gray-800">Enter your details</h2>
                                <p className="text-sm text-gray-500 my-2"><Info size={14} className="inline mr-1"/> Almost done! Just fill in the <span className="text-red-500">*</span> required info</p>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div><label className="block text-sm font-medium text-gray-700 mb-1">First Name <span className="text-red-500">*</span></label><input name="firstName" value={formData.firstName} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md"/></div>
                                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Last Name <span className="text-red-500">*</span></label><input name="lastName" value={formData.lastName} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md"/></div>
                                    </div>
                                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Email address <span className="text-red-500">*</span></label><input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md"/><p className="text-xs text-gray-500 mt-1">Confirmation email sent to this address</p></div>
                                    
                                    {/* --- NEW SECTION: "Who are you booking for?" --- */}
                                    <div>
                                        <p className="block text-sm font-medium text-gray-700 mb-2">Who are you booking for? <span className="font-normal text-gray-500">(optional)</span></p>
                                        <div className="flex items-center space-x-6">
                                            <label className="flex items-center cursor-pointer"><input type="radio" name="bookingFor" value="self" checked={bookingFor === 'self'} onChange={() => setBookingFor('self')} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300" /> <span className="ml-2">I&apos;m the main guest</span></label>
                                            <label className="flex items-center cursor-pointer"><input type="radio" name="bookingFor" value="someone_else" checked={bookingFor === 'someone_else'} onChange={() => setBookingFor('someone_else')} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300" /> <span className="ml-2">I&apos;m booking for someone else</span></label>
                                        </div>
                                    </div>

                                    {bookingFor === 'someone_else' && (
                                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Guest&apos;s Full Name <span className="text-red-500">*</span></label><input name="guestFullName" value={formData.guestFullName} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md" placeholder="Enter the name of the guest"/></div>
                                    )}

                                    {/* --- NEW SECTION: "Are you traveling for work?" --- */}
                                    <div>
                                        <p className="block text-sm font-medium text-gray-700 mb-2">Are you traveling for work? <span className="font-normal text-gray-500">(optional)</span></p>
                                        <div className="flex items-center space-x-6">
                                            <label className="flex items-center cursor-pointer"><input type="radio" name="travelingFor" value="work" checked={travelingFor === 'work'} onChange={() => setTravelingFor('work')} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300" /> <span className="ml-2">Yes</span></label>
                                            <label className="flex items-center cursor-pointer"><input type="radio" name="travelingFor" value="leisure" checked={travelingFor === 'leisure'} onChange={() => setTravelingFor('leisure')} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300" /> <span className="ml-2">No</span></label>
                                        </div>
                                    </div>

                                    {travelingFor === 'work' && (
                                        <div className="space-y-4 p-4 border-t mt-4">
                                             <h3 className="text-md font-semibold">GST Details for Business Travel</h3>
                                            <div><label className="block text-sm font-medium text-gray-700 mb-1">GST Number <span className="text-red-500">*</span></label><input name="number" value={gstDetails.number} onChange={handleGstChange} className="w-full p-2 border border-gray-300 rounded-md" placeholder="e.g. 22AAAAA0000A1Z5"/></div>
                                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Business/Company Name <span className="text-red-500">*</span></label><input name="businessName" value={gstDetails.businessName} onChange={handleGstChange} className="w-full p-2 border border-gray-300 rounded-md"/></div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Phone number <span className="text-red-500">*</span></label><input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md" placeholder="e.g., 9876543210"/></div>
                                        <div className="col-span-1"><label className="block text-sm font-medium text-gray-700 mb-1">Country</label><select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-white"><option>India</option><option>USA</option><option>UK</option></select></div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-white p-6 rounded-lg border border-gray-200">
                                <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
                                    <h3 className="font-bold text-yellow-800">Good to know:</h3>
                                    <ul className="list-disc list-inside text-sm text-yellow-700 mt-2 space-y-1">
                                        <li>No payment needed today. You&apos;ll pay when you stay.</li>
                                        <li>Free cancellation before a certain date is often available.</li>
                                    </ul>
                                </div>
                            </div>
                            
                            {/* ... (Rest of the form is unchanged) ... */}
                            {roomInstances.map(({ key, offer }) => (
                                <div key={key} className="bg-white p-6 rounded-lg border border-gray-200">
                                    <h3 className="font-bold text-lg">{offer.categoryTitle}</h3>
                                    <div className="my-2 space-y-1 text-sm">
                                        <p className="flex items-center text-green-600 font-semibold"><CheckCircle size={16} className="mr-2"/>Free cancellation before June 8, 2025</p>
                                        <p className="flex items-center"><Users size={16} className="mr-2"/>Guests: {offer.intendedAdults} adult{offer.intendedAdults > 1 && 's'}</p>
                                    </div>
                                    <div className="mt-4"><label className="block text-sm font-medium text-gray-700 mb-1">Full Guest Name</label><input onChange={(e) => handleGuestDetailChange(key, 'guestName', e.target.value)} className="w-full sm:w-2/3 p-2 border border-gray-300 rounded-md" /></div>
                                </div>
                            ))}

                            <div className="bg-red-50 text-red-700 p-4 rounded-md border border-red-200 flex items-start space-x-3"><AlertTriangle className="w-5 h-5 mt-0.5 shrink-0"/><p className="text-sm font-semibold">Limited supply for your dates: <span className="font-normal">62 five-star hotels like this are already unavailable on our site</span></p></div>

                            <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
                                <div>
                                    <h3 className="text-xl font-bold">Add to your stay</h3>
                                    <div className="mt-4 border border-gray-200 rounded-md divide-y divide-gray-200">
                                        <label className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"><div className="flex items-center"><Bus size={24} className="mr-4 text-blue-600"/><p className="font-semibold">I&apos;m interested in an airport shuttle</p></div><input type="checkbox" checked={wantsAirportShuttle} onChange={() => setWantsAirportShuttle(!wantsAirportShuttle)} className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"/></label>
                                        <label className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"><div className="flex items-center"><Car size={24} className="mr-4 text-blue-600"/><p className="font-semibold">I&apos;m interested in renting a car</p></div><input type="checkbox" checked={wantsCarRental} onChange={() => setWantsCarRental(!wantsCarRental)} className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"/></label>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">Special requests</h3>
                                    <p className="text-sm text-gray-500 mt-1">Special requests can&apos;t be guaranteed, but the property will do its best to meet your needs.</p>
                                    <textarea value={specialRequests} onChange={(e) => setSpecialRequests(e.target.value)} rows={3} className="w-full p-2 border border-gray-300 rounded-md mt-2" placeholder="Please write your requests here (optional)"></textarea>
                                    <label className="flex items-center mt-2 cursor-pointer"><input type="checkbox" checked={wantsRoomsTogether} onChange={() => setWantsRoomsTogether(!wantsRoomsTogether)} className="h-4 w-4 rounded border-gray-300 text-blue-600 mr-2"/>I want rooms close to each other (if available)</label>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">Your arrival time</h3>
                                    <div className="p-3 bg-green-50 text-green-800 rounded-md mt-2 flex items-center"><CheckCircle size={16} className="mr-2"/>Your rooms will be ready for check-in at 3:00 PM</div>
                                    <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">Add your estimated arrival time <span className="font-normal text-gray-500">(optional)</span></label>
                                    <select value={arrivalTime} onChange={(e) => setArrivalTime(e.target.value)} className="w-full sm:w-2/3 p-2 border border-gray-300 rounded-md bg-white"><option value="">Please select</option><option>I don&apso;t know</option>{[...Array(24)].map((_, i) => <option key={i}>{`${i.toString().padStart(2, '0')}:00 - ${(i + 1).toString().padStart(2, '0')}:00`}</option>)}</select>
                                </div>
                            </div>
                            
                            <div className="text-right">
                                <RazorpayPaymentButton
                                    className="bg-blue-600 text-white font-bold py-3 px-6 rounded-md hover:bg-blue-700 transition-colors text-lg"
                                    amountInSubunits={Math.round(pricingDetails.totalBookingPricing * 100)} currency={pricingDetails.currency} receiptId={`booking_${propertyId}_${Date.now()}`}
                                    bookingPayload={{ 
                                        type: "property", 
                                        details: { 
                                            id: propertyId, title: propertyTitle, ownerId: reservationDetails.ownerId, locationFrom: "NA", locationTo: `${propertyLocation.address}, ${propertyLocation.city}`, type: reservationDetails.propertyType, reservationPolicy: reservationDetails.reservationPolicy,
                                        },
                                        bookingDetails: { 
                                            checkIn: checkIn.toISOString(), checkOut: checkOut.toISOString(), adults: reservationDetails.adultCount, children: reservationDetails.childCount, totalGuests: globalGuestCount, totalRoomsSelected: reservationDetails.totalSelectedPhysicalRooms, selectedMealPlan: reservationDetails.selectedMealPlan, roomsDetail: Object.entries(reservationDetails.selectedOffers).filter(([, qty]) => qty > 0).map(([offerId, qty]) => { const offer = reservationDetails.displayableRoomOffers.find(o => o.offerId === offerId); return { categoryId: offer?.categoryId || 'unknown', offerKey: offerId.split('_').slice(1).join('_'), title: offer?.categoryTitle || 'Unknown', qty, estimatedPricePerRoomNight: offer?.pricePerNight || 0, currency: offer?.currency || pricingDetails.currency }; 
                                        }),
                                        calculatedPricePerNight: pricingDetails.totalBookingPricePerNight, 
                                        currency: pricingDetails.currency,
                                        numberOfNights: days,
                                        subtotal: pricingDetails.subtotalNights,
                                        serviceFee: pricingDetails.serviceCharge,
                                        taxes: pricingDetails.taxesApplied,
                                        totalPrice: pricingDetails.totalBookingPricing, 
                                    },
                                    guestDetails: {
                                        ...formData, country, countryCode : "+91", clerkId : user?.id , bookingFor, travelingFor, gstDetails: travelingFor === 'work' ? gstDetails : null, addOns: { wantsAirportShuttle, wantsCarRental }, specialRequests: `${specialRequests}${wantsRoomsTogether ? ' (Rooms close together requested)' : ''}`, arrivalTime, roomGuests: guestDetailsPerRoom }, userId : user?.id, recipients: [formData.email, user?.primaryEmailAddress?.emailAddress].filter(Boolean) as string[] 
                                    }}
                                    prefill={{ name: `${formData.firstName} ${formData.lastName}`, email: formData.email, contact: `+91${formData.phone}` }}
                                    notes={{ propertyTitle, checkIn: checkIn.toISOString().split('T')[0], checkOut: checkOut.toISOString().split('T')[0] }}
                                    onPaymentSuccess={() => { setBookingConfirmed(true); localStorage.removeItem(RESERVATION_DATA_KEY); }}
                                    onPaymentError={(errorMessage) => console.error(errorMessage)}
                                    razorpayKeyId={RAZORPAY_KEY_ID} companyName="YourStays.com"
                                    disabled={!formData.firstName || !formData.lastName || !formData.email || !formData.phone || pricingDetails.totalBookingPricing <= 0}
                                    buttonText="Next: Final details >"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal (Unchanged) */}
            {bookingConfirmed && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[110] backdrop-blur-sm">
                    <div className="bg-white rounded-lg max-w-md w-full p-7 text-center shadow-xl">
                        <div className="mb-4"><div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center border-2 border-green-200"><CheckCircle className="w-10 h-10 text-green-500" /></div></div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Booking Confirmed!</h3>
                        <p className="mb-5 text-sm text-gray-600">Your booking for <span className="font-semibold">{propertyTitle}</span> is confirmed. A confirmation email has been sent to <span className="font-semibold">{formData.email}</span>.</p>
                        <button onClick={() => router.push('/customer/bookings')} className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg font-semibold hover:bg-blue-700">View My Bookings</button>
                    </div>
                </div>
            )}
        </>
    );
}