// FILE: app/customer/trips/[id]/TripClientView.tsx
// ROLE: A Client Component to handle all complex UI, state, and booking logic.

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Trip } from '@/lib/mongodb/models/Trip';
import { BookingFormData } from '@/types';
import DummyReviews from '@/components/customer/DetailPage/Travelling/Reviews';
import { useUser } from '@clerk/nextjs';

// Define the props this component receives from the server page.
interface TripClientViewProps {
  initialTripData: Trip;
}

// --- Constants (can be co-located or imported) ---
const SERVICE_FEE_TRIP = 15;
const TAX_RATE_TRIP_PERCENTAGE = 0.08;
const LOCAL_STORAGE_KEY_TRIP = 'tripBookingPreferences_v1';

// --- Helper Functions ---
const calculateDays = (start: Date | null, end: Date | null): number => {
  if (!start || !end || end <= start) return 0;
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export default function TripClientView({ initialTripData }: TripClientViewProps) {
  const router = useRouter();
  const { isSignedIn, user, isLoaded } = useUser();
  
  // --- STATE INITIALIZATION ---
  // The core `trip` state is initialized from the server prop.
  // We use a function in useState to parse the dates (which are strings after serialization) only once.
  const [trip] = useState<Trip>(initialTripData);

  // The `loading` and `error` states for the initial fetch are NO LONGER NEEDED.
  // The parent server component handles these cases.

  const [selectedImage, setSelectedImage] = useState<string | null>(trip.bannerImage?.url || null);
  const [currentReviewPage, setCurrentReviewPage] = useState(1);
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [guestCount, setGuestCount] = useState(1);
  const reviewsPerPage = 3;

  const days = useMemo(() => calculateDays(checkInDate, checkOutDate), [checkInDate, checkOutDate]);
  
  // Pricing State
  const [basePriceTotal, setBasePriceTotal] = useState<number>(0);
  const [serviceCharge, setServiceCharge] = useState<number>(0);
  const [taxesApplied, setTaxesApplied] = useState<number>(0);
  const [grandTotalBookingPrice, setGrandTotalBookingPrice] = useState<number>(0);
  
  // Modal & Booking State
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingData, setBookingData] = useState<BookingFormData>({
    firstName: '', lastName: '', email: '', phone: '', passengers: 1, specialRequests: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [loginRedirectWarning, setLoginRedirectWarning] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // REMOVED: The initial useEffect to fetch data is gone. The page loads instantly with data.

  // --- Client-Side Hooks for UI Logic ---

  const validateTripDate = (selectedDateStr: string, tripStartDate: Date, tripEndDate: Date): Date => {
    const date = new Date(selectedDateStr);
    const minDate = new Date(tripStartDate);
    minDate.setHours(0,0,0,0);
    const maxDate = new Date(tripEndDate);
    maxDate.setHours(23,59,59,999);
  
    if (date < minDate) return minDate;
    if (date > maxDate) return maxDate;
    return date;
  };

  useEffect(() => {
    const storedPreferences = localStorage.getItem(LOCAL_STORAGE_KEY_TRIP);
    if (storedPreferences) {
      try {
        const parsedPrefs = JSON.parse(storedPreferences);
        if (parsedPrefs.type === 'trip') {
          let loadedCheckInDate: Date | null = null;
          if (parsedPrefs.checkInDate) {
            loadedCheckInDate = validateTripDate(parsedPrefs.checkInDate, new Date(trip.startDate), new Date(trip.endDate));
            setCheckInDate(loadedCheckInDate);
          }
          if (parsedPrefs.checkOutDate) {
          if (parsedPrefs.checkOutDate) {
            const minCheckoutValidation = loadedCheckInDate ? new Date(new Date(loadedCheckInDate).setDate(loadedCheckInDate.getDate() + 1)) : new Date(trip.startDate);
            let validatedCheckOut = validateTripDate(parsedPrefs.checkOutDate, minCheckoutValidation, new Date(trip.endDate));
            if (loadedCheckInDate && validatedCheckOut <= loadedCheckInDate) {
               const nextDay = new Date(loadedCheckInDate.getTime());
               nextDay.setDate(loadedCheckInDate.getDate() + 1);
               validatedCheckOut = (nextDay <= new Date(trip.endDate)) ? nextDay : new Date(trip.endDate);
            }
            setCheckOutDate(validatedCheckOut);
          }
            setGuestCount(parsedPrefs.guestCount);
          }
        }
      } catch (e) { console.error("Failed to parse localStorage", e); }
    }
  }, [trip]);

  useEffect(() => {
    const preferencesToSave = {
      checkInDate: checkInDate ? checkInDate.toISOString() : null,
      checkOutDate: checkOutDate ? checkOutDate.toISOString() : null,
      guestCount,
      type: 'trip',
    };
    localStorage.setItem(LOCAL_STORAGE_KEY_TRIP, JSON.stringify(preferencesToSave));
  }, [checkInDate, checkOutDate, guestCount]);

  useEffect(() => {
    if (trip.costing && guestCount > 0 && days > 0) {
      const currentBasePriceTotal = trip.costing.discountedPrice * guestCount * days;
      setBasePriceTotal(currentBasePriceTotal);
      const currentServiceCharge = SERVICE_FEE_TRIP;
      setServiceCharge(currentServiceCharge);
      const currentTaxes = (currentBasePriceTotal + currentServiceCharge) * TAX_RATE_TRIP_PERCENTAGE;
      setTaxesApplied(currentTaxes);
      setGrandTotalBookingPrice(currentBasePriceTotal + currentServiceCharge + currentTaxes);
    } else {
      setBasePriceTotal(0); setServiceCharge(0); setTaxesApplied(0); setGrandTotalBookingPrice(0);
    }
  }, [trip, guestCount, days]);

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      setBookingData(prev => ({ ...prev, firstName: user.firstName || '', lastName: user.lastName || '', email: user.primaryEmailAddress?.emailAddress || '' }));
    }
  }, [isLoaded, isSignedIn, user]);
  
  // --- All Handler and Render Helper Functions ---
  const handleCheckInChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedValue = e.target.value;
    if (!selectedValue) { setCheckInDate(null); return; }
    const validatedCheckIn = validateTripDate(selectedValue, new Date(trip.startDate), new Date(trip.endDate));
    setCheckInDate(validatedCheckIn);
    if (checkOutDate && validatedCheckIn >= checkOutDate) {
      const nextDay = new Date(validatedCheckIn);
      nextDay.setDate(validatedCheckIn.getDate() + 1);
      if (nextDay <= new Date(trip.endDate)) setCheckOutDate(nextDay);
      else setCheckOutDate(null);
    }
  };

  const handleCheckOutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedValue = e.target.value;
    if (!selectedValue) { setCheckOutDate(null); return; }
    const minCheckOutDate = checkInDate ? new Date(new Date(checkInDate).setDate(checkInDate.getDate() + 1)) : new Date(trip.startDate);
    const validatedCheckOut = validateTripDate(selectedValue, minCheckOutDate, new Date(trip.endDate));
    if (checkInDate && validatedCheckOut <= checkInDate) {
      const dayAfterCheckIn = new Date(checkInDate);
      dayAfterCheckIn.setDate(checkInDate.getDate() + 1);
      if (dayAfterCheckIn <= new Date(trip.endDate)) setCheckOutDate(dayAfterCheckIn);
      else setCheckOutDate(null);
    } else { setCheckOutDate(validatedCheckOut); }
  };
  
  const handleImageClick = (imageUrl: string) => setSelectedImage(imageUrl);
  const incrementGuests = () => setGuestCount(prev => prev + 1);
  const decrementGuests = () => { if (guestCount > 1) setGuestCount(prev => prev - 1); };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBookingData(prev => ({ ...prev, [name]: value }));
  };

  const handleBookNowClick = () => {
    if (!isLoaded) return;
    setBookingError(null);
    if (!isSignedIn) { setLoginRedirectWarning(true); return; }
    if (!checkInDate || !checkOutDate) { setBookingError("Please select check-in and check-out dates."); return; }
    if (days <= 0) { setBookingError("Check-out date must be after check-in date."); return; }
    setBookingData(prev => ({ ...prev, passengers: guestCount }));
    setShowBookingModal(true);
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInDate || !checkOutDate || guestCount <= 0 || days <= 0) {
        setBookingError("Booking details are incomplete."); return;
    }
    setIsSubmitting(true); setBookingError(null);
    try {
      const bookingPayload = {
        type: "trip",
        details: { id: trip._id, title: trip.title, ownerId: trip.userId, locationFrom: "NA", locationTo: `${trip.destination.city}, ${trip.destination.country}`, type: trip.type },
        bookingDetails: { checkIn: checkInDate.toISOString(), checkOut: checkOutDate.toISOString(), guests: guestCount, pricePerGuestPerDay: trip.costing.discountedPrice, currency: trip.costing.currency, numberOfNights: days, subtotalPrice: basePriceTotal, serviceFee: serviceCharge, taxes: taxesApplied, totalPrice: grandTotalBookingPrice },
        guestDetails: { firstName: bookingData.firstName, lastName: bookingData.lastName, email: bookingData.email, phone: bookingData.phone, specialRequests: bookingData.specialRequests },
        recipients: [bookingData.email, 'roompapa7@gmail.com']
      };
      const response = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bookingPayload) });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create booking');
      }
      setBookingConfirmed(true); setShowBookingModal(false);
      localStorage.removeItem(LOCAL_STORAGE_KEY_TRIP);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setBookingError(`Booking failed: ${error.message}. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderRatingStars = (rating: number) => (
    <div className="flex">
      {[...Array(5)].map((_, i) => (
        <svg key={i} className={`w-5 h-5 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
      ))}
    </div>
  );

  const paginatedReviews = trip.review ? trip.review.slice((currentReviewPage - 1) * reviewsPerPage, currentReviewPage * reviewsPerPage) : [];
  const totalReviewPages = trip.review ? Math.ceil(trip.review.length / reviewsPerPage) : 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Main Image Header */}
      <div className="relative h-96 md:h-[500px] w-full">
        <Image src={selectedImage || trip.bannerImage?.url || '/images/placeholder-trip.jpg'} alt={trip.title || "Trip Banner"} layout="fill" objectFit="cover" priority className="brightness-75" onError={() => setSelectedImage('/images/placeholder-trip.jpg')} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end">
          <div className="container mx-auto px-4 py-8 text-white">
            <div className="inline-block px-3 py-1 bg-[#001d2c] text-sm rounded-full mb-2 capitalize">{trip.type}</div>
            <h1 className="text-3xl md:text-5xl font-bold mb-2">{trip.title}</h1>
            <div className="flex items-center mb-4"><svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/></svg><span>{trip.destination.city}, {trip.destination.state}, {trip.destination.country}</span></div>
            {(trip.totalRating ?? 0) > 0 && (
              <div className="flex items-center">
                {renderRatingStars(trip.totalRating ?? 0)}
                <span className="ml-2">
                  {(trip.totalRating ?? 0).toFixed(1)} ({trip.review?.length || 0} reviews)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  {trip.detailImages && trip.detailImages.length > 0 && (
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold mb-4">Gallery</h2>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {trip.bannerImage && (
                          <div
                            className={`relative aspect-square cursor-pointer rounded-lg overflow-hidden ${ selectedImage === trip.bannerImage.url ? 'ring-2 ring-offset-2 ring-[#001d2c]' : '' }`}
                            onClick={() => handleImageClick(trip.bannerImage!.url)}
                          >
                            <Image src={trip.bannerImage.url} alt={trip.bannerImage.alt ?? "Trip Banner"} layout="fill" objectFit="cover" onError={(e) => e.currentTarget.src = '/images/placeholder-trip.jpg'} />
                          </div>
                        )}
                        {trip.detailImages.slice(0, trip.bannerImage ? 7 : 8).map((image, index) => (
                          <div
                            key={index}
                            className={`relative aspect-square cursor-pointer rounded-lg overflow-hidden ${ selectedImage === image.url ? 'ring-2 ring-offset-2 ring-[#001d2c]' : '' }`}
                            onClick={() => handleImageClick(image.url)}
                          >
                            <Image src={image.url} alt={image.alt ?? `Trip image ${index + 1}`} layout="fill" objectFit="cover" onError={(e) => e.currentTarget.src = '/images/placeholder-trip.jpg'}/>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
      
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-4">About This Trip</h2>
                    <div className="prose max-w-none text-gray-700">
                      <p>{trip.description || "No description available."}</p>
                    </div>
                  </div>
                  {trip.activities && trip.activities.length > 0 && (
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold mb-4">Activities</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {trip.activities.map((activity, index) => (
                          <div key={index} className="flex items-center bg-white p-4 rounded-lg shadow-sm">
                            <div className="bg-[#001d2c] p-2 rounded-full mr-3 text-[#001d2c]">
                              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>
                            </div>
                            <span>{activity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {trip.amenities && trip.amenities.length > 0 && (
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold mb-4">Amenities</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {trip.amenities.map((amenity, index) => (
                          <div key={index} className="flex items-center bg-white p-4 rounded-lg shadow-sm">
                            <div className="bg-[#001d2c] p-2 rounded-full mr-3 text-[#001d2c]"> {/* Generic checkmark or amenity icon */}
                              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                            </div>
                            <span>{amenity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {trip.accessibility && trip.accessibility.length > 0 && (
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold mb-4">Accessibility</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {trip.accessibility.map((feature, index) => (
                          <div key={index} className="flex items-center bg-white p-4 rounded-lg shadow-sm">
                            <div className="bg-green-100 p-2 rounded-full mr-3 text-green-600">
                              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                            </div>
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {trip.popularFilters && trip.popularFilters.length > 0 && (
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold mb-4">Popular Features</h2>
                      <div className="flex flex-wrap gap-2">
                        {trip.popularFilters.map((filter, index) => ( <span key={index} className="bg-[#001d2c] text-[#001d2c] px-3 py-1 rounded-full text-sm">{filter}</span> ))}
                      </div>
                    </div>
                  )}
                  {trip.funThingsToDo && trip.funThingsToDo.length > 0 && (
                    <div className="mb-8 bg-white p-6 rounded-lg shadow-lg">
                      <h2 className="text-2xl font-bold mb-4">Fun Things To Do</h2>
                      <ul className="list-disc pl-5 space-y-2 text-gray-700">
                        {trip.funThingsToDo.map((activity, index) => ( <li key={`fun-${index}`}>{activity}</li>))}
                      </ul>
                    </div>
                  )}
                  {trip.meals && trip.meals.length > 0 && (
                    <div className="mb-8 bg-white p-6 rounded-lg shadow-lg">
                      <h2 className="text-2xl font-bold mb-4">Included Meals</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {trip.meals.map((meal, index) => (
                          <div key={`meal-${index}`} className="flex items-center bg-gray-50 p-3 rounded-md border border-gray-200">
                            <div className="bg-yellow-100 p-2 rounded-full mr-3 text-yellow-600"><svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h5a1 1 0 000-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM13 16a1 1 0 102 0v-5.586l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 101.414 1.414L13 10.414V16z" /></svg></div>
                            <span>{meal}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {trip.facilities && trip.facilities.length > 0 && (
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold mb-4">Facilities</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {trip.facilities.map((facility, index) => (
                          <div key={index} className="flex items-center bg-white p-4 rounded-lg shadow-sm">
                            <div className="bg-purple-100 p-2 rounded-full mr-3 text-purple-600"><svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg></div>
                            <span>{facility}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {trip.reservationPolicy && trip.reservationPolicy.length > 0 && (
                    <div className="mb-8 bg-white p-6 rounded-lg shadow-lg">
                      <h2 className="text-2xl font-bold mb-4">Reservation Policy</h2>
                      <ul className="list-disc pl-5 space-y-2 text-gray-700">
                        {trip.reservationPolicy.map((policy, index) => (<li key={index}>{policy}</li>))}
                      </ul>
                    </div>
                  )}
                  {trip.brands && trip.brands.length > 0 && (
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold mb-4">Partnered With</h2>
                      <div className="flex flex-wrap gap-4 items-center">
                        {trip.brands.map((brand, index) => (<div key={index} className="bg-gray-100 px-4 py-2 rounded-lg shadow-sm border border-gray-200"><span className="font-medium text-gray-800">{brand}</span></div>))}
                      </div>
                    </div>
                  )}
                  {trip.review && trip.review.length > 0 && (
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold">Reviews ({trip.review.length})</h2>
                        <div className="flex items-center">
                          {renderRatingStars(trip.totalRating || 0)}
                          <span className="ml-2 font-semibold">{trip.totalRating?.toFixed(1) || '0.0'}</span>
                        </div>
                      </div>
                      <div className="space-y-4">
                        {paginatedReviews.map((review, index) => (
                          <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center">
                                <div className="bg-gray-200 rounded-full h-10 w-10 flex items-center justify-center mr-3">
                                  <span className="font-bold text-gray-600">{String.fromCharCode(65 + index)}</span>
                                </div>
                                <div>
                                  <div className="font-semibold">Guest</div>
                                  <div className="text-sm text-gray-500">{formatDistanceToNow(new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000),{ addSuffix: true })}</div>
                                </div>
                              </div>
                              <div>{renderRatingStars(review.rating)}</div>
                            </div>
                            <p className="text-gray-700">{review.comment}</p>
                          </div>
                        ))}
                      </div>
                      {totalReviewPages > 1 && (
                        <div className="flex justify-center mt-6">
                          <nav className="inline-flex">
                            <button onClick={() => setCurrentReviewPage((prev) => Math.max(prev - 1, 1))} disabled={currentReviewPage === 1} className={`px-3 py-1 rounded-l-md ${ currentReviewPage === 1 ? 'bg-gray-200 text-gray-500' : 'bg-[#001d2c] text-white hover:bg-[#001d2c]' }`}>Prev</button>
                            {Array.from({ length: totalReviewPages }).map((_, index) => ( <button key={index} onClick={() => setCurrentReviewPage(index + 1)} className={`px-3 py-1 ${ currentReviewPage === index + 1 ? 'bg-[#001d2c] text-white' : 'bg-[#001d2c] text-white hover:bg-[#001d2c]' }`}>{index + 1}</button> ))}
                            <button onClick={() => setCurrentReviewPage((prev) => Math.min(prev + 1, totalReviewPages))} disabled={currentReviewPage === totalReviewPages} className={`px-3 py-1 rounded-r-md ${ currentReviewPage === totalReviewPages ? 'bg-gray-200 text-gray-500' : 'bg-[#001d2c] text-white hover:bg-[#001d2c]' }`}>Next</button>
                          </nav>
                        </div>
                      )}
                    </div>
                  )}
                </div>
      
                {/* Right Column - Booking Info */}
                <div className="lg:col-span-1">
                  <div className="bg-white p-6 rounded-lg shadow-lg sticky top-8">
                    {/* Base Price Info */}
                    <div className="mb-4 pb-4 border-b border-gray-200">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-600">Price per guest / {days > 0 ? `${days}-day trip` : 'trip'}</span>
                        {trip.costing.price !== trip.costing.discountedPrice && (
                          <span className="line-through text-gray-500 text-sm">
                            {trip.costing.currency} {trip.costing.price.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <div className="flex items-baseline">
                        <span className="text-2xl font-bold text-[#001d2c]">
                          {trip.costing.currency}{' '}
                          {trip.costing.discountedPrice.toLocaleString()}
                        </span>
                        {/* <span className="text-sm text-gray-600 ml-1">per guest / day</span> */}
                      </div>
                      {trip.costing.price !== trip.costing.discountedPrice && (
                        <div className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs inline-block mt-2">
                          Save {Math.round(((trip.costing.price - trip.costing.discountedPrice) / trip.costing.price) * 100)}%
                        </div>
                      )}
                       <p className="text-xs text-gray-500 mt-1">Select dates and guests to see total.</p>
                    </div>
      
                    {/* Booking Form */}
                    <div className="mb-6">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Trip Start</label>
                          <input
                            type="date"
                            value={checkInDate ? checkInDate.toISOString().split('T')[0] : ''}
                            onChange={handleCheckInChange}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#001d2c] focus:border-[#001d2c] text-sm"
                            min={new Date(trip.startDate).toISOString().split('T')[0]}
                            max={new Date(trip.endDate).toISOString().split('T')[0]}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Trip End</label>
                          <input
                            type="date"
                            value={checkOutDate ? checkOutDate.toISOString().split('T')[0] : ''}
                            onChange={handleCheckOutChange}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#001d2c] focus:border-[#001d2c] text-sm"
                            min={checkInDate ? new Date(new Date(checkInDate).setDate(new Date(checkInDate).getDate() + 1)).toISOString().split('T')[0] : new Date(trip.startDate).toISOString().split('T')[0]}
                            max={new Date(trip.endDate).toISOString().split('T')[0]}
                            required
                            disabled={!checkInDate}
                          />
                        </div>
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Guests</label>
                        <div className="flex items-center border border-gray-300 rounded-md">
                          <button type="button" onClick={decrementGuests} disabled={guestCount <= 1} className="px-3 py-2 text-[#001d2c] disabled:text-gray-400 disabled:cursor-not-allowed">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                          </button>
                          <div className="flex-1 text-center text-sm">
                            <span className="font-medium">{guestCount}</span><span className="text-gray-500 ml-1">{guestCount === 1 ? 'guest' : 'guests'}</span>
                          </div>
                          <button type="button" onClick={incrementGuests} className="px-3 py-2 text-[#001d2c] disabled:text-gray-400"> {/* Add guest limit if applicable from trip.maxGuests */}
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                          </button>
                        </div>
                      </div>
                    </div>
      
                    {/* --- MODIFIED Price Calculation for Trips --- */}
                    {checkInDate && checkOutDate && days > 0 && guestCount > 0 && trip.costing && (
                      <div className="border-t border-gray-200 pt-4 mb-6 space-y-2">
                          <div className="flex justify-between text-sm">
                              <span className="text-gray-700">
                                  {guestCount} {guestCount === 1 ? 'guest' : 'guests'} x {days} {days === 1 ? 'day' : 'days'}
                              </span>
                              <span className="text-gray-900">
                                  {trip.costing.currency} {basePriceTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                          </div>
                          <div className="flex justify-between text-sm">
                              <span className="text-gray-700">Service Fee</span>
                              <span className="text-gray-900">
                                  {trip.costing.currency} {serviceCharge.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                          </div>
                          <div className="flex justify-between text-sm">
                              <span className="text-gray-700">Taxes (approx. {TAX_RATE_TRIP_PERCENTAGE * 100}%)</span>
                              <span className="text-gray-900">
                                  {trip.costing.currency} {taxesApplied.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                          </div>
                          <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200 mt-2">
                              <span>Total</span>
                              <span>
                                  {trip.costing.currency} {grandTotalBookingPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                          </div>
                      </div>
                    )}
                    {/* --- END MODIFIED Price Calculation --- */}
                    
                    {bookingError && (
                      <div className="my-3 p-3 bg-red-100 text-red-700 text-sm rounded-md">
                          {bookingError}
                      </div>
                    )}
      
                    <button
                      onClick={handleBookNowClick}
                      disabled={!checkInDate || !checkOutDate || days <= 0 || guestCount <= 0}
                      className="w-full bg-[#001d2c] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#001d2c] transition-colors focus:outline-none focus:ring-2 focus:ring-[#001d2c] focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Book Now
                    </button>
                    <p className="text-sm text-gray-500 text-center mt-2">You won&apos;t be charged yet</p>
                  </div>
                </div>
              </div>
              <DummyReviews/>
            </div>
      
            {loginRedirectWarning && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg max-w-md w-full p-6 text-center">
                  <h3 className="text-xl font-bold mb-4">Login Required</h3>
                  <p className="mb-6 text-gray-600">You need to be logged in to make a booking. Please login to continue.</p>
                  <div className="flex justify-end space-x-3">
                    <button onClick={() => setLoginRedirectWarning(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100">Cancel</button>
                    <button
                      onClick={() => {
                        setLoginRedirectWarning(false);
                        router.push(`/sign-in?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
                      }}
                      className="px-4 py-2 bg-[#001d2c] text-white rounded-lg hover:bg-[#001d2c]"
                    >Login</button>
                  </div>
                </div>
              </div>
            )}
      
            {showBookingModal && trip && trip.costing && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4 pb-3 border-b">
                    <h3 className="text-xl font-bold">Complete Your Booking</h3>
                    <button onClick={() => setShowBookingModal(false)} className="text-gray-500 hover:text-gray-700">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                  
                  <div className="mb-6">
                    <div className="flex items-center mb-4">
                      {trip.bannerImage && (<div className="relative h-16 w-24 mr-3 rounded-md overflow-hidden flex-shrink-0"><Image src={trip.bannerImage.url} alt={trip.title ?? "Trip Banner"} layout="fill" objectFit="cover" /></div>)}
                      <div>
                        <h4 className="font-semibold">{trip.title}</h4>
                        <p className="text-sm text-gray-600">{trip.destination.city}, {trip.destination.country}</p>
                        {trip.totalRating && trip.totalRating > 0 && (<div className="flex items-center mt-1">{renderRatingStars(trip.totalRating)}<span className="text-xs ml-1 text-gray-600">({trip.totalRating.toFixed(1)})</span></div>)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4 p-4 bg-gray-50 rounded-lg text-sm">
                      <div><div className="text-xs text-gray-600">Trip Start</div><div className="font-medium">{checkInDate?.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div></div>
                      <div><div className="text-xs text-gray-600">Trip End</div><div className="font-medium">{checkOutDate?.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div></div>
                      <div><div className="text-xs text-gray-600">Duration</div><div className="font-medium">{days} {days === 1 ? 'day' : 'days'}</div></div>
                      <div><div className="text-xs text-gray-600">Guests</div><div className="font-medium">{guestCount} {guestCount === 1 ? 'guest' : 'guests'}</div></div>
                    </div>
      
                    <div className="flex flex-col space-y-1 mb-4 p-4 bg-gray-100 rounded-lg">
                        <div className="flex justify-between text-sm"><span>Base Price ({guestCount} {guestCount === 1 ? 'guest' : 'guests'} x {days} {days === 1 ? 'day' : 'days'})</span><span>{trip.costing.currency} {basePriceTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                        <div className="flex justify-between text-sm"><span>Service Fee</span><span>{trip.costing.currency} {serviceCharge.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                        <div className="flex justify-between text-sm"><span>Taxes (approx. {TAX_RATE_TRIP_PERCENTAGE * 100}%)</span><span>{trip.costing.currency} {taxesApplied.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                    </div>
                    <div className="flex justify-between font-bold text-lg p-4 bg-[#001d2c] rounded-lg">
                       <span>Grand Total</span><span>{trip.costing.currency} {grandTotalBookingPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                  
                  <form onSubmit={handleBookingSubmit}>
                    <h4 className="text-md font-semibold mb-3">Your Information</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div><label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="firstName">First Name</label><input id="firstName" type="text" name="firstName" value={bookingData.firstName} onChange={handleInputChange} required className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#001d2c] focus:border-[#001d2c]"/></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="lastName">Last Name</label><input id="lastName" type="text" name="lastName" value={bookingData.lastName} onChange={handleInputChange} required className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#001d2c] focus:border-[#001d2c]"/></div>
                    </div>
                    <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">Email</label><input id="email" type="email" name="email" value={bookingData.email} onChange={handleInputChange} required className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#001d2c] focus:border-[#001d2c]"/></div>
                    <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="phone">Phone Number</label><input id="phone" type="tel" name="phone" value={bookingData.phone} onChange={handleInputChange} required className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#001d2c] focus:border-[#001d2c]"/></div>
                    <div className="mb-6"><label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="specialRequests">Special Requests (Optional)</label><textarea id="specialRequests" name="specialRequests" value={bookingData.specialRequests} onChange={handleInputChange} rows={3} className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#001d2c] focus:border-[#001d2c]" placeholder="e.g., dietary needs, accessibility requirements"></textarea></div>
                    
                    {bookingError && (<div className="my-4 p-3 bg-red-100 text-red-700 text-sm rounded-md">{bookingError}</div>)}
      
                    <button type="submit" disabled={isSubmitting} className="w-full bg-[#001d2c] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#001d2c] transition-colors focus:outline-none focus:ring-2 focus:ring-[#001d2c] focus:ring-offset-2 disabled:bg-[#001d2c] disabled:cursor-wait">
                      {isSubmitting ? (<span className="flex items-center justify-center"><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Processing...</span>) : ("Confirm Booking")}
                    </button>
                  </form>
                </div>
              </div>
            )}
            
            {bookingConfirmed && trip && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
                <div className="bg-white rounded-lg max-w-md w-full p-6 text-center">
                  <div className="mb-4"><div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center"><svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></div></div>
                  <h3 className="text-xl font-bold mb-2">Booking Confirmed!</h3>
                  <p className="mb-6 text-gray-600">Your booking for {trip.title} has been confirmed. A confirmation email has been sent to {bookingData.email}.</p>
                  <button onClick={() => { setBookingConfirmed(false);}} className="w-full bg-[#001d2c] text-white py-2 px-4 rounded-lg font-medium hover:bg-[#001d2c]">Done</button>
                </div>
              </div>
            )}
      
      </div>
  );
}