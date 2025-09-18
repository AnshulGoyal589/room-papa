'use client'

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
    MapPin, 
    Calendar, 
    Bookmark, 
    Heart,
    BedDouble, 
    Sparkles, 
    Plane, 
    Train, 
    Car as CarIcon, 
    Star as StarIcon, // Explicitly import StarIcon
    ThumbsUp,        // For "Very good" rating indicator
    Check,           // For reservation policies
    ChevronRight     // For "See availability" button
} from 'lucide-react';
import { Property } from '@/lib/mongodb/models/Property'; 
import { Trip } from '@/lib/mongodb/models/Trip';
import { Travelling } from '@/lib/mongodb/models/Travelling'; 
import { Review } from '@/lib/mongodb/models/Components';
// import { StoredRoomCategory } from '@/types/booking'; // Assuming this type is available

// Define TransportationType as an enum
export enum TransportationType {
  flight = 'flight',
  train = 'train', 
  bus = 'bus',
  car = 'car',
  boat = 'boat',
  other = 'other',
}

// Helper to get rating description
const getRatingDescription = (rating?: number): { text: string; className: string } => {
  if (rating === undefined || rating === null) return { text: "No rating", className: "text-gray-600" };
  if (rating >= 9.5) return { text: "Exceptional", className: "text-green-700" };
  if (rating >= 9.0) return { text: "Superb", className: "text-green-600" };
  if (rating >= 8.5) return { text: "Fabulous", className: "text-[#001d2c]" };
  if (rating >= 8.0) return { text: "Very Good", className: "text-[#001d2c]" };
  if (rating >= 7.0) return { text: "Good", className: "text-teal-600" };
  if (rating >= 6.0) return { text: "Pleasant", className: "text-orange-600" };
  return { text: "Review score", className: "text-gray-700" };
};

// Helper to format review count
const formatReviewCount = (reviews?: Array<Review>): string => {
  const count = reviews?.length || 0;
  if (count === 0) return "No reviews yet";
  return `${count} review${count === 1 ? '' : 's'}`;
};

// Define Sort Tabs Configuration
const sortTabsConfig: Array<{ key: string; label: string; sortByValue: string; sortOrderValue: string; forCategories?: string[] }> = [
  { key: 'recommended_desc', label: 'Our Top Picks', sortByValue: 'recommended', sortOrderValue: 'desc' },
  { key: 'price_asc', label: 'Price (lowest first)', sortByValue: 'price', sortOrderValue: 'asc' },
  { key: 'rating_desc', label: 'Rating (highest first)', sortByValue: 'rating', sortOrderValue: 'desc', forCategories: ['property', 'trip'] },
];

// Helper to calculate nights
const calculateNights = (checkInStr?: string | null, checkOutStr?: string | null): number => {
  if (!checkInStr || !checkOutStr) return 1; 
  try {
    const checkInDate = new Date(checkInStr);
    const checkOutDate = new Date(checkOutStr);
    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime()) || checkOutDate <= checkInDate) {
      return 1; 
    }
    const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return 1;
  }
};


