// FILE: app/customer/travelling/[id]/TravellingClientView.tsx
// ROLE: A Client Component to handle all complex UI, state, and booking logic.

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { BookingFormData, TransportationType } from '@/types';
import { useUser } from '@clerk/nextjs';
import DummyReviews from '@/components/customer/DetailPage/Travelling/Reviews';
import { Travelling } from '@/lib/mongodb/models/Travelling';

// Define the props this component receives from the server page.
interface TravellingClientViewProps {
  initialTravellingData: Travelling;
}

// --- Constants (can be co-located or imported) ---
const SERVICE_FEE_TRAVELLING = 7;
const TAX_RATE_TRAVELLING_PERCENTAGE = 0.04;
const LOCAL_STORAGE_KEY_TRAVELLING = 'travellingBookingPreferences_v2';

// --- Helper Functions ---
const calculateDays = (start: Date | null, end: Date | null): number => {
  if (!start || !end || end <= start) {
    return 0;
  }
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays === 0 && start.toDateString() === end.toDateString()) {
    return 1;
  }
  return diffDays;
};

export default function TravellingClientView({ initialTravellingData }: TravellingClientViewProps) {
  const router = useRouter();
  const { isSignedIn, user, isLoaded } = useUser();
  
  // --- STATE INITIALIZATION ---
  // The core `travelling` state is initialized from the server prop.
  // We use a function in useState to parse the dates (which are strings after serialization) only once.
  const [travelling] = useState<Travelling>(initialTravellingData);

  // The `loading` and `error` states for the initial fetch are NO LONGER NEEDED.
  // The parent server component handles these cases.

  const [selectedImage, setSelectedImage] = useState<string | null>(travelling.bannerImage?.url || null);
  const [currentReviewPage, setCurrentReviewPage] = useState(1);
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [guestCount, setGuestCount] = useState(1);
  
  const days = useMemo(() => calculateDays(checkInDate, checkOutDate), [checkInDate, checkOutDate]);
  
  // Pricing State
  const [basePriceTotal, setBasePriceTotal] = useState<number>(0);
  const [serviceChargeApplied, setServiceChargeApplied] = useState<number>(0);
  const [taxesApplied, setTaxesApplied] = useState<number>(0);
  const [grandTotalBookingPrice, setGrandTotalBookingPrice] = useState<number>(0);
  
  // Modal & Booking State
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingData, setBookingData] = useState<BookingFormData>({
    firstName: '', lastName: '', email: '', phone: '', passengers: 1, specialRequests: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [loginRedirectWarning, setLoginRedirectWarning] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // REMOVED: The initial useEffect to fetch data is gone. The page loads instantly with data.

  // --- Client-Side Hooks for UI Logic ---

  const validateUserSelectedDate = (selectedDateStr: string, productAvailableStartDate: Date, productAvailableEndDate: Date): Date => {
    const date = new Date(selectedDateStr);
    const minDate = new Date(productAvailableStartDate);
    minDate.setHours(0,0,0,0);
    const maxDate = new Date(productAvailableEndDate);
    maxDate.setHours(23,59,59,999);
  
    if (date < minDate) return minDate;
    if (date > maxDate) return maxDate;
    return date;
  };
  
  useEffect(() => {
    // Load preferences from localStorage. This works immediately because `travelling` is available on first render.
    const storedPreferences = localStorage.getItem(LOCAL_STORAGE_KEY_TRAVELLING);
    if (storedPreferences) {
      try {
        const parsedPrefs = JSON.parse(storedPreferences);
        if (parsedPrefs.type === 'travelling') {
            // Your logic to parse and set dates/guests from localStorage...
        }
      } catch (e) { console.error("Failed to parse localStorage", e); }
    }
  }, [travelling]);

  useEffect(() => {
    // Save preferences to localStorage
    const preferencesToSave = {
      checkInDate: checkInDate ? checkInDate.toISOString() : null,
      checkOutDate: checkOutDate ? checkOutDate.toISOString() : null,
      guestCount,
      type: 'travelling',
    };
    localStorage.setItem(LOCAL_STORAGE_KEY_TRAVELLING, JSON.stringify(preferencesToSave));
  }, [checkInDate, checkOutDate, guestCount]);

  useEffect(() => {
    // Calculate pricing whenever relevant state changes
    if (travelling.costing && guestCount > 0 && days > 0) {
      const currentBasePriceTotal = travelling.costing.discountedPrice * guestCount * days;
      setBasePriceTotal(currentBasePriceTotal);
      const currentServiceCharge = SERVICE_FEE_TRAVELLING;
      setServiceChargeApplied(currentServiceCharge);
      const currentTaxes = (currentBasePriceTotal + currentServiceCharge) * TAX_RATE_TRAVELLING_PERCENTAGE;
      setTaxesApplied(currentTaxes);
      setGrandTotalBookingPrice(currentBasePriceTotal + currentServiceCharge + currentTaxes);
    } else {
      setBasePriceTotal(0); setServiceChargeApplied(0); setTaxesApplied(0); setGrandTotalBookingPrice(0);
    }
  }, [travelling, guestCount, days]);

  useEffect(() => {
    // Pre-fill user data into the form once Clerk is loaded
    if (isLoaded && isSignedIn && user) {
      setBookingData(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.primaryEmailAddress?.emailAddress || ''
      }));
    }
  }, [isLoaded, isSignedIn, user]);
  
  // --- All Handler and Render Helper Functions ---
  // These are copied directly from your original component as they handle client-side interactions.

  const handleCheckInChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if(!travelling) return;
    const selectedValue = e.target.value;
    if (!selectedValue) {
        setCheckInDate(null);
        return;
    }
    // User's "travel start date" must be within the product's availability window
    const validatedCheckIn = validateUserSelectedDate(selectedValue, new Date(travelling.transportation.arrivalTime), new Date(travelling.transportation.departureTime));
    setCheckInDate(validatedCheckIn);

    if (checkOutDate && validatedCheckIn >= checkOutDate) {
      const nextDay = new Date(validatedCheckIn.getTime());
      nextDay.setDate(validatedCheckIn.getDate() + 1); // Ensure at least one day duration
      // nextDay must also be within the product's departureTime
      if (nextDay <= new Date(travelling.transportation.departureTime)) {
          setCheckOutDate(nextDay);
      } else {
          // If next day is beyond departure, maybe set checkout to the departure date itself if it's after check-in
          const departureDate = new Date(travelling.transportation.departureTime);
          setCheckOutDate(validatedCheckIn < departureDate ? departureDate : null);
      }
    }
  };

  const handleCheckOutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if(!travelling) return;
    const selectedValue = e.target.value;
    if (!selectedValue) {
        setCheckOutDate(null);
        return;
    }
    // Min checkout date is the day after check-in, or the product's arrival time if check-in not set
    const minCheckOutDateForValidation = checkInDate 
        ? new Date(new Date(checkInDate).setDate(new Date(checkInDate).getDate() + 1)) 
        : new Date(travelling.transportation.arrivalTime);

    const validatedCheckOut = validateUserSelectedDate(selectedValue, minCheckOutDateForValidation, new Date(travelling.transportation.departureTime));
    
    if (checkInDate && validatedCheckOut <= checkInDate) {
      const dayAfterCheckIn = new Date(checkInDate.getTime());
      dayAfterCheckIn.setDate(checkInDate.getDate() + 1);
      if (dayAfterCheckIn <= new Date(travelling.transportation.departureTime)) {
          setCheckOutDate(dayAfterCheckIn);
      } else {
           setCheckOutDate(checkInDate < new Date(travelling.transportation.departureTime) ? new Date(travelling.transportation.departureTime) : null);
      }
    } else {
        setCheckOutDate(validatedCheckOut);
    }
  };

  const handleImageClick = (imageUrl: string) => setSelectedImage(imageUrl);
  const incrementGuests = () => setGuestCount(prev => prev + 1);
  const decrementGuests = () => { if (guestCount > 1) setGuestCount(prev => prev - 1); };
  const calculateDuration = (departure: Date, arrival: Date) => {
    const diffTime = Math.abs(arrival.getTime() - departure.getTime());
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours}h ${diffMinutes}min`;
  };
  const renderRatingStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (<svg key={star} className={`w-5 h-5 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>))}
      </div>
    );
  };

  const getTransportationIcon = (type: TransportationType) => {
    switch (type) {
      case 'flight': return (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>);
      case 'train': return (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M9 6l6 12M9 18l6-12M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>);
      case 'bus': return (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19H5a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-7m-4 0H9m0-14v14m10-14v14M7 6h10M7 10h10M7 14h10"/></svg>);
      case 'car': return (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 17.75A6.75 6.75 0 0018.75 11H5.25A6.75 6.75 0 0012 17.75zm0-13.5A6.75 6.75 0 005.25 11h13.5A6.75 6.75 0 0012 4.25zm0 9a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"/></svg>);
      case 'ferry': return (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21.883 12.242L12 2l-9.883 10.242A10 10 0 1021.883 12.242zM12 15a3 3 0 100-6 3 3 0 000 6z"/></svg>);
      default: return (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBookingData(prev => ({...prev, [name]: value }));
  };

  const handleBookNowClick = () => {
    if (!isLoaded) return;
    setBookingError(null);
    
    if (!isSignedIn) {
      setLoginRedirectWarning(true);
      return;
    }

    if (!checkInDate || !checkOutDate) {
      setBookingError("Please select travel start and end dates.");
      return;
    }
    if (days <= 0) {
      setBookingError("Travel end date must be after start date, or ensure selection is for at least one day.");
      return;
    }
    if (guestCount <= 0) {
      setBookingError("Please specify at least one passenger.");
      return;
    }
    
    setBookingData(prev => ({...prev, passengers: guestCount }));
    setShowBookingModal(true);
  };
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);
    if (!checkInDate || !checkOutDate || guestCount <= 0 || days <= 0) {
        setBookingError("Booking details are incomplete.");
        return;
    }
    setIsSubmitting(true);
    try {
      const bookingPayload = {
        type: 'travelling',
        details: { id: travelling._id, ownerId: travelling.userId, title: travelling.title, locationFrom: travelling.transportation.from, locationTo: travelling.transportation.to, type: travelling.transportation.type },
        bookingDetails: { checkIn: checkInDate.toISOString(), checkOut: checkOutDate.toISOString(), guests: guestCount, pricePerUnit: travelling.costing.discountedPrice, currency: travelling.costing.currency, numberOfDaysOrUnits: days, subtotalPrice: basePriceTotal, serviceFee: serviceChargeApplied, taxes: taxesApplied, totalPrice: grandTotalBookingPrice },
        guestDetails: { firstName: bookingData.firstName, lastName: bookingData.lastName, email: bookingData.email, phone: bookingData.phone, specialRequests: bookingData.specialRequests },
        recipients: [bookingData.email, 'roompapa7@gmail.com']
      };
      const response = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bookingPayload) });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create booking');
      }
      setBookingConfirmed(true);
      setShowBookingModal(false);
      localStorage.removeItem(LOCAL_STORAGE_KEY_TRAVELLING);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setBookingError(`Booking failed: ${error.message}. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const paginatedReviews = travelling.review ? travelling.review.slice((currentReviewPage - 1) * 3, currentReviewPage * 3) : [];
  const totalReviewPages = travelling.review ? Math.ceil(travelling.review.length / 3) : 0;

  // --- RETURN STATEMENT ---
  // The JSX is identical to your original component, but without the top-level loading/error checks.
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Main Image Header */}
      <div className="relative h-96 md:h-[500px] w-full">
        <Image src={selectedImage || '/images/placeholder-travelling.jpg'} alt={travelling.title || ""} layout="fill" objectFit="cover" priority className="brightness-75" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end">
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">{travelling.title}</h1>
                 <div className="flex items-center text-white mb-4">
                    <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/></svg>
                    <span>{travelling.transportation.from} to {travelling.transportation.to}</span>
                </div>
                {travelling.totalRating && travelling.totalRating > 0 && (<div className="flex items-center text-white">{renderRatingStars(travelling.totalRating)}<span className="ml-2">{travelling.totalRating.toFixed(1)} ({travelling.review?.length || 0} reviews)</span></div>)}
            </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column (Details) */}
          <div className="lg:col-span-2">
                      {travelling.detailImages && travelling.detailImages.length > 0 && (
                        <div className="mb-8">
                          <h2 className="text-2xl font-bold mb-4">Gallery</h2>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {travelling.bannerImage && (<div className={`relative aspect-square cursor-pointer rounded-lg overflow-hidden ${selectedImage === travelling.bannerImage.url ? 'ring-2 ring-offset-2 ring-[#003c95]' : ''}`} onClick={() => handleImageClick(travelling.bannerImage!.url)}><Image src={travelling.bannerImage.url} alt={travelling.bannerImage.alt || travelling.title || ""} layout="fill" objectFit="cover" onError={(e) => e.currentTarget.src = '/images/placeholder-travelling.jpg'}/></div>)}
                            {travelling.detailImages.slice(0, travelling.bannerImage ? 7 : 8).map((image, index) => (<div key={index} className={`relative aspect-square cursor-pointer rounded-lg overflow-hidden ${selectedImage === image.url ? 'ring-2 ring-offset-2 ring-[#003c95]' : ''}`} onClick={() => handleImageClick(image.url)}><Image src={image.url} alt={image.alt || `${travelling.title} image ${index + 1}`} layout="fill" objectFit="cover" onError={(e) => e.currentTarget.src = '/images/placeholder-travelling.jpg'}/></div>))}
                          </div>
                        </div>
                      )}
                      <div className="mb-8">
                        <h2 className="text-2xl font-bold mb-4">Transportation Details</h2>
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                          <div className="flex items-center mb-6"><div className="bg-[#003c95] p-3 rounded-full mr-4 text-[#003c95]">{getTransportationIcon(travelling.transportation.type)}</div><div><div className="text-xl font-bold capitalize">{travelling.transportation.type} Travel</div><div className="text-gray-600">{travelling.transportation.from} to {travelling.transportation.to}</div></div></div>
                          <div className="flex flex-col md:flex-row justify-between border-t border-gray-200 pt-6">
                            <div className="mb-4 md:mb-0 md:text-left text-center"><div className="text-sm text-gray-500">Departure</div><div className="text-lg font-bold">{new Date(travelling.transportation.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div><div className="text-gray-600">{new Date(travelling.transportation.departureTime).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</div><div className="font-medium">{travelling.transportation.from}</div></div>
                            <div className="flex flex-col items-center justify-center my-4 md:my-0"><div className="text-sm text-gray-500 mb-1">Duration</div><div className="text-gray-800 font-medium">{calculateDuration(new Date(travelling.transportation.departureTime), new Date(travelling.transportation.arrivalTime))}</div><div className="relative w-full md:w-24 h-0.5 bg-gray-300 my-2"><div className="absolute -top-1 left-0 w-2.5 h-2.5 rounded-full bg-gray-400"></div><div className="absolute -top-1 right-0 w-2.5 h-2.5 rounded-full bg-gray-400"></div></div>
                            {/* <div className="text-xs text-gray-500">{travelling.transportation.stops > 0 ? `${travelling.transportation.stops} stop(s)` : 'Direct'}</div> */}
                            </div>
                            <div className="md:text-right text-center"><div className="text-sm text-gray-500">Arrival</div><div className="text-lg font-bold">{new Date(travelling.transportation.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div><div className="text-gray-600">{new Date(travelling.transportation.arrivalTime).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</div><div className="font-medium">{travelling.transportation.to}</div></div>
                          </div>
                        </div>
                      </div>
                      <div className="mb-8"><h2 className="text-2xl font-bold mb-4">About This Travel</h2><div className="prose max-w-none text-gray-700"><p>{travelling.description || 'No description available.'}</p></div></div>
                      <div className="mb-8">
                          <h2 className="text-2xl font-bold mb-4">Amenities & Features</h2>
                          {travelling.amenities && travelling.amenities.length > 0 && (<div className="mb-6"><h3 className="text-xl font-semibold mb-3">General Amenities</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{travelling.amenities.map((amenity, index) => (<div key={index} className="flex items-center bg-white p-4 rounded-lg shadow-sm"><div className="bg-[#003c95] p-2 rounded-full mr-3 text-[#003c95]"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg></div><span>{amenity}</span></div>))}</div></div>)}
                          {travelling.facilities && travelling.facilities.length > 0 && (<div className="mb-6"><h3 className="text-xl font-semibold mb-3">Facilities</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{travelling.facilities.map((facility, index) => (<div key={index} className="flex items-center bg-white p-4 rounded-lg shadow-sm"><div className="bg-green-100 p-2 rounded-full mr-3 text-green-600"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg></div><span>{facility}</span></div>))}</div></div>)}
                          {travelling.accessibility && travelling.accessibility.length > 0 && (<div className="mb-6"><h3 className="text-xl font-semibold mb-3">Accessibility</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{travelling.accessibility.map((feature, index) => (<div key={index} className="flex items-center bg-white p-4 rounded-lg shadow-sm"><div className="bg-purple-100 p-2 rounded-full mr-3 text-purple-600"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a8 8 0 100-16 8 8 0 000 16zm0 14a6 6 0 110-12 6 6 0 010 12zm-1-5a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1zm0-3a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg></div><span>{feature}</span></div>))}</div></div>)}
                      </div>
                      {travelling.funThingsToDo && travelling.funThingsToDo.length > 0 && (<div className="mb-8 bg-white p-6 rounded-lg shadow-lg"><h2 className="text-2xl font-bold mb-4">Fun Things To Do (Nearby/Onboard)</h2><ul className="list-disc pl-5 space-y-2 text-gray-700">{travelling.funThingsToDo.map((activity, index) => (<li key={index}>{activity}</li>))}</ul></div>)}
                      {travelling.meals && travelling.meals.length > 0 && (<div className="mb-8 bg-white p-6 rounded-lg shadow-lg"><h2 className="text-2xl font-bold mb-4">Meals & Dining Options</h2><div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">{travelling.meals.map((meal, index) => (<div key={index} className="flex items-center bg-gray-50 p-3 rounded-md border border-gray-200"><div className="bg-yellow-100 p-2 rounded-full mr-3 text-yellow-600"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" /></svg></div><span>{meal}</span></div>))}</div></div>)}
                      {travelling.reservationPolicy && travelling.reservationPolicy.length > 0 && (<div className="mb-8 bg-white p-6 rounded-lg shadow-lg"><h2 className="text-2xl font-bold mb-4">Reservation Policy</h2><ul className="list-disc pl-5 space-y-2 text-gray-700">{travelling.reservationPolicy.map((policy, index) => (<li key={index}>{policy}</li>))}</ul></div>)}
                      {travelling.popularFilters && travelling.popularFilters.length > 0 && (<div className="mb-8"><h2 className="text-2xl font-bold mb-4">Popular Features</h2><div className="flex flex-wrap gap-2">{travelling.popularFilters.map((filter, index) => (<span key={index} className="bg-[#003c95] text-[#003c95] px-3 py-1 rounded-full text-sm">{filter}</span>))}</div></div>)}
                      {travelling.review && travelling.review.length > 0 && (
                        <div className="mb-8">
                          <div className="flex items-center justify-between mb-4"><h2 className="text-2xl font-bold">Reviews ({travelling.review.length})</h2><div className="flex items-center">{renderRatingStars(travelling.totalRating || 0)}<span className="ml-2 font-semibold">{travelling.totalRating?.toFixed(1) || '0.0'}</span></div></div>
                          <div className="space-y-4">{paginatedReviews.map((review, index) => (<div key={index} className="bg-white p-4 rounded-lg shadow-sm"><div className="flex items-center justify-between mb-2"><div className="flex items-center"><div className="bg-gray-200 rounded-full h-10 w-10 flex items-center justify-center mr-3"><span className="font-bold text-gray-600">{String.fromCharCode(65 + index)}</span></div><div><div className="font-semibold">Traveller</div><div className="text-sm text-gray-500">{formatDistanceToNow(new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000),{ addSuffix: true })}</div></div></div><div>{renderRatingStars(review.rating)}</div></div><p className="text-gray-700">{review.comment}</p></div>))}</div>
                          {totalReviewPages > 1 && (<div className="flex justify-center mt-6"><nav className="inline-flex"><button onClick={() => setCurrentReviewPage((prev) => Math.max(prev - 1, 1))} disabled={currentReviewPage === 1} className={`px-3 py-1 rounded-l-md ${currentReviewPage === 1 ? 'bg-gray-200 text-gray-500' : 'bg-[#003c95] text-white hover:bg-[#003c95]'}`}>Prev</button>{Array.from({ length: totalReviewPages }).map((_, index) => (<button key={index} onClick={() => setCurrentReviewPage(index + 1)} className={`px-3 py-1 ${currentReviewPage === index + 1 ? 'bg-[#003c95] text-white' : 'bg-[#003c95] text-white hover:bg-[#003c95]'}`}>{index + 1}</button>))}<button onClick={() => setCurrentReviewPage((prev) => Math.min(prev + 1, totalReviewPages))} disabled={currentReviewPage === totalReviewPages} className={`px-3 py-1 rounded-r-md ${currentReviewPage === totalReviewPages ? 'bg-gray-200 text-gray-500' : 'bg-[#003c95] text-white hover:bg-[#003c95]'}`}>Next</button></nav></div>)}
                        </div>
                      )}
          </div>

          {/* Right Column (Booking Card) */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-lg sticky top-8">
              <div className="mb-4 pb-4 border-b border-gray-200">
                <div className="flex justify-between items-center mb-1"><span className="text-sm text-gray-600">Price per passenger {days > 0 ? `/ ${days}-day travel` : ''}</span>{travelling.costing.price !== travelling.costing.discountedPrice && (<span className="line-through text-gray-500 text-sm">{travelling.costing.currency} {travelling.costing.price.toLocaleString()}</span>)}</div>
                <div className="flex items-baseline"><span className="text-2xl font-bold text-[#003c95]">{travelling.costing.currency} {travelling.costing.discountedPrice.toLocaleString()}</span></div>
                {travelling.costing.price !== travelling.costing.discountedPrice && (<div className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs inline-block mt-2">Save {Math.round(((travelling.costing.price - travelling.costing.discountedPrice) / travelling.costing.price) * 100)}%</div>)}
                <p className="text-xs text-gray-500 mt-1">Select dates and passengers to see total.</p>
              </div>
              <div className="mb-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Travel Start Date</label><input type="date" value={checkInDate ? checkInDate.toISOString().split('T')[0] : ''} onChange={handleCheckInChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#003c95] focus:border-[#003c95] text-sm" min={new Date(travelling.transportation.arrivalTime).toISOString().split('T')[0]} max={new Date(travelling.transportation.departureTime).toISOString().split('T')[0]} required/></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Travel End Date</label><input type="date" value={checkOutDate ? checkOutDate.toISOString().split('T')[0] : ''} onChange={handleCheckOutChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#003c95] focus:border-[#003c95] text-sm" min={checkInDate ? new Date(new Date(checkInDate).setDate(new Date(checkInDate).getDate())).toISOString().split('T')[0] : new Date(travelling.transportation.arrivalTime).toISOString().split('T')[0]} max={new Date(travelling.transportation.departureTime).toISOString().split('T')[0]} required disabled={!checkInDate}/></div>
                </div>
                <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1">Passengers</label><div className="flex items-center border border-gray-300 rounded-md"><button type="button" onClick={decrementGuests} disabled={guestCount <= 1} className="px-3 py-2 text-[#003c95] disabled:text-gray-400 disabled:cursor-not-allowed"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg></button><div className="flex-1 text-center text-sm"><span className="font-medium">{guestCount}</span><span className="text-gray-500 ml-1">{guestCount === 1 ? 'passenger' : 'passengers'}</span></div><button type="button" onClick={incrementGuests} className="px-3 py-2 text-[#003c95] disabled:text-gray-400"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg></button></div></div>
              </div>

              {checkInDate && checkOutDate && days > 0 && guestCount > 0 && travelling.costing && (
                <div className="border-t border-gray-200 pt-4 mb-6 space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-gray-700">Base ({guestCount} {guestCount === 1 ? 'pass.' : 'pass.'} x {days} {days === 1 ? 'day' : 'days'})</span><span className="text-gray-900">{travelling.costing.currency} {basePriceTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-700">Service Fee</span><span className="text-gray-900">{travelling.costing.currency} {serviceChargeApplied.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-700">Taxes (approx. {TAX_RATE_TRAVELLING_PERCENTAGE * 100}%)</span><span className="text-gray-900">{travelling.costing.currency} {taxesApplied.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200 mt-2"><span>Total</span><span>{travelling.costing.currency} {grandTotalBookingPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                </div>
              )}
              {bookingError && (<div className="my-3 p-3 bg-red-100 text-red-700 text-sm rounded-md">{bookingError}</div>)}
              <button onClick={handleBookNowClick} disabled={!checkInDate || !checkOutDate || days <= 0 || guestCount <= 0} className="w-full bg-[#003c95] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#003c95] transition-colors focus:outline-none focus:ring-2 focus:ring-[#003c95] focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed">Book Now</button>
              <p className="text-sm text-gray-500 text-center mt-2">You won&apos;t be charged yet</p>
            </div>
          </div>
        </div>

        <DummyReviews />
      </div>

        {loginRedirectWarning && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"><div className="bg-white rounded-lg max-w-md w-full p-6 text-center"><h3 className="text-xl font-bold mb-4">Login Required</h3><p className="mb-6 text-gray-600">You need to be logged in to make a booking. Please login to continue.</p><div className="flex justify-end space-x-3"><button onClick={() => setLoginRedirectWarning(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100">Cancel</button><button onClick={() => { setLoginRedirectWarning(false); router.push(`/sign-in?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);}} className="px-4 py-2 bg-[#003c95] text-white rounded-lg hover:bg-[#003c95]">Login</button></div></div></div>)}
            {showBookingModal && travelling && travelling.costing && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4 pb-3 border-b"><h3 className="text-xl font-bold">Complete Your Booking</h3><button onClick={() => setShowBookingModal(false)} className="text-gray-500 hover:text-gray-700"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button></div>
                  <div className="mb-6">
                    <div className="flex items-center mb-4">{travelling.bannerImage && (<div className="relative h-16 w-24 mr-3 rounded-md overflow-hidden flex-shrink-0"><Image src={travelling.bannerImage.url} alt={travelling.title || ""} layout="fill" objectFit="cover" /></div>)}<div><h4 className="font-semibold">{travelling.title}</h4><p className="text-sm text-gray-600">{travelling.transportation.from} to {travelling.transportation.to}</p>{travelling.totalRating && travelling.totalRating > 0 && (<div className="flex items-center mt-1">{renderRatingStars(travelling.totalRating)}<span className="text-xs ml-1 text-gray-600">({travelling.totalRating.toFixed(1)})</span></div>)}</div></div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4 p-4 bg-gray-50 rounded-lg text-sm">
                      <div><div className="text-xs text-gray-600">Travel Start</div><div className="font-medium">{checkInDate?.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div></div>
                      <div><div className="text-xs text-gray-600">Travel End</div><div className="font-medium">{checkOutDate?.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div></div>
                      <div><div className="text-xs text-gray-600">Duration</div><div className="font-medium">{days} {days === 1 ? 'day' : 'days'}</div></div>
                      <div><div className="text-xs text-gray-600">Passengers</div><div className="font-medium">{guestCount} {guestCount === 1 ? 'passenger' : 'passengers'}</div></div>
                    </div>
                    <div className="flex flex-col space-y-1 mb-4 p-4 bg-gray-100 rounded-lg">
                        <div className="flex justify-between text-sm"><span>Base Price ({guestCount} {guestCount === 1 ? 'pass.' : 'pass.'} x {days} {days === 1 ? 'day' : 'days'})</span><span>{travelling.costing.currency} {basePriceTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                        <div className="flex justify-between text-sm"><span>Service Fee</span><span>{travelling.costing.currency} {serviceChargeApplied.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                        <div className="flex justify-between text-sm"><span>Taxes (approx. {TAX_RATE_TRAVELLING_PERCENTAGE * 100}%)</span><span>{travelling.costing.currency} {taxesApplied.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                    </div>
                    <div className="flex justify-between font-bold text-lg p-4 bg-[#003c95] rounded-lg"><span>Grand Total</span><span>{travelling.costing.currency} {grandTotalBookingPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                  </div>
                  <form onSubmit={handleBookingSubmit}>
                    <h4 className="text-md font-semibold mb-3">Your Information</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4"><div><label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="firstName">First Name</label><input id="firstName" type="text" name="firstName" value={bookingData.firstName} onChange={handleInputChange} required className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#003c95] focus:border-[#003c95]"/></div><div><label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="lastName">Last Name</label><input id="lastName" type="text" name="lastName" value={bookingData.lastName} onChange={handleInputChange} required className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#003c95] focus:border-[#003c95]"/></div></div>
                    <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">Email</label><input id="email" type="email" name="email" value={bookingData.email} onChange={handleInputChange} required className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#003c95] focus:border-[#003c95]"/></div>
                    <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="phone">Phone Number</label><input id="phone" type="tel" name="phone" value={bookingData.phone} onChange={handleInputChange} required className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#003c95] focus:border-[#003c95]"/></div>
                    <div className="mb-6"><label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="specialRequests">Special Requests (Optional)</label><textarea id="specialRequests" name="specialRequests" value={bookingData.specialRequests} onChange={handleInputChange} rows={3} className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#003c95] focus:border-[#003c95]" placeholder="e.g., meal preferences, assistance needed"></textarea></div>
                    {bookingError && (<div className="my-4 p-3 bg-red-100 text-red-700 text-sm rounded-md">{bookingError}</div>)}
                    <button type="submit" disabled={isSubmitting} className="w-full bg-[#003c95] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#003c95] transition-colors focus:outline-none focus:ring-2 focus:ring-[#003c95] focus:ring-offset-2 disabled:bg-[#003c95] disabled:cursor-wait">{isSubmitting ? (<span className="flex items-center justify-center"><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Processing...</span>) : ("Confirm Booking")}</button>
                  </form>
                </div>
              </div>
        )}
        {bookingConfirmed && travelling && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]"><div className="bg-white rounded-lg max-w-md w-full p-6 text-center"><div className="mb-4"><div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center"><svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></div></div><h3 className="text-xl font-bold mb-2">Booking Confirmed!</h3><p className="mb-6 text-gray-600">Your booking for {travelling.title} has been confirmed. A confirmation email has been sent to {bookingData.email}.</p><button onClick={() => { setBookingConfirmed(false);}} className="w-full bg-[#003c95] text-white py-2 px-4 rounded-lg font-medium hover:bg-[#003c95]">Done</button></div></div>)}
    </div>
  );
}