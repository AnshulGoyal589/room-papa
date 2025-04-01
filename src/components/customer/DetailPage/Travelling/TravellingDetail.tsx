'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { BookingFormData, TransportationType } from '@/types';
import DummyReviews from './Reviews';
import { useUser } from '@clerk/nextjs';
import { Travelling } from '@/lib/mongodb/models/Travelling';
// import { toast } from 'react-hot-toast';

export default function TravellingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isSignedIn, user, isLoaded } = useUser();
  const [travelling, setTravelling] = useState<Travelling | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentReviewPage, setCurrentReviewPage] = useState(1);
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [guestCount, setGuestCount] = useState(1);
  const reviewsPerPage = 3;
  
  // Booking modal state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingData, setBookingData] = useState<BookingFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    passengers: 1,
    specialRequests: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [loginRedirectWarning, setLoginRedirectWarning] = useState(false);

  // setGuestCount(bookingData.passengers);

  useEffect(() => {
    const fetchTravellingDetails = async () => {
      if (!params?.id) return;
      
      try {
        setLoading(true);

        const response = await fetch(`/api/travellings/${params.id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch travelling details');
        }
        
        const data = await response.json();
        
        // Convert string dates to Date objects
        const parsedTravelling: Travelling = {
          ...data,
          transportation: {
            ...data.transportation,
            departureTime: new Date(data.transportation.departureTime),
            arrivalTime: new Date(data.transportation.arrivalTime)
          },
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt)
        };
        
        setTravelling(parsedTravelling);
        if (parsedTravelling.bannerImage) {
          setSelectedImage(parsedTravelling.bannerImage.url);
        }
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayAfterTomorrow = new Date(today);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
        
        setCheckInDate(tomorrow);
        setCheckOutDate(dayAfterTomorrow);
      } catch (err) {
        setError('Error fetching travelling details. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTravellingDetails();
  }, [params?.id]);

  // Update booking data with user info when available
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      setBookingData(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.primaryEmailAddress?.emailAddress || ''
      }));
    }
    setGuestCount(2);
  }, [isLoaded, isSignedIn, user]);

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  const calculateDuration = (departure: Date, arrival: Date) => {
    const diffTime = Math.abs(arrival.getTime() - departure.getTime());
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHours}h ${diffMinutes}min`;
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

  const getTransportationIcon = (type: TransportationType) => {
    switch (type) {
      case 'flight':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        );
      case 'train':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2c2.76 0 5 2.24 5 5v10H7V7c0-2.76 2.24-5 5-5zm-1 16h2m-1 0v2m-6-2h12" />
          </svg>
        );
      case 'bus':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14h6m-5-4h4M9 6h6m0 0v12a2 2 0 01-2 2H9a2 2 0 01-2-2V6a2 2 0 012-2h6a2 2 0 012 2z" />
          </svg>
        );
      case 'car':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 6l6 0M17 6a3 3 0 010 6H7a3 3 0 010-6h10zM7 16h10M7 20h10" />
          </svg>
        );
      case 'ferry':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12c-1.10 0-2-.9-2-2V7c0-1.10.9-2 2-2h14c1.10 0 2 .9 2 2v3c0 1.10-.9 2-2 2M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!travelling || !checkInDate || !checkOutDate) return;
 
    if (!travelling) return;
    
    setIsSubmitting(true);

    try {
      
      const bookingDetails={
        type : 'travelling',
        details: {
          id: params?.id,
          ownerId : travelling.userId,
          title: travelling.title,
          locationFrom: travelling.transportation.from,
          locationTo: travelling.transportation.to,
          type: travelling.transportation.type,
        },
        bookingDetails: {
          checkIn: checkInDate.toISOString(),
          checkOut: checkOutDate.toISOString(),
          guests: guestCount,
          price: travelling.costing.discountedPrice,
          currency: travelling.costing.currency,
          totalPrice: travelling.costing.discountedPrice * bookingData.passengers,
        },
        guestDetails: bookingData,
        recipients: [bookingData.email, 'anshulgoyal589@gmail.com']
      };
      
      // Make API call to save booking
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingDetails),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create booking');
      }
      
      // Send confirmation emails
      await fetch('/api/send-booking-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...bookingDetails,
          adminEmail: 'anshulgoyal589@gmail.com',
        }),
      });
      
      // toast.success('Booking confirmed! Check your email for details.');

      setBookingConfirmed(true);
      setShowBookingModal(false);
      
      // Redirect to bookings page or show success message
      // router.push('/customer/bookings');
      
    } catch (error) {
      console.error('Booking error:', error);
      // toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBookingData(prev => ({
      ...prev,
      [name]: name === 'passengers' ? parseInt(value) : value,
    }));
  };

  const handleBookNowClick = () => {
    if (!isLoaded) return;
    
    if (!isSignedIn) {
      setLoginRedirectWarning(true);
      return;
    }
    
    setShowBookingModal(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !travelling) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-red-600">
          {error || 'Travelling information not found'}
        </h2>
        <button
          onClick={() => router.push('/customer/travellings')}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Go Back to Travellings
        </button>
      </div>
    );
  }

  // Calculate paginated reviews
  const paginatedReviews = travelling.review
    ? travelling.review.slice(
        (currentReviewPage - 1) * reviewsPerPage,
        currentReviewPage * reviewsPerPage
      )
    : [];

  const totalReviewPages = travelling.review
    ? Math.ceil(travelling.review.length / reviewsPerPage)
    : 0;

  // Calculate total price
  // const totalPrice = travelling.costing.discountedPrice * bookingData.passengers;

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Hero Section with Banner Image */}
      <div className="relative h-96 md:h-[500px] w-full">
        <Image
          src={selectedImage || '/images/placeholder-travelling.jpg'}
          alt={travelling.title}
          layout="fill"
          objectFit="cover"
          priority
          className="brightness-75"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end">
          <div className="container mx-auto px-4 py-8">
            <div className="inline-block px-3 py-1 bg-blue-600 text-white text-sm rounded-full mb-2">
              {travelling.transportation.type}
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">
              {travelling.title}
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
                {travelling.transportation.from} to {travelling.transportation.to}
              </span>
            </div>
            {travelling.totalRating && (
              <div className="flex items-center text-white">
                {renderRatingStars(travelling.totalRating)}
                <span className="ml-2">
                  {travelling.totalRating.toFixed(1)} ({travelling.review?.length || 0}{' '}
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
          {/* Left Column - Travelling Details */}
          <div className="lg:col-span-2">
            {/* Travel Gallery */}
            {travelling.detailImages && travelling.detailImages.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Gallery</h2>
                <div className="grid grid-cols-4 gap-2">
                  {travelling.bannerImage && (
                    <div
                      className={`relative h-24 cursor-pointer ${
                        selectedImage === travelling.bannerImage.url
                          ? 'ring-2 ring-blue-600'
                          : ''
                      }`}
                      onClick={() => handleImageClick(travelling.bannerImage!.url)}
                    >
                      <Image
                        src={travelling.bannerImage.url}
                        alt={travelling.bannerImage.alt || travelling.title}
                        layout="fill"
                        objectFit="cover"
                        className="rounded-lg"
                      />
                    </div>
                  )}
                  {travelling.detailImages.slice(0, 7).map((image, index) => (
                    <div
                      key={index}
                      className={`relative h-24 cursor-pointer ${
                        selectedImage === image.url ? 'ring-2 ring-blue-600' : ''
                      }`}
                      onClick={() => handleImageClick(image.url)}
                    >
                      <Image
                        src={image.url}
                        alt={image.alt || `${travelling.title} image ${index + 1}`}
                        layout="fill"
                        objectFit="cover"
                        className="rounded-lg"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transportation Details */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Transportation Details</h2>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center mb-6">
                  <div className="bg-blue-100 p-3 rounded-full mr-4">
                    {getTransportationIcon(travelling.transportation.type)}
                  </div>
                  <div>
                    <div className="text-xl font-bold">{travelling.transportation.type} Travel</div>
                    <div className="text-gray-600">{travelling.transportation.from} to {travelling.transportation.to}</div>
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row justify-between border-t border-gray-200 pt-6">
                  <div className="mb-4 md:mb-0">
                    <div className="text-sm text-gray-500">Departure</div>
                    <div className="text-lg font-bold">
                      {travelling.transportation.departureTime}
                    </div>
                    <div className="text-gray-600">
                      {travelling.transportation.departureTime}
                    </div>
                    <div className="font-medium">{travelling.transportation.from}</div>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center my-4 md:my-0">
                    <div className="text-sm text-gray-500 mb-2">Duration</div>
                    <div className="text-gray-800 font-medium">
                      {calculateDuration(
                        new Date(travelling.transportation.departureTime),
                        new Date(travelling.transportation.arrivalTime)
                      )}
                    </div>
                    <div className="relative w-24 h-0.5 bg-gray-300 my-2">
                      <div className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-gray-300"></div>
                      <div className="absolute -top-1.5 -left-1.5 w-3 h-3 rounded-full bg-gray-300"></div>
                    </div>
                    <div className="text-xs text-gray-500">Direct</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-500">Arrival</div>
                    <div className="text-lg font-bold">
                      {travelling.transportation.arrivalTime}
                    </div>
                    <div className="text-gray-600">
                      {travelling.transportation.arrivalTime}
                    </div>
                    <div className="font-medium">{travelling.transportation.to}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Travelling Description */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">About This Travel</h2>
              <div className="prose max-w-none">
                <p>{travelling.description || 'No description available.'}</p>
              </div>
            </div>

            {/* Reviews Section */}
            {travelling.review && travelling.review.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">
                    Reviews ({travelling.review.length})
                  </h2>
                  <div className="flex items-center">
                    {renderRatingStars(travelling.totalRating || 0)}
                    <span className="ml-2 font-semibold">
                      {travelling.totalRating?.toFixed(1) || '0.0'}
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
                            <div className="font-semibold">Traveller</div>
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
                  <span className="text-gray-600">Price</span>
                  {travelling.costing.price !== travelling.costing.discountedPrice && (
                    <span className="line-through text-gray-500">
                      {travelling.costing.currency} {travelling.costing.price.toLocaleString()}
                    </span>
                  )}
                </div>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-blue-600">
                    {travelling.costing.currency}{' '}
                    {travelling.costing.discountedPrice.toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-600 ml-2">per passenger</span>
                </div>
                {travelling.costing.price !== travelling.costing.discountedPrice && (
                  <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm inline-block mt-2">
                    Save{' '}
                    {Math.round(
                      ((travelling.costing.price - travelling.costing.discountedPrice) /
                        travelling.costing.price) *
                        100
                    )}
                    %
                  </div>
                )}
              </div>

              <div className="border-t border-b border-gray-200 py-4 my-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">Journey Duration</span>
                  <span>
                    {calculateDuration(
                      new Date(travelling.transportation.departureTime), 
                      new Date(travelling.transportation.arrivalTime)
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Departure</span>
                  <span>
                    {travelling.transportation.departureTime.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="font-semibold">Arrival</span>
                  <span>
                    {travelling.transportation.arrivalTime.toLocaleString()}
                  </span>
                </div>
              </div>

              <button 
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition duration-300 mb-4"
                onClick={handleBookNowClick}
              >
                Book Now
              </button>
              
              <button className="w-full bg-white border border-blue-600 text-blue-600 py-3 rounded-lg font-bold hover:bg-blue-50 transition duration-300">
                Add to Wishlist
              </button>

              <div className="mt-6 text-sm text-gray-600">
                <div className="flex items-center mb-2">
                  <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Free cancellation up to 24 hours before departure</span>
                </div>
                <div className="flex items-center mb-2">
                  <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>All taxes and fees included</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>24/7 customer support</span>
                </div>
              </div>
            </div>
          </div>

        </div>
        <DummyReviews />
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
                {travelling.bannerImage && (
                  <div className="relative h-16 w-16 mr-3">
                    <Image
                      src={travelling.bannerImage.url}
                      alt={travelling.title}
                      layout="fill"
                      objectFit="cover"
                      className="rounded-md"
                    />
                  </div>
                )}
                <div>
                  <h4 className="font-semibold">{travelling.title}</h4>
                  <p className="text-sm text-gray-600">{travelling.transportation.from}, {travelling.transportation.to}</p>
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
                    {travelling.costing.currency} {(travelling.costing.discountedPrice * bookingData.passengers).toLocaleString()}
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
                    Your booking for {travelling.title} has been confirmed. A confirmation has been sent to your email.
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