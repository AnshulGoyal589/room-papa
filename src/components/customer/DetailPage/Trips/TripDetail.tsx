'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Trip } from '@/lib/mongodb/models/Trip';
import { BookingFormData } from '@/types';
import DummyReviews from './Reviews';
import { useUser } from '@clerk/nextjs';


export default function TripDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isSignedIn, user, isLoaded } = useUser();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentReviewPage, setCurrentReviewPage] = useState(1);
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [guestCount, setGuestCount] = useState(1);
  const [days, setDays] = useState<number>(1);
  const reviewsPerPage = 3;
  
  // New state for booking confirmation
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingData, setBookingData] = useState<BookingFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    passengers: 1,
    specialRequests: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [loginRedirectWarning, setLoginRedirectWarning] = useState(false);

  useEffect(() => {
    const fetchTripDetails = async () => {
      if (!params?.id) return;
      
      try {
        setLoading(true);

        const response = await fetch(`/api/trips/${params.id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch trip details');
        }
        
        const data = await response.json();
        
        const parsedTrip: Trip = {
          ...data,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt)
        };
        
        setTrip(parsedTrip);
        if (parsedTrip.bannerImage) {
          setSelectedImage(parsedTrip.bannerImage.url);
        }

        // // Set default check-in/check-out dates
        // const today = new Date();
        // const tomorrow = new Date(today);
        // tomorrow.setDate(tomorrow.getDate() + 1);
        // const dayAfterTomorrow = new Date(today);
        // dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
        
        // setCheckInDate(tomorrow);
        // setCheckOutDate(dayAfterTomorrow);
        // setGuestCount(1);
      } catch (err) {
        setError('Error fetching trip details. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTripDetails();
  }, [params?.id]);


    const validateDate = (selectedDate: string, startDate: string, endDate: string): Date => {
      const date = new Date(selectedDate);
      const minDate = new Date(startDate);
      const maxDate = new Date(endDate);
    
      if (date < minDate) return minDate;
      if (date > maxDate) return maxDate;
    
      return date;
    };
  
    const handleCheckInChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if(!trip) return;
      const validatedCheckIn = validateDate(e.target.value, trip.startDate, trip.endDate);
      setCheckInDate(validatedCheckIn);
      setDays(Math.ceil((validatedCheckIn.getTime() - new Date(trip.startDate).getTime()) / (1000 * 3600 * 24)));
  
      // Adjust check-out date if necessary
      if (checkOutDate && validatedCheckIn >= checkOutDate) {
        setCheckOutDate(new Date(validatedCheckIn.getTime() + 86400000)); // Add 1 day
      }
    };
  
    const handleCheckOutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if(!trip) return;
      const validatedCheckOut = validateDate(e.target.value, trip.startDate, trip.endDate);
      setCheckOutDate(validatedCheckOut);
      setDays(Math.ceil((validatedCheckOut.getTime() - new Date(trip.startDate).getTime()) / (1000 * 3600 * 24)));
  
      // Ensure check-out is after check-in
      if (checkInDate && validatedCheckOut <= checkInDate) {
        setCheckOutDate(new Date(checkInDate.getTime() + 86400000)); // Add 1 day
      }
    };

  // Set form data when user is loaded
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      setBookingData(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.primaryEmailAddress?.emailAddress || ''
      }));
    }
  }, [isLoaded, isSignedIn, user]);

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };


  const incrementGuests = () => {
    setGuestCount(prev => prev + 1);
  };

  const decrementGuests = () => {
    if (guestCount > 1) {
      setGuestCount(prev => prev - 1);
    }
  };


  const handleBookNowClick = () => {
    if (!isLoaded) return;
    
    if (!isSignedIn) {
      setLoginRedirectWarning(true);
      return;
    }
    
    setShowBookingModal(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBookingData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trip || !checkInDate || !checkOutDate) return;

    setBookingData(prev => ({
      ...prev,
      ['passengers']: guestCount,
    }));
    
    setIsSubmitting(true);
    
    try {

      const tripDetails = {
        type : "trip",
        details: {
          id: params?.id,
          title: trip.title,
          ownerId : trip.userId,
          locationFrom: "NA",
          locationTo: trip.destination.city + ', ' + trip.destination.country,
          type: trip.domain
        },
        bookingDetails: {
          checkIn: checkInDate.toISOString(),
          checkOut: checkOutDate.toISOString(),
          guests: guestCount,
          price: trip.costing.discountedPrice,
          currency: trip.costing.currency,
          totalPrice: trip.costing.discountedPrice * days * guestCount,
        },
        guestDetails: bookingData,
        recipients: [bookingData.email, 'anshulgoyal589@gmail.com']
      };
      
      // Send email API request
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tripDetails),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send booking confirmation');
      }
      
      setBookingConfirmed(true);
      setShowBookingModal(false);
      
      // You might want to save the booking to database here as well
      
    } catch (error) {
      console.error('Error submitting booking:', error);
      alert('There was an error processing your booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderRatingStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-5 h-5 ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-red-600">
          {error || 'Trip not found'}
        </h2>
        <button
          onClick={() => router.push('/trips')}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Go Back to Trips
        </button>
      </div>
    );
  }


  // Calculate paginated reviews
  const paginatedReviews = trip.review
    ? trip.review.slice(
        (currentReviewPage - 1) * reviewsPerPage,
        currentReviewPage * reviewsPerPage
      )
    : [];

  const totalReviewPages = trip.review
    ? Math.ceil(trip.review.length / reviewsPerPage)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Hero Section with Banner Image */}
      <div className="relative h-96 md:h-[500px] w-full">
        <Image
          src={selectedImage || '/images/placeholder-trip.jpg'}
          alt={trip.title || 'Trip'}
          layout="fill"
          objectFit="cover"
          priority
          className="brightness-75"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end">
          <div className="container mx-auto px-4 py-8">
            <div className="inline-block px-3 py-1 bg-blue-600 text-white text-sm rounded-full mb-2">
              {trip.type.charAt(0).toUpperCase() + trip.type.slice(1)}
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">
              {trip.title || `Beautiful ${trip.type} in ${trip.destination.city}`}
            </h1>
            <div className="flex items-center text-white mb-4">
              <svg
                className="w-5 h-5 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>
                {trip.destination.city}, {trip.destination.state}, {trip.destination.country}
              </span>
            </div>
            {trip.totalRating && (
              <div className="flex items-center text-white">
                {renderRatingStars(trip.totalRating)}
                <span className="ml-2">
                  {trip.totalRating.toFixed(1)} ({trip.review?.length || 0}{' '}
                  reviews)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Trip Details */}
          <div className="lg:col-span-2">
            
            {/* Trip Gallery */}
            {trip.detailImages && trip.detailImages.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Gallery</h2>
                <div className="grid grid-cols-4 gap-2">
                  {trip.bannerImage && (
                    <div
                      className={`relative h-24 cursor-pointer ${
                        selectedImage === trip.bannerImage.url
                          ? 'ring-2 ring-blue-600'
                          : ''
                      }`}
                      onClick={() => handleImageClick(trip.bannerImage!.url)}
                    >
                      <Image
                        src={trip.bannerImage.url}
                        alt={trip.bannerImage.alt || "Trip Banner"}
                        layout="fill"
                        objectFit="cover"
                        className="rounded-lg"
                      />
                    </div>
                  )}
                  {trip.detailImages.slice(0, 7).map((image, index) => (
                    <div
                      key={index}
                      className={`relative h-24 cursor-pointer ${
                        selectedImage === image.url ? 'ring-2 ring-blue-600' : ''
                      }`}
                      onClick={() => handleImageClick(image.url)}
                    >
                      <Image
                        src={image.url}
                        alt={image.alt || `Trip image ${index + 1}`}
                        layout="fill"
                        objectFit="cover"
                        className="rounded-lg"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trip Description */}
<div className="mb-8">
  <h2 className="text-2xl font-bold mb-4">About This Trip</h2>
  <div className="prose max-w-none">
    <p>{trip.description}</p>
  </div>
</div>

{/* Trip Activities */}
{trip.activities && trip.activities.length > 0 && (
  <div className="mb-8">
    <h2 className="text-2xl font-bold mb-4">Activities</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {trip.activities.map((activity, index) => (
        <div key={index} className="flex items-center bg-white p-4 rounded-lg shadow-sm">
          <div className="bg-blue-100 p-2 rounded-full mr-3 text-blue-600">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
            </svg>
          </div>
          <span>{activity}</span>
        </div>
      ))}
    </div>
  </div>
)}

{/* Trip Amenities */}
{trip.amenities && trip.amenities.length > 0 && (
  <div className="mb-8">
    <h2 className="text-2xl font-bold mb-4">Amenities</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {trip.amenities.map((amenity, index) => (
        <div key={index} className="flex items-center bg-white p-4 rounded-lg shadow-sm">
          <div className="bg-blue-100 p-2 rounded-full mr-3 text-blue-600">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 2a1 1 0 011-1h8a1 1 0 011 1v10a1 1 0 01-1 1H6a1 1 0 01-1-1V2zm2 1a1 1 0 00-1 1v3a1 1 0 001 1h4a1 1 0 001-1V4a1 1 0 00-1-1H7z" clipRule="evenodd" />
            </svg>
          </div>
          <span>{amenity}</span>
        </div>
      ))}
    </div>
  </div>
)}

{/* Trip Accessibility */}
{trip.accessibility && trip.accessibility.length > 0 && (
  <div className="mb-8">
    <h2 className="text-2xl font-bold mb-4">Accessibility</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {trip.accessibility.map((feature, index) => (
        <div key={index} className="flex items-center bg-white p-4 rounded-lg shadow-sm">
          <div className="bg-green-100 p-2 rounded-full mr-3 text-green-600">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <span>{feature}</span>
        </div>
      ))}
    </div>
  </div>
)}

{/* Popular Filters */}
{trip.popularFilters && trip.popularFilters.length > 0 && (
  <div className="mb-8">
    <h2 className="text-2xl font-bold mb-4">Popular Features</h2>
    <div className="flex flex-wrap gap-2">
      {trip.popularFilters.map((filter, index) => (
        <span key={index} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
          {filter}
        </span>
      ))}
    </div>
  </div>
)}

{/* Fun Things To Do */}
{trip.funThingsToDo && trip.funThingsToDo.length > 0 && (
  <div className="mb-8">
    <h2 className="text-2xl font-bold mb-4">Fun Things To Do</h2>
    <div className="bg-white p-5 rounded-lg shadow-sm">
      <ul className="space-y-2">
        {trip.funThingsToDo.map((activity, index) => (
          <li key={index} className="flex items-start">
            <svg className="h-5 w-5 mr-2 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{activity}</span>
          </li>
        ))}
      </ul>
    </div>
  </div>
)}

{/* Meals */}
{trip.meals && trip.meals.length > 0 && (
  <div className="mb-8">
    <h2 className="text-2xl font-bold mb-4">Included Meals</h2>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {trip.meals.map((meal, index) => (
        <div key={index} className="flex items-center bg-white p-3 rounded-lg shadow-sm">
          <div className="bg-yellow-100 p-2 rounded-full mr-2 text-yellow-600">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h5a1 1 0 000-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM13 16a1 1 0 102 0v-5.586l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 101.414 1.414L13 10.414V16z" />
            </svg>
          </div>
          <span>{meal}</span>
        </div>
      ))}
    </div>
  </div>
)}

{/* Facilities */}
{trip.facilities && trip.facilities.length > 0 && (
  <div className="mb-8">
    <h2 className="text-2xl font-bold mb-4">Facilities</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {trip.facilities.map((facility, index) => (
        <div key={index} className="flex items-center bg-white p-4 rounded-lg shadow-sm">
          <div className="bg-purple-100 p-2 rounded-full mr-3 text-purple-600">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <span>{facility}</span>
        </div>
      ))}
    </div>
  </div>
)}

{/* Reservation Policy */}
{trip.reservationPolicy && trip.reservationPolicy.length > 0 && (
  <div className="mb-8">
    <h2 className="text-2xl font-bold mb-4">Reservation Policy</h2>
    <div className="bg-white p-5 rounded-lg shadow-sm">
      <ul className="space-y-2">
        {trip.reservationPolicy.map((policy, index) => (
          <li key={index} className="flex items-start">
            <svg className="h-5 w-5 mr-2 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>{policy}</span>
          </li>
        ))}
      </ul>
    </div>
  </div>
)}

{/* Brands */}
{trip.brands && trip.brands.length > 0 && (
  <div className="mb-8">
    <h2 className="text-2xl font-bold mb-4">Partnered With</h2>
    <div className="flex flex-wrap gap-4 items-center">
      {trip.brands.map((brand, index) => (
        <div key={index} className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
          <span className="font-medium text-gray-800">{brand}</span>
        </div>
      ))}
    </div>
  </div>
)}

            {/* Trip Amenities */}
            {/* {trip.amenities && trip.amenities.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">
                  Amenities
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {trip.amenities.map((amenity, index) => (
                    <div
                      key={index}
                      className="flex items-center bg-white p-4 rounded-lg shadow-sm"
                    >
                      <div className="bg-blue-100 p-2 rounded-full mr-3 text-blue-600">
                        {getAmenityIcon(amenity)}
                      </div>
                      <span>{formatAmenityName(amenity)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )} */}

            {/* Reviews Section */}
            {trip.review && trip.review.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">
                    Reviews ({trip.review.length})
                  </h2>
                  <div className="flex items-center">
                    {renderRatingStars(trip.totalRating || 0)}
                    <span className="ml-2 font-semibold">
                      {trip.totalRating?.toFixed(1) || '0.0'}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {paginatedReviews.map((review, index) => (
                    <div
                      key={index}
                      className="bg-white p-4 rounded-lg shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <div className="bg-gray-200 rounded-full h-10 w-10 flex items-center justify-center mr-3">
                            <span className="font-bold text-gray-600">
                              {String.fromCharCode(65 + index)}
                            </span>
                          </div>
                          <div>
                            <div className="font-semibold">Guest</div>
                            <div className="text-sm text-gray-500">
                              {formatDistanceToNow(
                                new Date(
                                  Date.now() -
                                    Math.floor(Math.random() * 30) * 86400000
                                ),
                                { addSuffix: true }
                              )}
                            </div>
                          </div>
                        </div>
                        <div>{renderRatingStars(review.rating)}</div>
                      </div>
                      <p className="text-gray-700">{review.comment}</p>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalReviewPages > 1 && (
                  <div className="flex justify-center mt-6">
                    <nav className="inline-flex">
                      <button
                        onClick={() =>
                          setCurrentReviewPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={currentReviewPage === 1}
                        className={`px-3 py-1 rounded-l-md ${
                          currentReviewPage === 1
                            ? 'bg-gray-200 text-gray-500'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        Prev
                      </button>
                      {Array.from({ length: totalReviewPages }).map(
                        (_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentReviewPage(index + 1)}
                            className={`px-3 py-1 ${
                              currentReviewPage === index + 1
                                ? 'bg-blue-700 text-white'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            {index + 1}
                          </button>
                        )
                      )}
                      <button
                        onClick={() =>
                          setCurrentReviewPage((prev) =>
                            Math.min(prev + 1, totalReviewPages)
                          )
                        }
                        disabled={currentReviewPage === totalReviewPages}
                        className={`px-3 py-1 rounded-r-md ${
                          currentReviewPage === totalReviewPages
                            ? 'bg-gray-200 text-gray-500'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Booking Info */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-lg sticky top-8">
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Price per night</span>
                  {trip.costing.price !== trip.costing.discountedPrice && (
                    <span className="line-through text-gray-500">
                      {trip.costing.currency} {(trip.costing.price*guestCount).toLocaleString()}
                    </span>
                  )}
                </div>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-blue-600">
                    {trip.costing.currency}{' '}
                    {(trip.costing.discountedPrice*guestCount).toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-600 ml-2">per night</span>
                </div>
                {trip.costing.price !== trip.costing.discountedPrice && (
                  <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm inline-block mt-2">
                    Save{' '}
                    {Math.round(
                      ((trip.costing.price - trip.costing.discountedPrice) / trip.costing.price) * 100
                    )}% off
                  </div>
                )}
              </div>

              {/* Booking Form */}
              <div className="mb-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Check-in
                    </label>
                    <input
                      type="date"
                      value={checkInDate ? checkInDate.toISOString().split('T')[0] : ''}
                      onChange={handleCheckInChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      min={new Date(trip.startDate).toISOString().split('T')[0]}
                      max={new Date(trip.endDate).toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <label>Check-out</label>
                    <br />
                    <input
                      type="date"
                      value={checkOutDate ? checkOutDate.toISOString().split('T')[0] : ''}
                      onChange={handleCheckOutChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      
                      min={
                        checkInDate
                          ? new Date(checkInDate.getTime() + 86400000).toISOString().split('T')[0]
                          : new Date(trip.startDate).toISOString().split('T')[0]
                      }
                      max={new Date(trip.endDate).toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Guests
                  </label>
                  <div className="flex items-center border border-gray-300 rounded-md">
                    <button
                      onClick={decrementGuests}
                      disabled={guestCount <= 1}
                      className="px-3 py-2 text-blue-600 disabled:text-gray-400"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <div className="flex-1 text-center">
                      <span className="font-medium">{guestCount}</span>
                      <span className="text-gray-500 ml-1">
                        {guestCount === 1 ? 'guest' : 'guests'}
                      </span>
                    </div>
                    <button
                      onClick={incrementGuests}
                      // disabled={guestCount >= trip.rooms*3}
                      className="px-3 py-2 text-blue-600 disabled:text-gray-400"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Price Calculation */}
              {checkInDate && checkOutDate && (
                <div className="border-t border-gray-200 pt-4 mb-6">         
                  <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200 mt-2">
                    <span>Total</span>
                    <span>
                      {trip.costing.currency} {(trip.costing.discountedPrice * guestCount * days).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={handleBookNowClick}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Book Now
              </button>

              <p className="text-sm text-gray-500 text-center mt-2">
                You would not be charged yet
              </p>
            </div>
          </div>
        </div>
        <DummyReviews/>
      </div>

      {/* Login Warning Modal */}
      {loginRedirectWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Login Required</h3>
            <p className="mb-6">
              You need to be logged in to make a booking. Would you like to login now?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setLoginRedirectWarning(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  router.push(`/sign-in?redirect=${encodeURIComponent(window.location.pathname)}`);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Complete Your Booking</h3>
              <button
                onClick={() => setShowBookingModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center mb-4">
                {trip.bannerImage && (
                  <div className="relative h-16 w-16 mr-3">
                    <Image
                      src={trip.bannerImage.url}
                      alt={trip.title || ""}
                      layout="fill"
                      objectFit="cover"
                      className="rounded-md"
                    />
                  </div>
                )}
                <div>
                  <h4 className="font-semibold">{trip.title}</h4>
                  <p className="text-sm text-gray-600">{trip.destination.city}, {trip.destination.country}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-sm text-gray-600">Check-in</div>
                  <div className="font-medium">
                    {checkInDate?.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Check-out</div>
                  <div className="font-medium">
                    {checkOutDate?.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Guests</div>
                  <div className="font-medium">{guestCount} {guestCount === 1 ? 'guest' : 'guests'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Total</div>
                  <div className="font-medium">
                    {trip.costing.currency} {(trip.costing.discountedPrice * bookingData.passengers).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleBookingSubmit}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={bookingData.firstName}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={bookingData.lastName}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={bookingData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={bookingData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Special Requests (Optional)
                </label>
                <textarea
                  name="specialRequests"
                  value={bookingData.specialRequests}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                ></textarea>
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  "Confirm Booking"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
      
      {/* Booking Confirmation Modal */}
      {bookingConfirmed && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 text-center">
            <div className="mb-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-bold mb-2">Booking Confirmed!</h3>
            <p className="mb-6 text-gray-600">
              Your booking for {trip.title} has been confirmed. A confirmation has been sent to your email.
            </p>
            <button
              onClick={() => setBookingConfirmed(false)}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}