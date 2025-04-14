'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Property } from '@/lib/mongodb/models/Property'; // Assuming RoomCategory is here
import { BookingFormData, PropertyAmenities } from '@/types';
import DummyReviews from './Reviews'; // Assuming this exists
import { useUser } from '@clerk/nextjs';
import { useClerk } from '@clerk/nextjs';

// Helper function to calculate days between two dates
const calculateDays = (start: Date | null, end: Date | null): number => {
  if (!start || !end || end <= start) {
    return 0;
  }
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export default function PropertyDetailPage() {
  const { openSignIn } = useClerk();
  const router = useRouter();
  const params = useParams();
  const { isSignedIn, user, isLoaded } = useUser();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentReviewPage, setCurrentReviewPage] = useState(1);
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [guestCount, setGuestCount] = useState<number>(1);
  // --- Room Selection State ---
  const [selectedRooms, setSelectedRooms] = useState<Record<string, number>>({}); // Key: category title, Value: quantity
  const [totalSelectedRooms, setTotalSelectedRooms] = useState<number>(0);
  const [totalBookingPricePerNight, setTotalBookingPricePerNight] = useState<number>(0);
  // --- End Room Selection State ---

  const reviewsPerPage = 3;
  const MAX_COMBINED_ROOMS = 5;

  // New state for booking confirmation
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingData, setBookingData] = useState<BookingFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    passengers: 1, // Will be updated from guestCount
    rooms: 0, // Will be updated from totalSelectedRooms
    specialRequests: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  // const [loginRedirectWarning, setLoginRedirectWarning] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null); // For user feedback

  // Derived state for number of days
  const days = useMemo(() => calculateDays(checkInDate, checkOutDate), [checkInDate, checkOutDate]);

  useEffect(() => {
    const fetchPropertyDetails = async () => {
      if (!params?.id) return;

      try {
        setLoading(true);
        setError(null); // Reset error on new fetch
        const response = await fetch(`/api/properties/${params.id}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch property details (${response.status})`);
        }

        const data = await response.json();

        // Basic validation
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid property data received');
        }

        // Ensure dates are valid before parsing
        const startDate = data.startDate ? new Date(data.startDate) : new Date();
        const endDate = data.endDate ? new Date(data.endDate) : new Date();
        const createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
        const updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();


        const parsedProperty: Property = {
          ...data,
          startDate: startDate.toISOString(), // Store as ISO string
          endDate: endDate.toISOString(),     // Store as ISO string
          createdAt: createdAt,
          updatedAt: updatedAt,
          // Ensure categoryRooms is an array, default to empty if missing/invalid
          categoryRooms: Array.isArray(data.categoryRooms) ? data.categoryRooms : []
        };

        setProperty(parsedProperty);
        if (parsedProperty.bannerImage?.url) {
          setSelectedImage(parsedProperty.bannerImage.url);
        } else if (parsedProperty.detailImages && parsedProperty.detailImages.length > 0 && parsedProperty.detailImages[0].url) {
          setSelectedImage(parsedProperty.detailImages[0].url); // Fallback to first detail image
        }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setError(`Error fetching property details: ${err.message}. Please try again later.`);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPropertyDetails();
  }, [params?.id]);

  // Calculate total selected rooms and total price per night whenever selection changes
  useEffect(() => {
    if (!property?.categoryRooms) {
      setTotalSelectedRooms(0);
      setTotalBookingPricePerNight(0);
      return;
    }

    let currentTotalRooms = 0;
    let currentTotalPricePerNight = 0;

    Object.entries(selectedRooms).forEach(([title, qty]) => {
      if (qty > 0) {
        const category = property.categoryRooms?.find(cat => cat.title === title);
        if (category) {
          currentTotalRooms += qty;
          const price = category.discountedPrice > 0 ? category.discountedPrice : category.price;
          currentTotalPricePerNight += price * qty;
        }
      }
    });

    setTotalSelectedRooms(currentTotalRooms);
    setTotalBookingPricePerNight(currentTotalPricePerNight);

  }, [selectedRooms, property?.categoryRooms]);


  const validateDate = (selectedDate: string, startDateStr: string, endDateStr: string): Date => {
    const date = new Date(selectedDate);
    const minDate = new Date(startDateStr);
    // Set maxDate to the *end* of the day for comparison
    const maxDate = new Date(endDateStr);
    maxDate.setHours(23, 59, 59, 999);

    // Clear time component for minDate comparison
    minDate.setHours(0,0,0,0);

    if (date < minDate) return minDate;
    if (date > maxDate) return maxDate;

    return date;
  };

  const handleCheckInChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if(!property) return;
    const selectedValue = e.target.value;
    if (!selectedValue) {
        setCheckInDate(null);
        return;
    }
    const validatedCheckIn = validateDate(selectedValue, property.startDate, property.endDate);
    setCheckInDate(validatedCheckIn);

    // Adjust check-out date if necessary (must be at least one day after check-in)
    if (checkOutDate && validatedCheckIn >= checkOutDate) {
      const nextDay = new Date(validatedCheckIn.getTime());
      nextDay.setDate(validatedCheckIn.getDate() + 1);
      // Ensure the adjusted check-out date is within the allowed range
      const maxEndDate = new Date(property.endDate);
      if (nextDay <= maxEndDate) {
          setCheckOutDate(nextDay);
      } else {
          // If next day is beyond end date, maybe clear checkout or handle differently?
          // For now, we just won't update it if it becomes invalid.
          // Or maybe set it to the max end date if check-in is the max end date?
          if (validatedCheckIn.toDateString() === maxEndDate.toDateString()) {
             setCheckOutDate(null); // Cannot check out after the last available day
          } else {
             setCheckOutDate(maxEndDate); // Allow check-out on the last day
          }
      }
    }
  };

  const handleCheckOutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if(!property) return;
    const selectedValue = e.target.value;
     if (!selectedValue) {
        setCheckOutDate(null);
        return;
    }
    // Use property start date as minimum only if check-in is not set
    const minCheckOutDateStr = checkInDate
        ? new Date(checkInDate.getTime() + 86400000).toISOString().split('T')[0] // Day after check-in
        : property.startDate;

    const validatedCheckOut = validateDate(selectedValue, minCheckOutDateStr, property.endDate);

    // Ensure check-out is strictly after check-in if check-in is set
    if (checkInDate && validatedCheckOut <= checkInDate) {
      // If user selects a date equal or before check-in, don't update, or reset?
      // Let's prevent setting an invalid date. We could show an error, or just ignore.
      // Silently ignoring might be confusing. Let's enforce minimum based on input element's min attr.
      // The validateDate function already handles the overall range.
      // We just need to ensure checkout > checkin specifically.
       const dayAfterCheckIn = new Date(checkInDate.getTime());
       dayAfterCheckIn.setDate(checkInDate.getDate() + 1);
       if (validatedCheckOut >= dayAfterCheckIn) {
           setCheckOutDate(validatedCheckOut);
       } else {
           // Optionally provide feedback: alert("Check-out date must be after check-in date.");
           // Or automatically set it to the earliest valid date:
           setCheckOutDate(dayAfterCheckIn <= new Date(property.endDate) ? dayAfterCheckIn : null);
       }
    } else {
        setCheckOutDate(validatedCheckOut);
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
    // Note: We are no longer automatically adjusting rooms based on guests.
    // Consider adding a warning if guest count exceeds likely capacity of selected rooms.
  };

  const decrementGuests = () => {
    if (guestCount > 1) {
      setGuestCount(prev => prev - 1);
    }
  };

  // --- Function to handle room quantity changes ---
  const handleRoomQuantityChange = (categoryTitle: string, change: number) => {
    if (!property?.categoryRooms) return;

    const category = property.categoryRooms.find(cat => cat.title === categoryTitle);
    if (!category) return;

    const currentQty = selectedRooms[categoryTitle] || 0;
    const newQty = currentQty + change;

    // Check constraints
    if (newQty < 0) return; // Cannot go below 0
    if (newQty > category.qty) return; // Cannot exceed available quantity

    // Check total room constraint only when increasing
    if (change > 0 && totalSelectedRooms >= MAX_COMBINED_ROOMS) {
      // Optionally show a temporary message/alert
      setBookingError(`You can book a maximum of ${MAX_COMBINED_ROOMS} rooms in total.`);
      setTimeout(() => setBookingError(null), 3000); // Clear error after 3s
      return;
    }

    setSelectedRooms(prev => ({
      ...prev,
      [categoryTitle]: newQty
    }));
    setBookingError(null); // Clear error if adjustment is successful
  };
  // --- End function ---

  const handleBookNowClick = () => {
    if (!isLoaded) return; // Wait for Clerk
    setBookingError(null); // Clear previous errors

    if (!isSignedIn) {
      openSignIn();
      // setLoginRedirectWarning(true);
      return;
    }

    // Validation before showing modal
    if (!checkInDate || !checkOutDate) {
      setBookingError("Please select check-in and check-out dates.");
      return;
    }
     if (days <= 0) {
      setBookingError("Check-out date must be after check-in date.");
      return;
    }
    if (totalSelectedRooms <= 0) {
      setBookingError("Please select at least one room.");
      return;
    }
     if (totalSelectedRooms > MAX_COMBINED_ROOMS) {
      // This should ideally be prevented by the +/- buttons, but double-check
       setBookingError(`You cannot book more than ${MAX_COMBINED_ROOMS} rooms.`);
       return;
    }

    // Pre-fill booking data based on current selections
     setBookingData(prev => ({
        ...prev,
        passengers: guestCount,
        rooms: totalSelectedRooms // Total rooms selected
      }));

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
    if (!property || !checkInDate || !checkOutDate || totalSelectedRooms <= 0) {
        alert("Booking details are incomplete."); // Or use a more sophisticated error display
        return;
    };

    setIsSubmitting(true);
    setBookingError(null); // Clear previous errors

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const selectedRoomDetails = Object.entries(selectedRooms).filter(([_, qty]) => qty > 0)
      .map(([title, qty]) => {
        const category = property.categoryRooms?.find(cat => cat.title === title);
        // Fallback price/currency if category somehow not found (shouldn't happen if state is consistent)
        const price = category ? (category.discountedPrice > 0 ? category.discountedPrice : category.price) : 0;
        const currency = category ? category.currency : property.costing.currency;
        return {
          title: title,
          qty: qty,
          pricePerNight: price, // Price per night for this category
          currency: currency
        };
      });
    // --- End preparing details ---

    try {
        const bookingPayload = {
            type: "property",
            details: {
                id: params?.id,
                title: property.title,
                ownerId: property.userId,
                locationFrom: "NA",
                locationTo: `${property.location.address}, ${property.location.city}, ${property.location.country}`,
                type: property.type
            },
            bookingDetails: {
                checkIn: checkInDate.toISOString(),
                checkOut: checkOutDate.toISOString(),
                guests: guestCount,
                totalRooms: totalSelectedRooms, // Total number of rooms
                roomsDetail: selectedRoomDetails, // Array with details of each selected room category
                pricePerNightBreakdown: totalBookingPricePerNight, // Sum of (price * qty) for selected rooms per night
                currency: property.costing.currency, // Assuming a primary currency for the property total
                numberOfNights: days,
                totalPrice: totalBookingPricePerNight * days, // Final total price
            },
            guestDetails: { // Keep guest details separate
                firstName: bookingData.firstName,
                lastName: bookingData.lastName,
                email: bookingData.email,
                phone: bookingData.phone,
                specialRequests: bookingData.specialRequests
            },
            recipients: [bookingData.email, 'anshulgoyal589@gmail.com'] // Replace with dynamic owner email if needed
        };

        console.log("Booking Payload:", JSON.stringify(bookingPayload, null, 2)); // For debugging

        const response = await fetch('/api/bookings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bookingPayload),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Failed to send booking confirmation' }));
            throw new Error(errorData.message || 'Failed to send booking confirmation');
        }

        setBookingConfirmed(true);
        setShowBookingModal(false);
        // Reset selections after successful booking? Optional.
        // setSelectedRooms({});
        // setCheckInDate(null);
        // setCheckOutDate(null);
        // setGuestCount(1);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error('Error submitting booking:', error);
        setBookingError(`Booking failed: ${error.message}. Please try again.`);
        // Keep modal open if submission fails
    } finally {
        setIsSubmitting(false);
    }
};


  // --- Rendering functions (Rating Stars, Amenity Icons) remain the same ---
   const renderRatingStars = (rating: number) => {
    // ... (keep existing implementation)
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

  const getAmenityIcon = (amenity : PropertyAmenities) => {
    // ... (keep existing implementation)
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
    // ... (keep existing implementation)
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

    return formattedNames[amenity] || amenity; // Fallback to original name
  };

  if (loading) {
    // ... (keep existing loading state)
      return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !property) {
    // ... (keep existing error state)
     return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">
          {error || 'Property not found'}
        </h2>
        {error && <p className="text-gray-600 mb-4">Please check the URL or try again later.</p>}
        <button
          onClick={() => router.push('/properties')}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Go Back to Properties
        </button>
      </div>
    );
  }


  // Calculate paginated reviews (Remains the same)
  const paginatedReviews = property.review
    ? property.review.slice(
        (currentReviewPage - 1) * reviewsPerPage,
        currentReviewPage * reviewsPerPage
      )
    : [];

  const totalReviewPages = property.review
    ? Math.ceil(property.review.length / reviewsPerPage)
    : 0;


  // --- JSX Structure ---
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Hero Section */}
      <div className="relative h-96 md:h-[500px] w-full">
         <Image
            // Use selectedImage or a fallback
           src={selectedImage || property.bannerImage?.url || '/images/placeholder-property.jpg'}
           alt={property.title || 'Property Image'}
           layout="fill"
           objectFit="cover"
           priority
           className="brightness-75"
           onError={() => {
               // If selected image fails, try banner, then placeholder
               if (selectedImage !== property.bannerImage?.url && property.bannerImage?.url) {
                  setSelectedImage(property.bannerImage.url);
               } else if (selectedImage !== '/images/placeholder-property.jpg') {
                  setSelectedImage('/images/placeholder-property.jpg');
               }
           }}
         />
         {/* ... (rest of Hero Section content remains the same) ... */}
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
            {property.totalRating && property.totalRating > 0 && (
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
            {/* ... (Keep existing Property Quick Info, Amenities, Features, Gallery, Description, etc.) ... */}
             {/* Property Quick Info */}
            <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Property Overview</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-center">
                {/* Type */}
                 <div className="flex flex-col items-center">
                   <div className="text-gray-600 text-sm mb-1">Type</div>
                   <div className="font-semibold text-lg text-blue-600 capitalize">{property.type}</div>
                 </div>

                {/* Total Rooms (if categories exist) */}
                {property.categoryRooms && property.categoryRooms.length > 0 && (
                    <div className="flex flex-col items-center">
                    <div className="text-gray-600 text-sm mb-1">Total Rooms</div>
                    <div className="font-extrabold text-2xl text-blue-600">
                        {property.categoryRooms.reduce((sum, cat) => sum + cat.qty, 0)}
                    </div>
                    </div>
                )}

                {/* Property Rating */}
                {property.propertyRating && (
                  <div className="flex flex-col items-center">
                    <div className="text-gray-600 text-sm mb-1">Property Rating</div>
                    <div className="font-extrabold text-2xl text-blue-600">{property.propertyRating.toString()}</div>
                  </div>
                )}

     

              </div>
            </div>

             {/* Amenities & Features Section */}
             {/* ... (Keep existing sections for General Amenities, Facilities, Room Facilities, Accessibility, etc.) ... */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Amenities & Features</h2>

                {/* Main Amenities */}
                {property.amenities && property.amenities.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold mb-3">General Amenities</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {property.amenities.map((amenity, index) => (
                        <div
                          key={`amenity-${index}`}
                          className="flex items-center bg-white p-4 rounded-lg shadow-sm"
                        >
                          <div className="bg-blue-100 p-2 rounded-full mr-3 text-blue-600">
                            {getAmenityIcon(amenity as PropertyAmenities) || (
                               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                            )}
                          </div>
                          <span>{formatAmenityName(amenity as PropertyAmenities)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                                {/* Facilities */}
                                {property.facilities && property.facilities.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold mb-3">Facilities</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {property.facilities.map((facility, index) => (
                        <div
                          key={index}
                          className="flex items-center bg-white p-4 rounded-lg shadow-sm"
                        >
                          <div className="bg-green-100 p-2 rounded-full mr-3 text-green-600">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span>{facility}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Room Facilities */}
                {property.roomFacilities && property.roomFacilities.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold mb-3">Room Facilities</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {property.roomFacilities.map((facility, index) => (
                        <div
                          key={index}
                          className="flex items-center bg-white p-4 rounded-lg shadow-sm"
                        >
                          <div className="bg-purple-100 p-2 rounded-full mr-3 text-purple-600">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                            </svg>
                          </div>
                          <span>{facility}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Accessibility Features */}
                {property.accessibility && property.accessibility.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold mb-3">Accessibility</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {property.accessibility.map((feature, index) => (
                        <div
                          key={index}
                          className="flex items-center bg-white p-4 rounded-lg shadow-sm"
                        >
                          <div className="bg-blue-100 p-2 rounded-full mr-3 text-blue-600">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12zm-1-5a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1zm0-3a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Room Accessibility */}
                {property.roomAccessibility && property.roomAccessibility.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold mb-3">Room Accessibility</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {property.roomAccessibility.map((feature, index) => (
                        <div
                          key={index}
                          className="flex items-center bg-white p-4 rounded-lg shadow-sm"
                        >
                          <div className="bg-indigo-100 p-2 rounded-full mr-3 text-indigo-600">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                            </svg>
                          </div>
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                 {/* ... other feature sections ... */}
                  {/* Fun Things To Do */}
                {property.funThingsToDo && property.funThingsToDo.length > 0 && (
                    <div className="mb-8 bg-white p-6 rounded-lg shadow-lg">
                    <h2 className="text-2xl font-bold mb-4">Fun Things To Do</h2>
                    <ul className="list-disc pl-5 space-y-2">
                        {property.funThingsToDo.map((activity, index) => (
                        <li key={`fun-${index}`} className="text-gray-700">{activity}</li>
                        ))}
                    </ul>
                    </div>
                )}

                {/* Meals & Dining */}
                {property.meals && property.meals.length > 0 && (
                    <div className="mb-8 bg-white p-6 rounded-lg shadow-lg">
                    <h2 className="text-2xl font-bold mb-4">Meals & Dining</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {property.meals.map((meal, index) => (
                        <div
                            key={`meal-${index}`}
                            className="flex items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100"
                        >
                            <div className="bg-yellow-100 p-2 rounded-full mr-3 text-yellow-600">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" />
                            </svg>
                            </div>
                            <span>{meal}</span>
                        </div>
                        ))}
                    </div>
                    </div>
                )}

                {property.bedPreference && property.bedPreference.length > 0 && (
                <div className="mb-8 bg-white p-6 rounded-lg shadow-lg">
                  <h2 className="text-2xl font-bold mb-4">Bed Options</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {property.bedPreference.map((preference, index) => (
                      <div
                        key={index}
                        className="flex items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100"
                      >
                        <div className="bg-pink-100 p-2 rounded-full mr-3 text-pink-600">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2V5zm0 8a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H7a2 2 0 01-2-2v-2zm12-8a1 1 0 00-1 1v6a1 1 0 001 1 1 1 0 100-2V7a1 1 0 000-2z" />
                          </svg>
                        </div>
                        <span>{preference}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reservation Policy */}
              {property.reservationPolicy && property.reservationPolicy.length > 0 && (
                <div className="mb-8 bg-white p-6 rounded-lg shadow-lg">
                  <h2 className="text-2xl font-bold mb-4">Reservation Policy</h2>
                  <ul className="list-disc pl-5 space-y-2">
                    {property.reservationPolicy.map((policy, index) => (
                      <li key={index} className="text-gray-700">{policy}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Popular Filters */}
              {property.popularFilters && property.popularFilters.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold mb-4">Popular Features</h2>
                  <div className="flex flex-wrap gap-2">
                    {property.popularFilters.map((filter, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        {filter}
                      </span>
                    ))}
                  </div>
                </div>
              )}
                 {/* ... other sections like Bed Options, Policy, Filters ... */}
            </div>


            {/* Property Gallery */}
            {/* ... (Keep existing Gallery logic) ... */}
             {property.detailImages && property.detailImages.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Gallery</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {property.bannerImage && (
                    <div
                      className={`relative aspect-square cursor-pointer rounded-lg overflow-hidden ${
                        selectedImage === property.bannerImage.url
                          ? 'ring-2 ring-offset-2 ring-blue-600'
                          : ''
                      }`}
                      onClick={() => handleImageClick(property.bannerImage!.url)}
                    >
                      <Image
                        src={property.bannerImage.url}
                        alt={property.bannerImage.alt || "Property Banner"}
                        layout="fill"
                        objectFit="cover"
                         onError={(e) => e.currentTarget.src = '/images/placeholder-property.jpg'} // Fallback on error
                      />
                    </div>
                  )}
                  {/* Limit gallery preview */}
                  {property.detailImages.slice(0, property.bannerImage ? 7 : 8).map((image, index) => (
                    <div
                      key={index}
                      className={`relative aspect-square cursor-pointer rounded-lg overflow-hidden ${
                        selectedImage === image.url ? 'ring-2 ring-offset-2 ring-blue-600' : ''
                      }`}
                      onClick={() => handleImageClick(image.url)}
                    >
                      <Image
                        src={image.url}
                        alt={image.alt || `Property image ${index + 1}`}
                        layout="fill"
                        objectFit="cover"
                        onError={(e) => e.currentTarget.src = '/images/placeholder-property.jpg'} // Fallback on error
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}


            {/* Property Description */}
            {/* ... (Keep existing Description) ... */}
             <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">About This Property</h2>
              <div className="prose max-w-none text-gray-700">
                <p>{property.description || "No description available."}</p>
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
                        {getAmenityIcon(amenity as PropertyAmenities)}
                      </div>
                      <span>{formatAmenityName(amenity as PropertyAmenities)}</span>
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
               {/* Display Base Price Info (Optional) */}
               {property.costing && (
                   <div className="mb-4 pb-4 border-b border-gray-200">
                       <span className="text-sm text-gray-600">Starting from</span>
                       <div className="flex items-baseline mt-1">
                           <span className="text-2xl font-bold text-blue-600">
                               {property.costing.currency}{' '}
                               {property.costing.discountedPrice > 0
                                   ? property.costing.discountedPrice.toLocaleString()
                                   : property.costing.price.toLocaleString()}
                           </span>
                           <span className="text-sm text-gray-600 ml-1">per night</span>
                           {property.costing.discountedPrice > 0 && property.costing.price > property.costing.discountedPrice && (
                              <span className="ml-2 line-through text-gray-500 text-sm">
                                {property.costing.currency} {property.costing.price.toLocaleString()}
                              </span>
                            )}
                       </div>
                       {/* You might want to clarify this is the base price */}
                       <p className="text-xs text-gray-500 mt-1">Select rooms below to see final price.</p>
                   </div>
               )}

              {/* Booking Form */}
              <div className="mb-6">
                {/* Date Pickers */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Check-in</label>
                    <input
                      type="date"
                      value={checkInDate ? checkInDate.toISOString().split('T')[0] : ''}
                      onChange={handleCheckInChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                      min={new Date(property.startDate).toISOString().split('T')[0]}
                      max={new Date(property.endDate).toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Check-out</label>
                    <input
                      type="date"
                      value={checkOutDate ? checkOutDate.toISOString().split('T')[0] : ''}
                      onChange={handleCheckOutChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                      min={
                        checkInDate
                          ? new Date(checkInDate.getTime() + 86400000).toISOString().split('T')[0] // Day after check-in
                          : new Date(property.startDate).toISOString().split('T')[0]
                      }
                      max={new Date(property.endDate).toISOString().split('T')[0]}
                      required
                      disabled={!checkInDate} // Disable until check-in is selected
                    />
                  </div>
                </div>

                {/* Guest Counter */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Guests
                  </label>
                  <div className="flex items-center border border-gray-300 rounded-md">
                    <button
                      type="button"
                      onClick={decrementGuests}
                      disabled={guestCount <= 1}
                      className="px-3 py-2 text-blue-600 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                    </button>
                    <div className="flex-1 text-center text-sm">
                      <span className="font-medium">{guestCount}</span>
                      <span className="text-gray-500 ml-1">
                        {guestCount === 1 ? 'guest' : 'guests'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={incrementGuests}
                      // Add a sensible upper limit if needed, e.g., max capacity
                      disabled={guestCount >= (property.rooms * 3)} // Old logic based on total rooms
                      className="px-3 py-2 text-blue-600 disabled:text-gray-400"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                    </button>
                  </div>
                </div>

                {/* --- Room Category Selection --- */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Rooms (Max {MAX_COMBINED_ROOMS} total)
                    </label>
                    {property.categoryRooms && property.categoryRooms.length > 0 ? (
                        <div className="space-y-3">
                            {property.categoryRooms.map((cat) => {
                                const selectedQty = selectedRooms[cat.title] || 0;
                                const canIncrement = totalSelectedRooms < MAX_COMBINED_ROOMS && selectedQty < cat.qty;
                                const price = cat.discountedPrice > 0 ? cat.discountedPrice : cat.price;

                                return (
                                    <div key={cat.title} className="p-3 border border-gray-200 rounded-md bg-gray-50">
                                       <div className="flex justify-between items-start mb-1">
                                            <div>
                                                <p className="font-medium text-sm">{cat.title}</p>
                                                <p className="text-xs text-gray-600">
                                                    {cat.currency} {price.toLocaleString()} / night
                                                    {cat.discountedPrice > 0 && cat.price > cat.discountedPrice && (
                                                        <span className="ml-1 line-through text-gray-500">
                                                            {cat.currency} {cat.price.toLocaleString()}
                                                        </span>
                                                    )}
                                                </p>
                                                 <p className="text-xs text-gray-500">{cat.qty} available</p>
                                            </div>
                                             <div className="flex items-center border border-gray-300 rounded-md bg-white">
                                                <button
                                                type="button"
                                                onClick={() => handleRoomQuantityChange(cat.title, -1)}
                                                disabled={selectedQty <= 0}
                                                className="px-2 py-1 text-blue-600 disabled:text-gray-300 disabled:cursor-not-allowed"
                                                aria-label={`Decrease quantity of ${cat.title}`}
                                                >
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                                                </button>
                                                <div className="px-3 text-sm font-medium min-w-[30px] text-center">{selectedQty}</div>
                                                <button
                                                type="button"
                                                onClick={() => handleRoomQuantityChange(cat.title, 1)}
                                                disabled={!canIncrement}
                                                className="px-2 py-1 text-blue-600 disabled:text-gray-300 disabled:cursor-not-allowed"
                                                aria-label={`Increase quantity of ${cat.title}`}
                                                >
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                                                </button>
                                            </div>
                                       </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 italic">No specific room types available for selection.</p>
                        // Decide if booking should be possible without categories. If not, disable Book Now button.
                    )}
                     {/* Display total selected rooms */}
                    <div className="mt-3 text-sm text-right">
                         Total Selected Rooms: <span className="font-semibold">{totalSelectedRooms}</span> / {MAX_COMBINED_ROOMS}
                    </div>
                </div>
                {/* --- End Room Category Selection --- */}

              </div>

              {/* Price Calculation */}
              {checkInDate && checkOutDate && days > 0 && totalSelectedRooms > 0 && (
                <div className="border-t border-gray-200 pt-4 mb-6 space-y-2">
                    {/* Breakdown per night */}
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-700">{property.costing.currency} {totalBookingPricePerNight.toLocaleString()} x {days} {days === 1 ? 'night' : 'nights'}</span>
                        <span className="text-gray-900">{property.costing.currency} {(totalBookingPricePerNight * days).toLocaleString()}</span>
                    </div>
                     {/* Optional: Add lines for taxes or fees if applicable */}
                    {/* <div className="flex justify-between text-sm">
                        <span className="text-gray-700">Taxes & Fees</span>
                        <span className="text-gray-900">{property.costing.currency} ...</span>
                    </div> */}
                  <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200 mt-2">
                    <span>Total</span>
                    <span>
                      {property.costing.currency} {(totalBookingPricePerNight * days).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Booking Error Message */}
               {bookingError && (
                   <div className="my-3 p-3 bg-red-100 text-red-700 text-sm rounded-md">
                       {bookingError}
                   </div>
               )}

              <button
                onClick={handleBookNowClick}
                disabled={!checkInDate || !checkOutDate || days <= 0 || totalSelectedRooms <= 0 || totalSelectedRooms > MAX_COMBINED_ROOMS || !(property.categoryRooms && property.categoryRooms.length > 0)} // Disable if no categories defined or basic conditions not met
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Book Now
              </button>

              <p className="text-sm text-gray-500 text-center mt-2">
                You won&apso;t be charged yet
              </p>
            </div>
          </div>
        </div>
         {/* DummyReviews Component - Assuming it exists and is used */}
        <DummyReviews/>
      </div>

      {/* --- Booking Modal --- */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-4 pb-3 border-b">
              <h3 className="text-xl font-bold">Complete Your Booking</h3>
              <button
                onClick={() => setShowBookingModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Booking Summary */}
            <div className="mb-6">
              <div className="flex items-center mb-4">
                 {property.bannerImage && (
                    <div className="relative h-16 w-24 mr-3 rounded-md overflow-hidden flex-shrink-0">
                      <Image src={property.bannerImage.url} alt={property.title || ""} layout="fill" objectFit="cover" />
                    </div>
                  )}
                  <div>
                      <h4 className="font-semibold">{property.title}</h4>
                      <p className="text-sm text-gray-600">{property.location.city}, {property.location.country}</p>
                      {property.totalRating && property.totalRating > 0 && (
                         <div className="flex items-center mt-1">
                           {renderRatingStars(property.totalRating)}
                           <span className="text-xs ml-1 text-gray-600">({property.totalRating.toFixed(1)})</span>
                         </div>
                      )}
                  </div>
              </div>

              {/* Dates, Guests, Rooms Summary */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4 p-4 bg-gray-50 rounded-lg text-sm">
                <div>
                  <div className="text-xs text-gray-600">Check-in</div>
                  <div className="font-medium">
                    {checkInDate?.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600">Check-out</div>
                  <div className="font-medium">
                    {checkOutDate?.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600">Duration</div>
                  <div className="font-medium">{days} {days === 1 ? 'night' : 'nights'}</div>
                </div>
                 <div>
                  <div className="text-xs text-gray-600">Guests</div>
                  <div className="font-medium">{guestCount} {guestCount === 1 ? 'guest' : 'guests'}</div>
                </div>
              </div>

                {/* --- Selected Rooms Breakdown --- */}
                <div className="mb-4 p-4 border border-gray-200 rounded-lg">
                    <h5 className="text-sm font-semibold mb-2">Selected Rooms ({totalSelectedRooms} total)</h5>
                    <div className="space-y-1">
                     {/* eslint-disable-next-line @typescript-eslint/no-unused-vars */}
                        {Object.entries(selectedRooms).filter(([_, qty]) => qty > 0)
                            .map(([title, qty]) => {
                                const category = property.categoryRooms?.find(cat => cat.title === title);
                                const price = category ? (category.discountedPrice > 0 ? category.discountedPrice : category.price) : 0;
                                const currency = category ? category.currency : property.costing.currency;
                                return (
                                    <div key={title} className="flex justify-between items-center text-sm">
                                        <span>{qty} x {title}</span>
                                        <span className="text-gray-700">{currency} {(price * qty).toLocaleString()} / night</span>
                                    </div>
                                );
                         })}
                    </div>
                     <div className="flex justify-between font-semibold text-sm pt-2 border-t mt-2">
                         <span>Total per night</span>
                         <span>{property.costing.currency} {totalBookingPricePerNight.toLocaleString()}</span>
                    </div>
                </div>
                {/* --- End Selected Rooms Breakdown --- */}


              {/* Total Price Summary */}
              <div className="flex justify-between font-bold text-lg p-4 bg-blue-50 rounded-lg">
                 <span>Total Price</span>
                 <span>{property.costing.currency} {(totalBookingPricePerNight * days).toLocaleString()}</span>
              </div>
            </div>

            {/* Guest Details Form */}
            <form onSubmit={handleBookingSubmit}>
              <h4 className="text-md font-semibold mb-3">Your Information</h4>
              {/* ... (Keep existing form fields: First Name, Last Name, Email, Phone, Special Requests) ... */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="firstName">
                        First Name
                    </label>
                    <input
                        id="firstName"
                        type="text"
                        name="firstName"
                        value={bookingData.firstName}
                        onChange={handleInputChange}
                        required
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                    </div>
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="lastName">
                        Last Name
                    </label>
                    <input
                        id="lastName"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
                    Email
                    </label>
                    <input
                    id="email"
                    type="email"
                    name="email"
                    value={bookingData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="phone">
                    Phone Number
                    </label>
                    <input
                    id="phone"
                    type="tel"
                    name="phone"
                    value={bookingData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                 <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="specialRequests">
                    Special Requests (Optional)
                    </label>
                    <textarea
                    id="specialRequests"
                    name="specialRequests"
                    value={bookingData.specialRequests}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., late check-in, dietary needs"
                    ></textarea>
                </div>

              {/* Display Booking Error in Modal */}
              {bookingError && (
                <div className="my-4 p-3 bg-red-100 text-red-700 text-sm rounded-md">
                  {bookingError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400 disabled:cursor-wait"
              >
                 {/* ... (Keep existing submitting indicator) ... */}
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
      {/* --- End Booking Modal --- */}

      {/* Booking Confirmation Modal */}
      {/* ... (Keep existing Booking Confirmation Modal) ... */}
      {bookingConfirmed && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]"> {/* Higher z-index */}
          <div className="bg-white rounded-lg max-w-md w-full p-6 text-center">
             {/* ... confirmation content ... */}
             <div className="mb-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-bold mb-2">Booking Confirmed!</h3>
            <p className="mb-6 text-gray-600">
              Your booking for {property.title} has been confirmed. A confirmation email has been sent to {bookingData.email}.
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

    </div> // End Main Container
  );
}