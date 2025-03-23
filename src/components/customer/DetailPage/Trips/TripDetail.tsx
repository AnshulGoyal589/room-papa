'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import DummyReviews from './Reviews';

interface Image {
  url: string;
  alt?: string;
}

interface Trip {
  _id?: string;
  userId: string;
  title: string;
  priority: number;
  description?: string;
  type: string;
  destination: {
    city: string;
    state: string;
    country: string;
  };
  startDate: Date;
  endDate: Date;
  costing: {
    price: number;
    discountedPrice: number;
    currency: string;
  };
  totalRating?: number;
  review?: {
    comment: string;
    rating: number;
  }[];
  activities: string[];
  createdAt: Date;
  updatedAt: Date;
  bannerImage?: Image;
  detailImages?: Image[];
  domain?: string;
}

export default function TripDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentReviewPage, setCurrentReviewPage] = useState(1);
  const reviewsPerPage = 3;

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
        
        // Convert string dates to Date objects
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
      } catch (err) {
        setError('Error fetching trip details. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTripDetails();
  }, [params?.id]);

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  const calculateDuration = (start: Date, end: Date) => {
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} days, ${diffDays - 1} nights`;
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
          onClick={() => router.push('/customer/trips')}
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
          alt={trip.title}
          layout="fill"
          objectFit="cover"
          priority
          className="brightness-75"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end">
          <div className="container mx-auto px-4 py-8">
            <div className="inline-block px-3 py-1 bg-blue-600 text-white text-sm rounded-full mb-2">
              {trip.type}
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">
              {trip.title}
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
                {trip.destination.city}, {trip.destination.state},{' '}
                {trip.destination.country}
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
                        alt={trip.bannerImage.alt || trip.title}
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
                        alt={image.alt || `${trip.title} image ${index + 1}`}
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
                <p>{trip.description || 'No description available.'}</p>
              </div>
            </div>

            {/* Trip Activities */}
            {trip.activities && trip.activities.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">
                  Activities & Experiences
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {trip.activities.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-center bg-white p-4 rounded-lg shadow-sm"
                    >
                      <div className="bg-blue-100 p-2 rounded-full mr-3">
                        <svg
                          className="w-5 h-5 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <span>{activity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                  <span className="text-gray-600">Price</span>
                  {trip.costing.price !== trip.costing.discountedPrice && (
                    <span className="line-through text-gray-500">
                      {trip.costing.currency} {trip.costing.price.toLocaleString()}
                    </span>
                  )}
                </div>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-blue-600">
                    {trip.costing.currency}{' '}
                    {trip.costing.discountedPrice.toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-600 ml-2">per person</span>
                </div>
                {trip.costing.price !== trip.costing.discountedPrice && (
                  <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm inline-block mt-2">
                    Save{' '}
                    {Math.round(
                      ((trip.costing.price - trip.costing.discountedPrice) /
                        trip.costing.price) *
                        100
                    )}
                    %
                  </div>
                )}
              </div>

              <div className="border-t border-b border-gray-200 py-4 my-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">Trip Duration</span>
                  <span>
                    {calculateDuration(trip.startDate, trip.endDate)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Dates</span>
                  <span>
                    {trip.startDate.toLocaleDateString()} -{' '}
                    {trip.endDate.toLocaleDateString()}
                  </span>
                </div>
              </div>

              <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition duration-300 mb-4">
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
                  <span>Free cancellation up to 48 hours before trip</span>
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
      </div>

      <div className="container mx-auto px-4 py-8">

         <DummyReviews />
      </div>
    </div>
  );
}