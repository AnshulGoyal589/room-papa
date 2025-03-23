'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Property } from '@/lib/mongodb/models/Property';
import { PropertyAmenities } from '@/types';
import DummyReviews from './Reviews';

interface Image {
  url: string;
  alt?: string;
}


export default function PropertyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentReviewPage, setCurrentReviewPage] = useState(1);
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [guestCount, setGuestCount] = useState(1);
  const reviewsPerPage = 3;

  useEffect(() => {
    const fetchPropertyDetails = async () => {
      if (!params?.id) return;
      
      try {
        
        setLoading(true);

        const response = await fetch(`/api/properties/${params.id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch property details');
        }
        
        const data = await response.json();
        
        const parsedProperty: Property = {
          ...data,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt)
        };
        
        setProperty(parsedProperty);
        if (parsedProperty.bannerImage) {
          setSelectedImage(parsedProperty.bannerImage.url);
        }

        // Set default check-in/check-out dates
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayAfterTomorrow = new Date(today);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
        
        setCheckInDate(tomorrow);
        setCheckOutDate(dayAfterTomorrow);
      } catch (err) {
        setError('Error fetching property details. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPropertyDetails();
  }, [params?.id]);

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  const calculateNights = (start: Date, end: Date) => {
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const incrementGuests = () => {
    if (property && guestCount < property.maximumGuests) {
      setGuestCount(prev => prev + 1);
    }
  };

  const decrementGuests = () => {
    if (guestCount > 1) {
      setGuestCount(prev => prev - 1);
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

  const getAmenityIcon = (amenity: PropertyAmenities) => {
    const icons: Record<PropertyAmenities, React.ReactNode> = {
      wifi: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M17.778 8.222c-4.296-4.296-11.26-4.296-15.556 0A1 1 0 01.808 6.808c5.076-5.077 13.308-5.077 18.384 0a1 1 0 01-1.414 1.414zM14.95 11.05a7 7 0 00-9.9 0 1 1 0 01-1.414-1.414 9 9 0 0112.728 0 1 1 0 01-1.414 1.414zM12.12 13.88a3 3 0 00-4.242 0 1 1 0 01-1.415-1.415 5 5 0 017.072 0 1 1 0 01-1.415 1.415zM9 16a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
      ),
      pool: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
        </svg>
      ),
      airConditioning: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M5.5 13a3.5 3.5 0 01-3.5-3.5V3a1 1 0 011-1h5a1 1 0 011 1v1h5a1 1 0 011 1v1h5a1 1 0 110 2h-5v1h4a1 1 0 110 2h-4v1h3a1 1 0 110 2h-3v1h2a1 1 0 110 2h-2v.5A3.5 3.5 0 015.5 13z" />
        </svg>
      ),
      breakfast: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zM7 10a1 1 0 112 0v5a1 1 0 11-2 0v-5zm6 0a1 1 0 112 0v5a1 1 0 11-2 0v-5z" clipRule="evenodd" />
        </svg>
    ),
      parking: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M6 3a3 3 0 00-3 3v1h10V6a3 3 0 00-3-3H6zM3 8v8a3 3 0 003 3h4a3 3 0 003-3V8H3z" />
          <path d="M8 14a1 1 0 100-2H6a1 1 0 100 2h2z" />
        </svg>
      ),
      spa: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zM7 10a1 1 0 112 0v1h1a1 1 0 110 2H9v1a1 1 0 11-2 0v-1H6a1 1 0 110-2h1v-1z" clipRule="evenodd" />
        </svg>
      ),
      restaurant: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zM6 10a1 1 0 112 0v5a1 1 0 11-2 0v-5zm6 0a1 1 0 112 0v5a1 1 0 11-2 0v-5z" clipRule="evenodd" />
        </svg>
      ),
      gym: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
      )
    };
    
    return icons[amenity];
  };

  const formatAmenityName = (amenity: PropertyAmenities): string => {
    const formattedNames: Record<PropertyAmenities, string> = {
      wifi: 'WiFi',
      parking: 'Parking',
      pool: 'Swimming Pool',
      airConditioning: 'Air Conditioning',
      gym: 'Fitness Center',
      spa: 'Spa',
      restaurant: 'Restaurant',
      breakfast: 'Breakfast',
    };
    
    return formattedNames[amenity];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-red-600">
          {error || 'Property not found'}
        </h2>
        <button
          onClick={() => router.push('/properties')}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Go Back to Properties
        </button>
      </div>
    );
  }

  // Calculate total price
  const nights = checkInDate && checkOutDate ? calculateNights(checkInDate, checkOutDate) : 0;
  const totalPrice = property.costing.discountedPrice * nights;

  // Calculate paginated reviews
  const paginatedReviews = property.review
    ? property.review.slice(
        (currentReviewPage - 1) * reviewsPerPage,
        currentReviewPage * reviewsPerPage
      )
    : [];

  const totalReviewPages = property.review
    ? Math.ceil(property.review.length / reviewsPerPage)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Hero Section with Banner Image */}
      <div className="relative h-96 md:h-[500px] w-full">
        <Image
          src={selectedImage || '/images/placeholder-property.jpg'}
          alt={property.title || 'Property'}
          layout="fill"
          objectFit="cover"
          priority
          className="brightness-75"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end">
          <div className="container mx-auto px-4 py-8">
            <div className="inline-block px-3 py-1 bg-blue-600 text-white text-sm rounded-full mb-2">
              {property.type.charAt(0).toUpperCase() + property.type.slice(1)}
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">
              {property.title || `Beautiful ${property.type} in ${property.location.city}`}
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
                {property.location.address}, {property.location.city}, {property.location.state}, {property.location.country}
              </span>
            </div>
            {property.totalRating && (
              <div className="flex items-center text-white">
                {renderRatingStars(property.totalRating)}
                <span className="ml-2">
                  {property.totalRating.toFixed(1)} ({property.review?.length || 0}{' '}
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
          {/* Left Column - Property Details */}
          <div className="lg:col-span-2">
            {/* Property Quick Info */}
            <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-gray-600 mb-1">Bedrooms</div>
                  <div className="font-bold text-xl">{property.bedrooms}</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-600 mb-1">Bathrooms</div>
                  <div className="font-bold text-xl">{property.bathrooms}</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-600 mb-1">Max Guests</div>
                  <div className="font-bold text-xl">{property.maximumGuests}</div>
                </div>
              </div>
            </div>
            
            {/* Property Gallery */}
            {property.detailImages && property.detailImages.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Gallery</h2>
                <div className="grid grid-cols-4 gap-2">
                  {property.bannerImage && (
                    <div
                      className={`relative h-24 cursor-pointer ${
                        selectedImage === property.bannerImage.url
                          ? 'ring-2 ring-blue-600'
                          : ''
                      }`}
                      onClick={() => handleImageClick(property.bannerImage!.url)}
                    >
                      <Image
                        src={property.bannerImage.url}
                        alt={property.bannerImage.alt || "Property Banner"}
                        layout="fill"
                        objectFit="cover"
                        className="rounded-lg"
                      />
                    </div>
                  )}
                  {property.detailImages.slice(0, 7).map((image, index) => (
                    <div
                      key={index}
                      className={`relative h-24 cursor-pointer ${
                        selectedImage === image.url ? 'ring-2 ring-blue-600' : ''
                      }`}
                      onClick={() => handleImageClick(image.url)}
                    >
                      <Image
                        src={image.url}
                        alt={image.alt || `Property image ${index + 1}`}
                        layout="fill"
                        objectFit="cover"
                        className="rounded-lg"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Property Description */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">About This Property</h2>
              <div className="prose max-w-none">
                <p>{property.description}</p>
              </div>
            </div>

            {/* Property Amenities */}
            {property.amenities && property.amenities.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">
                  Amenities
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {property.amenities.map((amenity, index) => (
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
            )}

            {/* Reviews Section */}
            {property.review && property.review.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">
                    Reviews ({property.review.length})
                  </h2>
                  <div className="flex items-center">
                    {renderRatingStars(property.totalRating || 0)}
                    <span className="ml-2 font-semibold">
                      {property.totalRating?.toFixed(1) || '0.0'}
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
                  {property.costing.price !== property.costing.discountedPrice && (
                    <span className="line-through text-gray-500">
                      {property.costing.currency} {property.costing.price.toLocaleString()}
                    </span>
                  )}
                </div>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-blue-600">
                    {property.costing.currency}{' '}
                    {property.costing.discountedPrice.toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-600 ml-2">per night</span>
                </div>
                {property.costing.price !== property.costing.discountedPrice && (
                  <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm inline-block mt-2">
                    Save{' '}
                    // Continue from where the code was cut off
                    {Math.round(
                      ((property.costing.price - property.costing.discountedPrice) / property.costing.price) * 100
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
                      onChange={(e) => setCheckInDate(new Date(e.target.value))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Check-out
                    </label>
                    <input
                      type="date"
                      value={checkOutDate ? checkOutDate.toISOString().split('T')[0] : ''}
                      onChange={(e) => setCheckOutDate(new Date(e.target.value))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      min={checkInDate 
                        ? new Date(checkInDate.getTime() + 86400000).toISOString().split('T')[0]
                        : new Date().toISOString().split('T')[0]}
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
                      {guestCount} {guestCount === 1 ? 'Guest' : 'Guests'}
                    </div>
                    <button
                      onClick={incrementGuests}
                      disabled={guestCount >= property.maximumGuests}
                      className="px-3 py-2 text-blue-600 disabled:text-gray-400"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Maximum {property.maximumGuests} guests allowed
                  </div>
                </div>
              </div>

              {/* Price Summary */}
              {checkInDate && checkOutDate && (
                <div className="border-t border-gray-200 pt-4 mb-6">
                  <div className="flex justify-between mb-2">
                    <span>
                      {property.costing.currency} {property.costing.discountedPrice.toLocaleString()} x {nights} nights
                    </span>
                    <span>
                      {property.costing.currency} {totalPrice.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>Cleaning fee</span>
                    <span>{property.costing.currency} 50</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>Service fee</span>
                    <span>{property.costing.currency} {Math.round(totalPrice * 0.1)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200">
                    <span>Total</span>
                    <span>
                      {property.costing.currency} {(totalPrice + 50 + Math.round(totalPrice * 0.1)).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Book Now Button */}
              <button
                className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition duration-200"
                onClick={() => {
                  // Handle booking logic here
                  alert('Booking functionality would go here');
                }}
              >
                Book Now
              </button>
              
              <div className="text-xs text-gray-500 text-center mt-2">
                You won't be charged yet
              </div>

              {/* Host Info */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center mb-4">
                  <div className="bg-gray-200 rounded-full h-12 w-12 flex items-center justify-center mr-3">
                    <span className="font-bold text-gray-600">H</span>
                  </div>
                  <div>
                    <div className="font-semibold">Hosted by Property Owner</div>
                    <div className="text-sm text-gray-500">
                      Member since {new Date(property.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                    </div>
                  </div>
                </div>
                <button className="w-full py-2 border border-blue-600 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition duration-200">
                  Contact Host
                </button>
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