export default function SearchResults() {
  const router = useRouter();
  const currentSearchParams = useSearchParams();
  const [results, setResults] = useState<Array<Property | Trip | Travelling>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [category, setCategory] = useState<string>('property');
  // const [filterChips, setFilterChips] = useState<Array<{key: string, value: string}>>([]);
  const [activeSortKey, setActiveSortKey] = useState<string>('recommended_desc');

  useEffect(() => {
    const params: { [key: string]: string } = {};
    currentSearchParams?.forEach((value, key) => {
      params[key] = value;
    });

    setCurrentPage(parseInt(params.page || '1'));
    const currentCategory = params.category || 'property';
    setCategory(currentCategory);
    
    const chips: Array<{key: string, value: string}> = [];
    Object.entries(params).forEach(([key, value]) => {
      if (key !== 'page' && key !== 'sortBy' && key !== 'sortOrder' && key !== 'category' && value) {
        chips.push({ key, value });
      }
    });
    const currentSortBy = params.sortBy;
    const currentSortOrder = params.sortOrder;
    if (currentSortBy) {
      setActiveSortKey(`${currentSortBy}_${currentSortOrder || 'desc'}`);
    } else {
      const defaultSortTab = sortTabsConfig.find(tab => tab.sortByValue === 'recommended');
      setActiveSortKey(defaultSortTab ? defaultSortTab.key : 'recommended_desc');
    }

  }, [currentSearchParams]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const params = new URLSearchParams(currentSearchParams?.toString() || '');
      if (!params.has('category')) {
        params.set('category', category); 
      }
      if (!params.has('page')) {
        params.set('page', currentPage.toString()); 
      }
      
      const activeSortOption = sortTabsConfig.find(tab => tab.key === activeSortKey);
      if (activeSortOption) {
        if(!params.has('sortBy') && activeSortOption.sortByValue !== 'recommended') { 
            params.set('sortBy', activeSortOption.sortByValue);
            params.set('sortOrder', activeSortOption.sortOrderValue);
        } 
      }
      
      try {
        const response = await fetch(`/api/search?${params.toString()}`);
        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }
        const data = await response.json();
        console.log('Search results:', data);
        // storingFrames(data.results.googleMaps);
        setResults(data.results || []); 
        setTotalResults(data.total || 0);
        setTotalPages(Math.ceil((data.total || 0) / (data.limit || 10)));
      } catch (error) {
        console.error('Error fetching search results:', error);
        setResults([]);
        setTotalResults(0);
        setTotalPages(0);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [currentSearchParams, category, currentPage, activeSortKey]); 

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    
    const params = new URLSearchParams(currentSearchParams?.toString() || '');
    params.set('page', page.toString());
    router.push(`/search?${params.toString()}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // const handleRemoveFilter = (chipKey: string) => {
  //   const params = new URLSearchParams(currentSearchParams?.toString() || '');
  //   params.delete(chipKey);
  //   params.set('page', '1'); 
  //   router.push(`/search?${params.toString()}`, { scroll: false });
  // };

  // const formatChipLabel = (key: string, value: string): string => {
  //   switch (key) {
  //       case 'minPrice': return `Min Price: ${Number(value).toLocaleString()}`;
  //       case 'maxPrice': 
  //           return Number(value) > 200000 ? `Max Price: ${Number(200000).toLocaleString()}+` : `Max Price: ${Number(value).toLocaleString()}`;
  //       case 'rooms': return `${value} Room${parseInt(value) > 1 ? 's' : ''}`;
  //       case 'city': return `City: ${value}`;
  //       case 'country': return `Country: ${value}`;
  //       case 'checkIn': return `Check-in: ${new Date(value).toLocaleDateString()}`;
  //       case 'checkOut': return `Check-out: ${new Date(value).toLocaleDateString()}`;
  //       case 'adults': return `${value} Adult${parseInt(value) > 1 ? 's' : ''}`;
  //       case 'children': return `${value} Child${parseInt(value) > 1 ? 'ren' : ''}`;
  //       case 'pets': return value === 'true' ? 'Pets Allowed' : 'No Pets';
  //       case 'title': return `Keyword: ${value}`;
  //       case 'propertyType': return `Type: ${value}`;
  //       case 'propertyRating': return `Rating: ${value}+ Stars`;
  //       default:
  //         const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  //         if (value.includes(',')) {
  //           const values = value.split(',');
  //           if (values.length > 2) return `${formattedKey}: ${values.slice(0, 2).join(', ')} +${values.length - 2} more`;
  //           return `${formattedKey}: ${values.join(', ')}`;
  //         }
  //         return `${formattedKey}: ${value}`;
  //     }
  // };

  const renderPropertyCard = (property: Property) => {
    const ratingDesc = getRatingDescription(property.totalRating || property.propertyRating); // Use totalRating if available
    const reviewText = formatReviewCount(Array.isArray(property.review) ? property.review : property.review ? [property.review] : []);
    
    const checkInQuery = localStorage.getItem('checkIn');
    const checkOutQuery = localStorage.getItem('checkOut');
    const adultsQuery = localStorage.getItem('adults') || '1';
    const childrenQuery = localStorage.getItem('children') || '0';

    const numNights = calculateNights(checkInQuery, checkOutQuery);

    let guestSummary = `${numNights} night${numNights === 1 ? '' : 's'}`;
    if (adultsQuery) guestSummary += `, ${adultsQuery} adult${parseInt(adultsQuery) === 1 ? '' : 's'}`;
    if (childrenQuery && parseInt(childrenQuery) > 0) guestSummary += `, ${childrenQuery} child${parseInt(childrenQuery) === 1 ? '' : 'ren'}`;

    // Attempt to get a representative room type
    const representativeRoom = property.categoryRooms && property.categoryRooms.length > 0 ? property.categoryRooms[0] : null;
    const roomTypeTitle = representativeRoom?.title || "Standard Room"; // Fallback
    const bedConfiguration = representativeRoom?.bedConfiguration || "Comfortable bedding"; // Fallback
    // console.log(property.reservationPolicy);
    const hasFreeCancellation = property.reservationPolicy?.includes("Free Cancellation");
    const hasNoPrepayment = property.reservationPolicy?.includes("No prepayment needed") || property.reservationPolicy?.includes("Pay at Property");

    // For "Recommended for your group" badge - simple logic for demonstration
    // const isRecommendedForGroup = parseInt(adultsQuery) > 1 || (property.amenities?.includes("Family rooms"));

    const currencySymbol = property.costing?.currency === 'INR' ? '₹' : (property.costing?.currency || '$');
    
    // Taxes: This is a placeholder. Ideally, this comes pre-calculated from backend.
    // For demonstration, if property.costing.price and discountedPrice are per night for the group already:
    const taxesAndCharges = property.costing ? (property.costing.price * 0.1) : 0; // Example 10% of base price

    return (
    <div 
      key={property._id?.toString()} 
      className="flex flex-col sm:flex-row border border-gray-300 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 bg-white group"
    >
      {/* Image Column */}
      <div className="w-full sm:w-[240px] md:w-[260px] lg:w-[280px] h-52 sm:h-auto relative">
        <Link href={`/property/${property._id}?checkIn=${checkInQuery || ''}&checkOut=${checkOutQuery || ''}&adults=${adultsQuery}&children=${childrenQuery}`} className="block w-full h-full">
            {property.bannerImage?.url ? (
            <Image 
                src={property.bannerImage.url} 
                alt={property.title || "Property image"}
                fill
                sizes="(max-width: 640px) 100vw, 280px"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <BedDouble size={48} className="text-gray-400" />
            </div>
            )}
        </Link>
        <button 
            className="absolute top-3 right-3 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors"
            // onClick={(e) => {e.stopPropagation(); alert("Add to wishlist clicked!");}} // Placeholder action
        >
          <Heart size={20} className="text-red-500" />
        </button>
      </div>
      
      {/* Middle Content Column */}
      <div className="flex-grow p-4 flex flex-col">
        <div className="flex justify-between items-start">
            <Link href={`/property/${property._id}?checkIn=${checkInQuery || ''}&checkOut=${checkOutQuery || ''}&adults=${adultsQuery}&children=${childrenQuery}`} className="block mb-1">
                <h3 className="text-xl md:text-2xl font-bold text-[#001d2c] hover:text-[#001d2c] transition-colors line-clamp-2">{property.title || "Untitled Property"}</h3>
            </Link>
            {/* Rating for very small screens, hidden on sm+ */}
            {(property.totalRating || property.propertyRating) && (
              <div className="sm:hidden flex flex-col items-end ml-2">
                <div className={`text-xs font-semibold ${ratingDesc.className}`}>{ratingDesc.text}</div>
                <div className="bg-[#001d2c] text-white text-sm font-bold px-2 py-0.5 rounded">
                    {(property.totalRating || property.propertyRating)?.toFixed(1)}
                </div>
              </div>
            )}
        </div>

        <div className="flex items-center mb-2 text-sm">
            {Array(5).fill(0).map((_, i) => (
                <StarIcon key={i} size={16} className={`mr-0.5 ${ (property.propertyRating || 0) >= i + 0.5 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
            ))}
            {(property.propertyRating || 0) >= 4 && <ThumbsUp size={16} className="ml-1 text-yellow-500" />}
        </div>

        <div className="text-xs text-gray-600 mb-2">
            <span className="text-[#001d2c] hover:underline">{property.location?.city}</span>
            <span className="mx-1 text-gray-400">•</span>
            <span className="text-[#001d2c] hover:underline">Show on map</span>
            {/* Add distance from centre if available: e.g. <span className="mx-1 text-gray-400">•</span>12.8 km from centre */}
        </div>

        {/* {isRecommendedForGroup && ( */}
            <div className="inline-block bg-gray-100 border border-gray-300 text-gray-700 text-xs font-medium px-2 py-1 rounded-sm mb-3 self-start">
                Recommended for you
            </div>
        {/* )} */}
        
        <div className="text-sm text-gray-800 mb-1">
            <span className="font-semibold">{roomTypeTitle}</span>
        </div>
        <div className="text-sm text-gray-600 mb-2">
            {bedConfiguration}
        </div>

        {hasFreeCancellation && (
            <div className="flex items-center text-green-600 text-sm mb-1">
                <Check size={18} className="mr-1.5" />
                <span>Free cancellation</span>
            </div>
        )}
        {hasNoPrepayment && (
            <div className="flex items-center text-green-600 text-sm">
                <Check size={18} className="mr-1.5" />
                <span>No prepayment needed <span className="text-gray-500">– pay at the property</span></span>
            </div>
        )}
        
        {/* Spacer to push button to bottom if policies are few */}
        <div className="flex-grow"></div> 

      </div>

      {/* Right Price/Button Column */}
      <div className='w-full sm:w-auto sm:min-w-[200px] md:min-w-[220px] lg:min-w-[240px] p-4 flex flex-col justify-between items-center sm:items-end border-t sm:border-t-0 sm:border-l border-gray-200/80 bg-gray-50/30 sm:bg-transparent'>
        <div className="w-full text-center sm:text-right mb-3 sm:mb-0">
          {(property.totalRating || property.propertyRating) && (
            <div className="hidden sm:flex items-center justify-end gap-2 mb-1">
              <div className="text-right">
                <p className={`text-sm font-semibold ${ratingDesc.className}`}>{ratingDesc.text}</p>
                <p className="text-xs text-gray-500">{reviewText}</p>
              </div>
              <div className="bg-[#001d2c] text-white text-base font-bold px-2 py-1 rounded h-fit">
                {(property.totalRating || property.propertyRating)?.toFixed(1)}
              </div>
            </div>
          )}
        </div>
        
        <div className="w-full text-center sm:text-right">
          <p className="text-xs text-gray-500 mb-0.5">{guestSummary}</p>
          {property.categoryRooms && property.categoryRooms.length > 0 && property.categoryRooms[0]?.pricing?.discountedDoubleOccupancyAdultPrice?.noMeal !== undefined && (
            <>
              <span className="text-2xl font-bold text-gray-800">
                {/* {currencySymbol}{(property.costing.discountedPrice* numNights).toLocaleString(undefined, {minimumFractionDigits:0, maximumFractionDigits:0})} */}
                {currencySymbol}
                {(property.categoryRooms[0].pricing.discountedDoubleOccupancyAdultPrice.noMeal ).toLocaleString(undefined, {minimumFractionDigits:0, maximumFractionDigits:0})}
              </span>
              { taxesAndCharges > 0 && (
                <p className="text-xs text-gray-500">
                  +{currencySymbol}{(taxesAndCharges * numNights).toLocaleString(undefined, {minimumFractionDigits:0, maximumFractionDigits:0})} taxes and charges
                </p>
              )}
            </>
          )}
           <Link 
            href={`/property/${property._id}?checkIn=${checkInQuery || ''}&checkOut=${checkOutQuery || ''}&adults=${adultsQuery}&children=${childrenQuery}`} 
            className="mt-2.5 block bg-[#001d2c] hover:bg-[#001d2c] text-white font-semibold py-2.5 px-4 rounded-md text-sm transition-colors w-full flex items-center justify-center"
          >
            See availability
            <ChevronRight size={18} className="ml-1" />
          </Link>
        </div>
      </div>
    </div>
    );
  };
  
  const renderTripCard = (trip: Trip) => {
    const ratingDesc = getRatingDescription(trip.rating);
    const reviewText = formatReviewCount(Array.isArray(trip.review) ? trip.review : trip.review ? [trip.review] : []);
    const placeholderImage = '/placeholder-trip.jpg';

    return (
      <div 
        key={trip._id?.toString()} 
        className="flex flex-col sm:flex-row border border-gray-300 rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 bg-white group"
      >
        <div className="w-full sm:w-1/3 md:w-[250px] lg:w-[280px] h-48 sm:h-auto relative cursor-pointer" onClick={() => router.push(`/customer/trip/${trip._id}`)}>
          <Image 
            src={trip.bannerImage?.url || placeholderImage} 
            alt={trip.title || "Trip image"}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 33vw, 280px"
            className="object-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = placeholderImage; }}
          />
           <button className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-black bg-opacity-40 hover:bg-opacity-60 p-1.5 sm:p-2 rounded-full transition-colors">
            <Heart size={18} className="text-white sm:w-5 sm:h-5" />
          </button>
        </div>

        <div className="w-full sm:w-2/3 md:flex-grow p-3 sm:p-4 flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-1">
                <Link href={`/customer/trip/${trip._id}`} className="block">
                  <h3 className="text-lg sm:text-xl font-bold text-[#001d2c] hover:text-[#001d2c] transition-colors line-clamp-2">{trip.title || "Adventure Awaits"}</h3>
                </Link>
                {trip.rating !== undefined && trip.rating !== null && (
                  <div className="flex items-center gap-2 mt-1 sm:mt-0 sm:ml-4 flex-shrink-0">
                    <div className="text-right">
                      <p className={`text-xs sm:text-sm font-semibold ${ratingDesc.className}`}>{ratingDesc.text}</p>
                      <p className="text-xs text-gray-500">{reviewText}</p>
                    </div>
                    <div className="bg-[#001d2c] text-white text-sm sm:text-base font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md h-fit">
                      {trip.rating.toFixed(1)}
                    </div>
                  </div>
                )}
            </div>

          <div className="flex items-center text-xs text-[#001d2c] hover:underline mb-1 sm:mb-2 cursor-pointer" onClick={() => router.push(`/customer/trip/${trip._id}`)}>
            <MapPin size={12} className="mr-1 sm:mr-1.5" />
            <span>{trip.destination?.city}, {trip.destination?.country}</span>
          </div>
          
          <div className="flex items-center text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">
            <Calendar size={14} className="mr-1 sm:mr-1.5 text-gray-500" />
            <span>{new Date(trip.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(trip.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>

          {trip.activities && trip.activities.length > 0 && (
            <div className="flex items-center text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
              <Sparkles size={14} className="mr-1 sm:mr-1.5 text-yellow-500" />
              <span>{trip.activities.length} Activit{trip.activities.length === 1 ? 'y' : 'ies'} included</span>
            </div>
          )}
          
          <p className="text-xs sm:text-sm text-gray-700 mb-2 sm:mb-3 line-clamp-2 md:line-clamp-3 flex-grow">
            {trip.description || "Discover amazing places and experiences on this trip."}
          </p>

          <div className="mt-auto pt-1 sm:pt-2 text-center sm:text-right">
            {trip.costing && (
              <div className="mb-1 sm:mb-0">
                {trip.costing.price > trip.costing.discountedPrice && (
                    <span className="text-xs sm:text-sm text-gray-500 line-through mr-1 sm:mr-2">
                        {trip.costing.currency} {trip.costing.price.toFixed(2)}
                    </span>
                )}
                <span className="text-lg sm:text-2xl font-bold text-gray-800">
                  {trip.costing.currency} {trip.costing.discountedPrice.toFixed(2)}
                </span>
                <p className="text-xs text-gray-500">total per person</p>
              </div>
            )}
            <Link 
              href={`/customer/trip/${trip._id}`} 
              className="mt-2 inline-block bg-[#001d2c] hover:bg-[#001d2c] text-white font-semibold py-2 px-3 sm:px-5 rounded-md text-xs sm:text-sm transition-colors w-full sm:w-auto"
            >
              View Details
            </Link>
          </div>
        </div>
      </div>
    );
  };
  
  const renderTravellingCard = (itinerary: Travelling) => {
    const placeholderImage = '/placeholder-itinerary.jpg';
    const getTransportationIcon = (type?: TransportationType | string) => { 
      const iconSize = 14; 
      const iconClasses = "mr-1 sm:mr-1.5";
      switch (type) {
        case TransportationType.flight: return <Plane size={iconSize} className={`${iconClasses} text-[#001d2c]`} />;
        case TransportationType.train: return <Train size={iconSize} className={`${iconClasses} text-green-500`} />;
        case TransportationType.bus: return <CarIcon size={iconSize} className={`${iconClasses} text-orange-500`} />; 
        case TransportationType.car: return <CarIcon size={iconSize} className={`${iconClasses} text-red-500`} />;
        default: return <MapPin size={iconSize} className={`${iconClasses} text-gray-500`} />;
      }
    };

    return (
      <div 
        key={itinerary._id?.toString()}
        className="flex flex-col sm:flex-row border border-gray-300 rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 bg-white group"
      >
        <div className="w-full sm:w-1/3 md:w-[250px] lg:w-[280px] h-48 sm:h-auto relative cursor-pointer" onClick={() => router.push(`/customer/travelling/${itinerary._id}`)}>
          <Image 
            src={itinerary.bannerImage?.url || placeholderImage} 
            alt={itinerary.title || "Itinerary image"}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 33vw, 280px"
            className="object-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = placeholderImage; }}
          />
          <button className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-black bg-opacity-40 hover:bg-opacity-60 p-1.5 sm:p-2 rounded-full transition-colors">
            <Bookmark size={18} className="text-white sm:w-5 sm:h-5" />
          </button>
        </div>

        <div className="w-full sm:w-2/3 md:flex-grow p-3 sm:p-4 flex flex-col">
          <Link href={`/customer/travelling/${itinerary._id}`} className="block mb-1">
            <h3 className="text-lg sm:text-xl font-bold text-[#001d2c] hover:text-[#001d2c] transition-colors line-clamp-2">{itinerary.title || "Custom Itinerary"}</h3>
          </Link>
          
          {itinerary.transportation && (
            <div className="flex items-center text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">
              {getTransportationIcon(itinerary.transportation.type as TransportationType)}
              <span>
                {itinerary.transportation.type ? itinerary.transportation.type.charAt(0).toUpperCase() + itinerary.transportation.type.slice(1) : 'Travel'}
                {itinerary.transportation.from && itinerary.transportation.to ? <> from <strong>{itinerary.transportation.from}</strong> to <strong>{itinerary.transportation.to}</strong></> : ''}
              </span>
            </div>
          )}
          
          {itinerary.transportation?.departureTime && itinerary.transportation?.arrivalTime && (
            <div className="flex items-center text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
              <Calendar className="mr-1 sm:mr-1.5 text-gray-500 w-3.5 h-3.5" />
              <p>Dep: {new Date(itinerary.transportation.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              <span className="mx-1">•</span>
              <span>Arr: {new Date(itinerary.transportation.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}

          <p className="text-xs sm:text-sm text-gray-700 mb-2 sm:mb-3 line-clamp-2 md:line-clamp-3 flex-grow">
            {itinerary.description || "Plan your perfect journey with this itinerary."}
          </p>
          
          <div className="mt-auto pt-1 sm:pt-2 text-center sm:text-right">
            {itinerary.costing && (
              <div className="mb-1 sm:mb-0">
                {itinerary.costing.price > itinerary.costing.discountedPrice && (
                    <span className="text-xs sm:text-sm text-gray-500 line-through mr-1 sm:mr-2">
                        {itinerary.costing.currency} {itinerary.costing.price.toFixed(2)}
                    </span>
                )}
                <span className="text-lg sm:text-2xl font-bold text-gray-800">
                  {itinerary.costing.currency} {itinerary.costing.discountedPrice.toFixed(2)}
                </span>
                <p className="text-xs text-gray-500">estimated cost</p>
              </div>
            )}
            <Link 
              href={`/customer/travelling/${itinerary._id}`} 
              className="mt-2 inline-block bg-[#001d2c] hover:bg-[#001d2c] text-white font-semibold py-2 px-3 sm:px-5 rounded-md text-xs sm:text-sm transition-colors w-full sm:w-auto"
            >
              View Itinerary
            </Link>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[#001d2c]/30 min-h-screen py-6 sm:py-8 px-2 sm:px-4 md:px-6 lg:px-8"> {/* Added light blue background to outer container */}
      <div className="max-w-6xl mx-auto"> {/* Content wrapper */}

        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-3 sm:mb-4"> 
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-0">
            {isLoading ? 'Searching...' : `${totalResults} match${totalResults !== 1 ? 'es' : ''} found`}
          </h2>
        </div>

        
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            {[...Array(3)].map((_, index) => ( 
              <div key={index} className="flex flex-col sm:flex-row border border-gray-200 rounded-lg overflow-hidden bg-white h-[260px] sm:h-[220px] md:h-[200px]">
                  <div className="w-full sm:w-[240px] md:w-[260px] lg:w-[280px] bg-gray-200 animate-pulse h-1/2 sm:h-full"></div>
                  <div className="flex-grow p-3 sm:p-4 flex flex-col">
                      <div className="h-5 sm:h-6 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                      <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/2 mb-3 sm:mb-4 animate-pulse"></div>
                      <div className="h-3 sm:h-4 bg-gray-200 rounded w-full mb-1 animate-pulse"></div>
                      <div className="h-3 sm:h-4 bg-gray-200 rounded w-5/6 mb-auto animate-pulse"></div>
                      <div className="h-8 sm:h-10 bg-gray-200 rounded w-1/2 sm:w-1/3 ml-auto animate-pulse mt-2"></div>
                  </div>
                  <div className="w-full sm:w-auto sm:min-w-[200px] md:min-w-[220px] lg:min-w-[240px] p-4 bg-gray-100/50 sm:bg-transparent border-t sm:border-t-0 sm:border-l animate-pulse flex flex-col justify-end items-end">
                      <div className="h-4 bg-gray-200 rounded w-20 mb-2 self-end"></div>
                      <div className="h-6 bg-gray-200 rounded w-24 mb-1 self-end"></div>
                      <div className="h-4 bg-gray-200 rounded w-28 mb-2 self-end"></div>
                      <div className="h-10 bg-gray-200 rounded w-full"></div>
                  </div>
              </div>
            ))}
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:gap-5 mb-8 sm:mb-12"> 
            {results.map((item) => {
              console.log("Rendering item:", item);
              if (!item || typeof item._id === 'undefined') {
                  console.warn("Search result item is missing _id or is null:", item);
                  return null; 
              }
              switch (category) {
                case 'trip':
                  return renderTripCard(item as Trip);
                case 'travelling':
                  return renderTravellingCard(item as Travelling);
                default: 
                  return renderPropertyCard(item as Property);
              }
            })}
          </div>
        ) : (
          <div className="text-center py-10 sm:py-16 bg-white rounded-lg shadow">
            <MapPin size={40} className="mx-auto text-gray-400 mb-3 sm:mb-4 sm:w-12 sm:h-12" />
            <h3 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-1 sm:mb-2">No results found</h3>
            <p className="text-sm sm:text-base text-gray-500">Try adjusting your search filters or check back later.</p>
          </div>
        )}
        
        {totalPages > 1 && !isLoading && (
          <div className="flex justify-center mt-8 sm:mt-10">
            <nav className="flex items-center space-x-1 sm:space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-md border bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm font-medium shadow-sm"
              >
                Previous
              </button>
              
              {[...Array(totalPages)].map((_, index) => {
                const pageNumber = index + 1;
                const showPage = pageNumber === 1 || pageNumber === totalPages || (pageNumber >= currentPage - 2 && pageNumber <= currentPage + 2); 
                const showEllipsisStart = pageNumber === currentPage - 3 && currentPage > 4 && totalPages > 7; 
                const showEllipsisEnd = pageNumber === currentPage + 3 && currentPage < totalPages - 3 && totalPages > 7; 

                if (showPage) {
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => handlePageChange(pageNumber)}
                      className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors shadow-sm ${
                        pageNumber === currentPage
                          ? 'bg-[#001d2c] text-white border border-[#001d2c]'
                          : 'border bg-white text-gray-600 hover:bg-gray-100 hover:border-gray-400'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                } else if (showEllipsisStart || showEllipsisEnd) {
                  return <span key={`ellipsis-${pageNumber}`} className="px-1 sm:px-2 py-1.5 sm:py-2 text-gray-500 text-xs sm:text-sm">...</span>;
                }
                return null;
              })}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-md border bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm font-medium shadow-sm"
              >
                Next
              </button>
            </nav>
          </div>
        )}
      </div> {/* End of max-w-6xl mx-auto */}
    </div>
  );
}