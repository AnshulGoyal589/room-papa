'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
// import { formatDistanceToNow } from 'date-fns';
import { Property } from '@/lib/mongodb/models/Property';
import { BookingFormData, PropertyAmenities, RoomCategory as StoredRoomCategory, PropertyType } from '@/types'; // Ensure PropertyType is also imported if used
import DummyReviews from './Reviews'; // Assuming this component exists and is correctly imported
import { useUser } from '@clerk/nextjs';
import { useClerk } from '@clerk/nextjs';
// Assuming you have Lucide icons for various amenities
import { Wifi, Car, Droplet, Wind, Dumbbell, Sparkles, Utensils, Briefcase, Tv, Coffee, BedDouble, SunMedium, ShieldAlert, Filter, Drama, CheckCircle, FileText, Building, Star as StarIcon, MapPin, Users as UsersIcon, Image as ImageIcon } from 'lucide-react';


// Helper function to calculate days between two dates
const calculateDays = (start: Date | null, end: Date | null): number => {
  if (!start || !end || end <= start) {
    return 0;
  }
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// --- Define Tax and Fee Constants ---
const SERVICE_FEE_FIXED = 10; 
const TAX_RATE_PERCENTAGE = 0.05;

// --- localStorage Key ---
const LOCAL_STORAGE_KEY = 'propertyBookingPreferences';
const MAX_COMBINED_ROOMS = 5; 
const MAX_OCCUPANTS_PER_ROOM = 3;


// Helper to generate unique IDs if needed
const generateId = () => Math.random().toString(36).substr(2, 9);

// Initial state for the new category form (Not used for adding in detail page, but for type consistency if data is incomplete)
const initialNewCategoryState = { 
  id: '', 
  title: "",
  qty: 1,
  currency: "USD", 
  pricing: {
    singleOccupancyAdultPrice: 0, discountedSingleOccupancyAdultPrice: 0,
    doubleOccupancyAdultPrice: 0, discountedDoubleOccupancyAdultPrice: 0,
    tripleOccupancyAdultPrice: 0, discountedTripleOccupancyAdultPrice: 0,
    child5to12Price: 0, discountedChild5to12Price: 0,
    child12to18Price: 0, discountedChild12to18Price: 0,
  }
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
  // const [currentReviewPage, setCurrentReviewPage] = useState(1);
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  
  const [adultCount, setAdultCount] = useState<number>(1);
  const [childCount, setChildCount] = useState<number>(0);

  const [selectedRooms, setSelectedRooms] = useState<Record<string, number>>({}); // Key: category ID, Value: quantity
  const [totalSelectedRooms, setTotalSelectedRooms] = useState<number>(0);
  
  const [totalBookingPricePerNight, setTotalBookingPricePerNight] = useState<number>(0);
  const [subtotalNights, setSubtotalNights] = useState<number>(0);
  const [serviceCharge, setServiceCharge] = useState<number>(0);
  const [taxesApplied, setTaxesApplied] = useState<number>(0);
  const [totalBookingPricing, setTotalBookingPricing] = useState<number>(0);

  // const reviewsPerPage = 3;
  const guestCount = useMemo(() => adultCount + childCount, [adultCount, childCount]);

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingData, setBookingData] = useState<BookingFormData>({
    firstName: '', lastName: '', email: '', phone: '',
    passengers: 1, rooms: 0, specialRequests: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const days = useMemo(() => calculateDays(checkInDate, checkOutDate), [checkInDate, checkOutDate]);

  const validateDate = (selectedDateStr: string, propertyStartDateStr: string, propertyEndDateStr: string): Date => {
    const date = new Date(selectedDateStr);
    const minDate = new Date(propertyStartDateStr); minDate.setHours(0,0,0,0);
    const maxDate = new Date(propertyEndDateStr); maxDate.setHours(23,59,59,999);
    if (date < minDate) return minDate;
    if (date > maxDate) return maxDate;
    return date;
  };

  useEffect(() => {
    const fetchPropertyDetails = async () => {
      if (!params?.id) return;
      try {
        setLoading(true); setError(null);
        const response = await fetch(`/api/properties/${params.id}`);
        if (!response.ok) throw new Error(`Failed to fetch property: ${response.statusText} (${response.status})`);
        const data = await response.json();
        if (!data || typeof data !== 'object') throw new Error('Invalid property data received');
        
        const parsedProperty: Property = {
          ...data,
          startDate: data.startDate ? new Date(data.startDate).toISOString() : new Date().toISOString(),
          endDate: data.endDate ? new Date(data.endDate).toISOString() : new Date(Date.now() + 7 * 86400000).toISOString(),
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          categoryRooms: Array.isArray(data.categoryRooms) ? data.categoryRooms.map((cat: any) => ({
            ...cat, 
            id: cat.id || cat._id || generateId(), 
            pricing: cat.pricing || initialNewCategoryState.pricing // Fallback to default detailed pricing structure
          })) : [],
          review: Array.isArray(data.review) ? data.review : [],
        };
        setProperty(parsedProperty);
        if (parsedProperty.bannerImage?.url) setSelectedImage(parsedProperty.bannerImage.url);
        else if (parsedProperty.detailImages?.[0]?.url) setSelectedImage(parsedProperty.detailImages[0].url);
        else setSelectedImage('/images/placeholder-property.jpg');
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setError(`Error fetching details: ${err.message}.`);
        console.error("Fetch error:", err);
      } finally { setLoading(false); }
    };
    fetchPropertyDetails();
  }, [params?.id]);

  useEffect(() => {
    if (property && typeof window !== 'undefined') {
      const storedPreferences = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedPreferences) {
        try {
          const parsedPrefs = JSON.parse(storedPreferences);
          if (parsedPrefs.propertyType === 'property') {
            let loadedCheckInDate: Date | null = null;
            if (parsedPrefs.checkInDate) {
              loadedCheckInDate = validateDate(new Date(parsedPrefs.checkInDate).toISOString().split('T')[0], property.startDate, property.endDate);
              setCheckInDate(loadedCheckInDate);
            } else { setCheckInDate(null); }

            if (parsedPrefs.checkOutDate) {
              const minValCO = loadedCheckInDate ? new Date(loadedCheckInDate.getTime() + 86400000).toISOString().split('T')[0] : property.startDate;
              let validatedCO = validateDate(new Date(parsedPrefs.checkOutDate).toISOString().split('T')[0], minValCO, property.endDate);
              if (loadedCheckInDate && validatedCO <= loadedCheckInDate) {
                const nextDay = new Date(loadedCheckInDate); nextDay.setDate(loadedCheckInDate.getDate() + 1);
                validatedCO = (nextDay <= new Date(property.endDate)) ? nextDay : new Date(property.endDate);
              }
              setCheckOutDate(validatedCO);
            } else { setCheckOutDate(null); }

            if (typeof parsedPrefs.adultCount === 'number' && parsedPrefs.adultCount >= 1) setAdultCount(parsedPrefs.adultCount);
            if (typeof parsedPrefs.childCount === 'number' && parsedPrefs.childCount >= 0) setChildCount(parsedPrefs.childCount);
            
            if (typeof parsedPrefs.selectedRooms === 'object' && parsedPrefs.selectedRooms !== null && property.categoryRooms) {
              const validSelectedRooms: Record<string, number> = {};
              let currentTotalRoomsFromStorage = 0;
              for (const [catId, qty] of Object.entries(parsedPrefs.selectedRooms)) {
                if (typeof qty === 'number' && qty > 0) {
                  const categoryInfo = property.categoryRooms.find(cat => cat.id === catId); // Match by ID
                  if (categoryInfo) {
                    const qtyToSelect = Math.min(qty, categoryInfo.qty);
                    if (currentTotalRoomsFromStorage + qtyToSelect <= MAX_COMBINED_ROOMS) {
                      validSelectedRooms[catId] = qtyToSelect;
                      currentTotalRoomsFromStorage += qtyToSelect;
                    } else {
                      const remainingCap = MAX_COMBINED_ROOMS - currentTotalRoomsFromStorage;
                      if (remainingCap > 0) validSelectedRooms[catId] = Math.min(qtyToSelect, remainingCap);
                      break; 
                    }
                  }
                }
              }
              setSelectedRooms(validSelectedRooms);
            } else { setSelectedRooms({}); }
          }
        } catch (e) { console.error("Failed to parse booking preferences", e); }
      }
    }
  }, [property]);

  useEffect(() => {
    if (property && typeof window !== 'undefined' && !loading) {
      const preferencesToSave = {
        checkInDate: checkInDate ? checkInDate.toISOString() : null,
        checkOutDate: checkOutDate ? checkOutDate.toISOString() : null,
        adultCount, childCount, selectedRooms, propertyType: 'property',
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(preferencesToSave));
    }
  }, [checkInDate, checkOutDate, adultCount, childCount, selectedRooms, property, loading]);

  useEffect(() => {
    if (!property?.categoryRooms || totalSelectedRooms === 0 || guestCount === 0) {
      setTotalBookingPricePerNight(0); 
      setSubtotalNights(0); setServiceCharge(0); setTaxesApplied(0); setTotalBookingPricing(0);
      return;
    }
    let calculatedPricePerNight = 0;
    let remainingAdults = adultCount;
    let remainingChildren = childCount;
    const roomInstances: { catId: string; category: StoredRoomCategory }[] = [];
    Object.entries(selectedRooms).forEach(([catId, qty]) => {
        if (qty > 0) { const category = property.categoryRooms?.find(c => c.id === catId); // Match by ID
            if (category) { for (let i = 0; i < qty; i++) roomInstances.push({ catId, category }); }
        }
    });
    
    for (const { category } of roomInstances) {
        if (remainingAdults === 0 && remainingChildren === 0) break;
        let roomOccupants = 0; let roomPriceForThisInstance = 0;
        const pricing = category.pricing; let adultsInThisRoom = 0; let childrenInThisRoom = 0;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (let i = 0; i < MAX_OCCUPANTS_PER_ROOM && remainingAdults > 0; i++) { adultsInThisRoom++; roomOccupants++; remainingAdults--; }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (let i = 0; i < MAX_OCCUPANTS_PER_ROOM - adultsInThisRoom && remainingChildren > 0; i++) { childrenInThisRoom++; roomOccupants++; remainingChildren--; }
        
        if (adultsInThisRoom === 3) roomPriceForThisInstance = pricing.discountedTripleOccupancyAdultPrice && pricing.discountedTripleOccupancyAdultPrice > 0 ? pricing.discountedTripleOccupancyAdultPrice : pricing.tripleOccupancyAdultPrice;
        else if (adultsInThisRoom === 2) roomPriceForThisInstance = pricing.discountedDoubleOccupancyAdultPrice && pricing.discountedDoubleOccupancyAdultPrice > 0 ? pricing.discountedDoubleOccupancyAdultPrice : pricing.doubleOccupancyAdultPrice;
        else if (adultsInThisRoom === 1) roomPriceForThisInstance = pricing.discountedSingleOccupancyAdultPrice && pricing.discountedSingleOccupancyAdultPrice > 0 ? pricing.discountedSingleOccupancyAdultPrice : pricing.singleOccupancyAdultPrice;
        else if (adultsInThisRoom === 0 && childrenInThisRoom > 0) roomPriceForThisInstance = pricing.discountedSingleOccupancyAdultPrice && pricing.discountedSingleOccupancyAdultPrice > 0 ? pricing.discountedSingleOccupancyAdultPrice : pricing.singleOccupancyAdultPrice;
        
        if (childrenInThisRoom > 0 && adultsInThisRoom > 0) {
            for(let i = 0; i < childrenInThisRoom; i++) {
                // This is a simplification. Assume child price applies if accompanied by adult(s).
                // A more complex model might differentiate child age for pricing here if ages were collected.
                const childPrice = pricing.discountedChild5to12Price && pricing.discountedChild5to12Price > 0 ? pricing.discountedChild5to12Price : pricing.child5to12Price;
                roomPriceForThisInstance += childPrice;
            }
        }
        calculatedPricePerNight += roomPriceForThisInstance;
    }
    
    if (remainingAdults > 0 || remainingChildren > 0) console.warn("Not all guests assigned. Price might be for assigned guests only or more rooms needed.");
    setTotalBookingPricePerNight(calculatedPricePerNight);
    if (calculatedPricePerNight > 0 && days > 0) {
        const currentSubtotalNights = calculatedPricePerNight * days; setSubtotalNights(currentSubtotalNights);
        const currentServiceCharge = SERVICE_FEE_FIXED; setServiceCharge(currentServiceCharge);
        const currentTaxes = (currentSubtotalNights + currentServiceCharge) * TAX_RATE_PERCENTAGE; setTaxesApplied(currentTaxes);
        setTotalBookingPricing(currentSubtotalNights + currentServiceCharge + currentTaxes);
    } else { setSubtotalNights(0); setServiceCharge(0); setTaxesApplied(0); setTotalBookingPricing(0); }
  }, [selectedRooms, property?.categoryRooms, days, adultCount, childCount, totalSelectedRooms, guestCount]);

  const handleCheckInChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if(!property) return; const selectedValue = e.target.value;
    if (!selectedValue) { setCheckInDate(null); return; }
    const validatedCheckIn = validateDate(selectedValue, property.startDate, property.endDate); setCheckInDate(validatedCheckIn);
    if (checkOutDate && validatedCheckIn >= checkOutDate) {
      const nextDay = new Date(validatedCheckIn); nextDay.setDate(validatedCheckIn.getDate() + 1);
      const maxEndDate = new Date(property.endDate);
      if (nextDay <= maxEndDate) setCheckOutDate(nextDay); else setCheckOutDate(validatedCheckIn.toDateString() === maxEndDate.toDateString() ? null : maxEndDate);
    }
  };
  const handleCheckOutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if(!property) return; const selectedValue = e.target.value;
    if (!selectedValue) { setCheckOutDate(null); return; }
    const minCO = checkInDate ? new Date(checkInDate.getTime() + 86400000).toISOString().split('T')[0] : property.startDate;
    const validatedCO = validateDate(selectedValue, minCO, property.endDate);
    if (checkInDate && validatedCO <= checkInDate) {
       const dayAfterCI = new Date(checkInDate); dayAfterCI.setDate(checkInDate.getDate() + 1);
       setCheckOutDate(validatedCO >= dayAfterCI ? validatedCO : (dayAfterCI <= new Date(property.endDate) ? dayAfterCI : null));
    } else { setCheckOutDate(validatedCO); }
  };
  useEffect(() => { if (isLoaded && isSignedIn && user) setBookingData(prev => ({ ...prev, firstName: user.firstName || '', lastName: user.lastName || '', email: user.primaryEmailAddress?.emailAddress || '' })); }, [isLoaded, isSignedIn, user]);
  const handleImageClick = (imageUrl: string) => setSelectedImage(imageUrl);
  const handleGuestChange = (type: 'adult' | 'child', change: number) => { if (type === 'adult') setAdultCount(prev => Math.max(1, prev + change)); else setChildCount(prev => Math.max(0, prev + change)); };
  const handleRoomQuantityChange = (categoryID: string, change: number) => { // Changed to categoryID
    if (!property?.categoryRooms) return; const category = property.categoryRooms.find(cat => cat.id === categoryID); if (!category) return;
    const currentQty = selectedRooms[categoryID] || 0; const newQty = currentQty + change;
    if (newQty < 0 || newQty > category.qty) return;
    const newTotalSelectedRooms = totalSelectedRooms - currentQty + newQty;
    if (newTotalSelectedRooms > MAX_COMBINED_ROOMS) { setBookingError(`Max ${MAX_COMBINED_ROOMS} rooms total.`); setTimeout(() => setBookingError(null), 3000); return; }
    if (guestCount > newTotalSelectedRooms * MAX_OCCUPANTS_PER_ROOM) setBookingError(`Not enough rooms for ${guestCount} guests.`); else setBookingError(null);
    setSelectedRooms(prev => ({ ...prev, [categoryID]: newQty }));
  };
  useEffect(() => { let currentTotal = 0; Object.values(selectedRooms).forEach(qty => currentTotal += qty); setTotalSelectedRooms(currentTotal); }, [selectedRooms]);
  const handleBookNowClick = () => {
    if (!isLoaded) return; setBookingError(null);
    if (!isSignedIn) { openSignIn(); return; }
    if (!checkInDate || !checkOutDate) { setBookingError("Select check-in and check-out dates."); return; }
    if (days <= 0) { setBookingError("Check-out date must be after check-in date."); return; }
    if (totalSelectedRooms <= 0) { setBookingError("Select at least one room."); return; }
    if (totalSelectedRooms > MAX_COMBINED_ROOMS) { setBookingError(`Cannot book more than ${MAX_COMBINED_ROOMS} rooms.`); return; }
    if (guestCount > totalSelectedRooms * MAX_OCCUPANTS_PER_ROOM) { setBookingError(`Not enough rooms for ${guestCount} guests. Max ${MAX_OCCUPANTS_PER_ROOM} per room.`); return; }
    setBookingData(prev => ({ ...prev, passengers: guestCount, rooms: totalSelectedRooms })); setShowBookingModal(true);
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { const { name, value } = e.target; setBookingData(prev => ({ ...prev, [name]: value })); };
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!property || !checkInDate || !checkOutDate || totalSelectedRooms <= 0) { alert("Booking details incomplete."); return; };
    setIsSubmitting(true); setBookingError(null);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const selectedRoomDetailsPayload = Object.entries(selectedRooms).filter(([_, qty]) => qty > 0).map(([catId, qty]) => {
        const category = property.categoryRooms?.find(cat => cat.id === catId); // Match by ID
        // For payload, this is a simplified estimate. The actual price is `totalBookingPricePerNight`
        const estPrice = category ? (category.pricing.discountedSingleOccupancyAdultPrice && category.pricing.discountedSingleOccupancyAdultPrice > 0 ? category.pricing.discountedSingleOccupancyAdultPrice : category.pricing.singleOccupancyAdultPrice) : 0;
        const currency = category ? category.currency : property.costing?.currency || 'USD';
        return { categoryId: catId, title: category?.title || 'Unknown Room', qty: qty, estimatedPricePerRoomNight: estPrice, currency: currency };
    });
    try {
        const bookingPayload = { type: "property", details: { id: params?.id, title: property.title, ownerId: property.userId, locationFrom: "NA", locationTo: `${property.location.address}, ${property.location.city}, ${property.location.country}`, type: property.type as PropertyType }, bookingDetails: { checkIn: checkInDate.toISOString(), checkOut: checkOutDate.toISOString(), adults: adultCount, children: childCount, totalGuests: guestCount, totalRoomsSelected: totalSelectedRooms, roomsDetail: selectedRoomDetailsPayload, calculatedPricePerNight: totalBookingPricePerNight, currency: property.costing?.currency || 'USD', numberOfNights: days, subtotal: subtotalNights, serviceFee: serviceCharge, taxes: taxesApplied, totalPrice: totalBookingPricing, }, guestDetails: { firstName: bookingData.firstName, lastName: bookingData.lastName, email: bookingData.email, phone: bookingData.phone, specialRequests: bookingData.specialRequests }, recipients: [bookingData.email, 'anshulgoyal589@gmail.com'] };
        console.log("Booking Payload:", JSON.stringify(bookingPayload, null, 2));
        const response = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json', }, body: JSON.stringify(bookingPayload), });
        if (!response.ok) { const errorData = await response.json().catch(() => ({ message: 'Failed to send booking confirmation' })); throw new Error(errorData.message || 'Failed to send booking confirmation'); }
        setBookingConfirmed(true); setShowBookingModal(false); if (typeof window !== 'undefined') localStorage.removeItem(LOCAL_STORAGE_KEY);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) { console.error('Error submitting booking:', error); setBookingError(`Booking failed: ${error.message}. Please try again.`); } finally { setIsSubmitting(false); }
};
const renderRatingStars = (rating: number) => ( <div className="flex"> {[1,2,3,4,5].map(star => <StarIcon key={star} className={`w-5 h-5 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />)} </div> );
const getAmenityIcon = (amenity : PropertyAmenities): React.ReactNode => { 
    const icons = { wifi: <Wifi size={20}/>, pool: <Droplet size={20}/>, airConditioning: <Wind size={20}/>, breakfast: <Coffee size={20}/>, parking: <Car size={20}/>, spa: <Sparkles size={20}/>, restaurant: <Utensils size={20}/>, gym: <Dumbbell size={20}/>, breakfastIncluded: <Coffee size={20}/>, petFriendly: <ShieldAlert size={20}/>, roomService: <Briefcase size={20}/>, barLounge: <Utensils size={20}/>, laundryService: <CheckCircle size={20}/> };
    return icons[amenity] || <CheckCircle size={20}/>; 
};
const formatAmenityName = (amenity: PropertyAmenities): string => { 
    const names = { wifi: 'WiFi', parking: 'Parking', pool: 'Swimming Pool', airConditioning: 'Air Conditioning', gym: 'Fitness Center', spa: 'Spa', restaurant: 'Restaurant', breakfast: 'Breakfast Included', breakfastIncluded: 'Breakfast Included', petFriendly: 'Pet Friendly', roomService: 'Room Service', barLounge: 'Bar/Lounge', laundryService: 'Laundry Service', };
    return names[amenity] || amenity.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
};

if (loading) return <div className="flex justify-center items-center min-h-screen"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div></div>;
if (error || !property) return <div className="container mx-auto px-4 py-16 text-center"><h2 className="text-2xl font-bold text-red-600 mb-4">{error || 'Property details could not be loaded.'}</h2>{error && <p className="text-gray-600 mb-4">We encountered an issue. Please check the URL or try refreshing the page.</p>}<button onClick={() => router.push('/properties')} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">View Other Properties</button></div>;

// const paginatedReviews = (property.review || []).slice((currentReviewPage - 1) * reviewsPerPage, currentReviewPage * reviewsPerPage);
// const totalReviewPages = Math.ceil((property.review?.length || 0) / reviewsPerPage);

return (
    <div className="min-h-screen bg-gray-100 pb-16">
      <div className="relative h-96 md:h-[550px] w-full group overflow-hidden">
         <Image src={selectedImage || property.bannerImage?.url || '/images/placeholder-property.jpg'} alt={property.title || 'Property Main Image'} layout="fill" objectFit="cover" priority className="transform transition-transform duration-500 group-hover:scale-110 brightness-70" onError={() => setSelectedImage(property.bannerImage?.url || '/images/placeholder-property.jpg')} />
         <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex flex-col justify-end p-6 md:p-10">
            <div className="inline-block px-4 py-1.5 bg-blue-600 w-fit text-white text-xs sm:text-sm font-semibold rounded-full mb-3 shadow-md uppercase tracking-wider">{property.type}</div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-2 shadow-text">{property.title || `Beautiful ${property.type} in ${property.location.city}`}</h1>
            <div className="flex items-center text-gray-200 text-sm sm:text-base mb-4 shadow-text"><MapPin className="w-5 h-5 mr-2 shrink-0"/><span>{property.location.address}, {property.location.city}, {property.location.state}, {property.location.country}</span></div>
            {property.totalRating && property.totalRating > 0 && <div className="flex items-center text-yellow-400">{renderRatingStars(property.totalRating)}<span className="ml-2 text-white font-semibold">{property.totalRating.toFixed(1)} <span className="text-gray-300 font-normal">({(property.review?.length || 0)} reviews)</span></span></div>}
          </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <div className="lg:col-span-8 space-y-10">
            <section className="bg-white p-6 sm:p-8 rounded-xl shadow-xl">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3 flex items-center"><UsersIcon className="mr-3 h-6 w-6 text-blue-600"/>Property Overview</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-center">
                 <div className="p-4 bg-gray-50 rounded-lg"><div className="text-gray-500 text-sm mb-1 uppercase tracking-wider">Type</div><div className="font-semibold text-lg text-blue-700 capitalize">{property.type}</div></div>
                {property.rooms > 0 && <div className="p-4 bg-gray-50 rounded-lg"><div className="text-gray-500 text-sm mb-1 uppercase tracking-wider">Total Rooms Capacity</div><div className="font-extrabold text-2xl text-blue-700">{property.rooms}</div></div>}
                {property.propertyRating != null && property.propertyRating >= 0 && <div className="p-4 bg-gray-50 rounded-lg"><div className="text-gray-500 text-sm mb-1 uppercase tracking-wider">Property Rating</div><div className="font-extrabold text-2xl text-blue-700">{property.propertyRating.toString()} <span className="text-base">/ 5</span></div></div>}
                {property.googleMaps && <div className="sm:col-span-2 md:col-span-3 mt-4"><div className="text-gray-700 text-sm font-medium mb-2 text-left">Location Map</div><div className="w-full h-72 md:h-96 rounded-lg overflow-hidden border-2 border-gray-200 shadow-inner" dangerouslySetInnerHTML={{ __html: property.googleMaps }} /></div>}
              </div>
            </section>
            
            <section className="bg-white p-6 sm:p-8 rounded-xl shadow-xl">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-3">About This Property</h2>
                <div className="prose prose-sm sm:prose-base max-w-none text-gray-700 leading-relaxed"><p>{property.description || "No detailed description available for this property."}</p></div>
            </section>

            {property.detailImages && property.detailImages.length > 0 && (
              <section className="bg-white p-6 sm:p-8 rounded-xl shadow-xl">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3 flex items-center"><ImageIcon className="mr-3 h-6 w-6 text-blue-600"/>Gallery</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {property.bannerImage && property.bannerImage.url !== selectedImage && ( <div className={`relative aspect-video sm:aspect-square cursor-pointer rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow ${selectedImage === property.bannerImage.url ? 'ring-4 ring-offset-2 ring-blue-500' : 'ring-1 ring-gray-300'}`} onClick={() => handleImageClick(property.bannerImage!.url)}> <Image src={property.bannerImage.url} alt={property.bannerImage.alt || "Property Banner"} layout="fill" objectFit="cover" sizes="(max-width: 640px) 50vw, 200px" onError={(e) => e.currentTarget.src = '/images/placeholder-property.jpg'}/> </div> )}
                  {property.detailImages.filter(img => img.url !== selectedImage).slice(0, property.bannerImage && property.bannerImage.url !== selectedImage ? 7 : 8).map((image, index) => ( <div key={image.publicId || index} className={`relative aspect-video sm:aspect-square cursor-pointer rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow ${selectedImage === image.url ? 'ring-4 ring-offset-2 ring-blue-500' : 'ring-1 ring-gray-300'}`} onClick={() => handleImageClick(image.url)}> <Image src={image.url} alt={image.alt || `Property image ${index + 1}`} layout="fill" objectFit="cover" sizes="(max-width: 640px) 50vw, 200px" onError={(e) => e.currentTarget.src = '/images/placeholder-property.jpg'}/> </div> ))}
                </div>
              </section>
            )}

            {(property.amenities && property.amenities.length > 0) || (property.facilities && property.facilities.length > 0) || (property.roomFacilities && property.roomFacilities.length > 0) ? (
              <section className="bg-white p-6 sm:p-8 rounded-xl shadow-xl">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3 flex items-center"><FileText className="mr-3 h-6 w-6 text-blue-600"/>Amenities & Features</h2>
                {property.amenities && property.amenities.length > 0 && (<div className="mb-6"><h3 className="text-lg font-semibold text-gray-700 mb-3">General Amenities</h3><div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">{property.amenities.map((amenity, index) => ( <div key={`gen-amenity-${index}`} className="flex items-center bg-gray-50 p-3 rounded-lg border border-gray-200"> <div className="bg-blue-100 p-2 rounded-full mr-3 text-blue-600 shrink-0">{getAmenityIcon(amenity as PropertyAmenities)}</div> <span className="text-sm text-gray-700">{formatAmenityName(amenity as PropertyAmenities)}</span> </div> ))}</div></div>)}
                {property.facilities && property.facilities.length > 0 && (<div className="mb-6"><h3 className="text-lg font-semibold text-gray-700 mb-3">On-site Facilities</h3><div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">{property.facilities.map((facility, index) => ( <div key={`facility-${index}`} className="flex items-center bg-gray-50 p-3 rounded-lg border border-gray-200"> <div className="bg-green-100 p-2 rounded-full mr-3 text-green-600 shrink-0"><Briefcase size={20}/></div> <span className="text-sm text-gray-700">{facility}</span> </div> ))}</div></div>)}
                {property.roomFacilities && property.roomFacilities.length > 0 && (<div><h3 className="text-lg font-semibold text-gray-700 mb-3">In-Room Facilities</h3><div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">{property.roomFacilities.map((facility, index) => ( <div key={`room-facility-${index}`} className="flex items-center bg-gray-50 p-3 rounded-lg border border-gray-200"> <div className="bg-purple-100 p-2 rounded-full mr-3 text-purple-600 shrink-0"><Tv size={20}/></div> <span className="text-sm text-gray-700">{facility}</span> </div> ))}</div></div>)}
              </section>
            ) : null}

            {(property.accessibility && property.accessibility.length > 0) || (property.roomAccessibility && property.roomAccessibility.length > 0) ? (
                <section className="bg-white p-6 sm:p-8 rounded-xl shadow-xl">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3 flex items-center"><Droplet className="mr-3 h-6 w-6 text-blue-600"/>Accessibility</h2>
                    {property.accessibility && property.accessibility.length > 0 && (<div className="mb-6"><h3 className="text-lg font-semibold text-gray-700 mb-3">Property Accessibility</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{property.accessibility.map((feature, index) => ( <div key={`prop-access-${index}`} className="flex items-center bg-gray-50 p-3 rounded-lg border"><div className="bg-indigo-100 p-2 rounded-full mr-3 text-indigo-600 shrink-0"><Droplet size={20}/></div><span className="text-sm text-gray-700">{feature}</span></div> ))}</div></div>)}
                    {property.roomAccessibility && property.roomAccessibility.length > 0 && (<div><h3 className="text-lg font-semibold text-gray-700 mb-3">Room Accessibility</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{property.roomAccessibility.map((feature, index) => ( <div key={`room-access-${index}`} className="flex items-center bg-gray-50 p-3 rounded-lg border"><div className="bg-teal-100 p-2 rounded-full mr-3 text-teal-600 shrink-0"><BedDouble size={20}/></div><span className="text-sm text-gray-700">{feature}</span></div> ))}</div></div>)}
                </section>
            ) : null}
            
            {property.funThingsToDo && property.funThingsToDo.length > 0 && (
                <section className="bg-white p-6 sm:p-8 rounded-xl shadow-xl">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-3 flex items-center"><Drama className="mr-3 h-6 w-6 text-blue-600"/>Fun Things To Do Nearby</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{property.funThingsToDo.map((activity, index) => (<div key={`fun-${index}`} className="flex items-center bg-gray-50 p-3 rounded-lg border"><div className="bg-pink-100 p-2 rounded-full mr-3 text-pink-600 shrink-0"><SunMedium size={20}/></div><span className="text-sm text-gray-700">{activity}</span></div>))}</div>
                </section>
            )}
            {property.meals && property.meals.length > 0 && (
                <section className="bg-white p-6 sm:p-8 rounded-xl shadow-xl">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-3 flex items-center"><Utensils className="mr-3 h-6 w-6 text-blue-600"/>Meals & Dining Options</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{property.meals.map((meal, index) => (<div key={`meal-${index}`} className="flex items-center bg-gray-50 p-3 rounded-lg border"><div className="bg-orange-100 p-2 rounded-full mr-3 text-orange-600 shrink-0"><Utensils size={20}/></div><span className="text-sm text-gray-700">{meal}</span></div>))}</div>
                </section>
            )}
             {property.bedPreference && property.bedPreference.length > 0 && (
                <section className="bg-white p-6 sm:p-8 rounded-xl shadow-xl">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-3 flex items-center"><BedDouble className="mr-3 h-6 w-6 text-blue-600"/>Bed Options</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{property.bedPreference.map((preference, index) => (<div key={`bed-${index}`} className="flex items-center bg-gray-50 p-3 rounded-lg border"><div className="bg-lime-100 p-2 rounded-full mr-3 text-lime-600 shrink-0"><BedDouble size={20}/></div><span className="text-sm text-gray-700">{preference}</span></div>))}</div>
                </section>
              )}
              {property.reservationPolicy && property.reservationPolicy.length > 0 && (
                <section className="bg-white p-6 sm:p-8 rounded-xl shadow-xl">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-3 flex items-center"><FileText className="mr-3 h-6 w-6 text-blue-600"/>Reservation Policy</h2>
                  <ul className="list-disc list-inside pl-2 space-y-1.5 text-sm text-gray-700 marker:text-blue-500">{property.reservationPolicy.map((policy, index) => (<li key={`policy-${index}`}>{policy}</li>))}</ul>
                </section>
              )}
              {property.popularFilters && property.popularFilters.length > 0 && (
                <section className="bg-white p-6 sm:p-8 rounded-xl shadow-xl">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-3 flex items-center"><Filter className="mr-3 h-6 w-6 text-blue-600"/>Popular Filters</h2>
                  <div className="flex flex-wrap gap-2">{property.popularFilters.map((filter, index) => (<span key={`filter-${index}`} className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-medium border border-blue-200">{filter}</span>))}</div>
                </section>
              )}
               {property.brands && property.brands.length > 0 && (
                <section className="bg-white p-6 sm:p-8 rounded-xl shadow-xl">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-3 flex items-center"><Building className="mr-3 h-6 w-6 text-blue-600"/>Associated Brands</h2>
                  <div className="flex flex-wrap gap-2">{property.brands.map((brand, index) => (<span key={`brand-${index}`} className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full text-xs font-medium border border-purple-200">{brand}</span>))}</div>
                </section>
              )}


   

       
            <DummyReviews />
          </div>

          {/* --- Right Column (Booking Sidebar) --- */}
          <div className="lg:col-span-4">
            <div className="bg-white p-6 rounded-xl shadow-xl sticky top-10">
               {property.costing && (
                   <div className="mb-6 pb-4 border-b border-gray-200">
                       <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Starting from (per adult/night)</span>
                       <div className="flex items-baseline mt-1.5">
                           <span className="text-3xl font-extrabold text-blue-600">
                               {property.costing.currency}{' '}
                               {(property.costing.discountedPrice > 0 ? property.costing.discountedPrice : property.costing.price).toLocaleString()}
                           </span>
                           {(property.costing.discountedPrice > 0 && property.costing.price > property.costing.discountedPrice) && (<span className="ml-2 line-through text-gray-400 text-lg">{property.costing.currency} {property.costing.price.toLocaleString()}</span>)}
                       </div>
                       <p className="text-xs text-gray-500 mt-1.5">Select rooms, guests & dates for final price.</p>
                   </div>
               )}
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div> <label htmlFor="checkin-date" className="block text-sm font-medium text-gray-700 mb-1">Check-in</label> <input id="checkin-date" type="date" value={checkInDate ? checkInDate.toISOString().split('T')[0] : ''} onChange={handleCheckInChange} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm shadow-sm" min={new Date(property.startDate).toISOString().split('T')[0]} max={new Date(property.endDate).toISOString().split('T')[0]} required /> </div>
                  <div> <label htmlFor="checkout-date" className="block text-sm font-medium text-gray-700 mb-1">Check-out</label> <input id="checkout-date" type="date" value={checkOutDate ? checkOutDate.toISOString().split('T')[0] : ''} onChange={handleCheckOutChange} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm shadow-sm" min={checkInDate ? new Date(checkInDate.getTime() + 86400000).toISOString().split('T')[0] : new Date(property.startDate).toISOString().split('T')[0]} max={new Date(property.endDate).toISOString().split('T')[0]} required disabled={!checkInDate} /> </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Adults</label>
                        <div className="flex items-center border border-gray-300 rounded-lg shadow-sm"> <button type="button" onClick={() => handleGuestChange('adult', -1)} disabled={adultCount <= 1} className="px-3 py-2.5 text-blue-600 disabled:text-gray-400 rounded-l-lg hover:bg-gray-50"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg></button> <div className="flex-1 text-center text-sm font-semibold text-gray-800">{adultCount}</div> <button type="button" onClick={() => handleGuestChange('adult', 1)} className="px-3 py-2.5 text-blue-600 rounded-r-lg hover:bg-gray-50"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg></button> </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Children <span className="text-xs text-gray-400">(0-17)</span></label>
                        <div className="flex items-center border border-gray-300 rounded-lg shadow-sm"> <button type="button" onClick={() => handleGuestChange('child', -1)} disabled={childCount <= 0} className="px-3 py-2.5 text-blue-600 disabled:text-gray-400 rounded-l-lg hover:bg-gray-50"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg></button> <div className="flex-1 text-center text-sm font-semibold text-gray-800">{childCount}</div> <button type="button" onClick={() => handleGuestChange('child', 1)} className="px-3 py-2.5 text-blue-600 rounded-r-lg hover:bg-gray-50"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg></button> </div>
                    </div>
                </div>
                <p className="text-xs text-gray-500 text-center">Total Guests: <span className="font-semibold">{guestCount}</span></p>

                <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Rooms <span className="text-xs text-gray-400">(Max {MAX_COMBINED_ROOMS} total)</span></label>
                    {property.categoryRooms && property.categoryRooms.length > 0 ? (
                        <div className="space-y-3 max-h-72 overflow-y-auto pr-2 border-t pt-3">
                            {property.categoryRooms.map((cat: StoredRoomCategory) => {
                                const selectedQty = selectedRooms[cat.id] || 0; // Use cat.id
                                const canIncrement = totalSelectedRooms < MAX_COMBINED_ROOMS && selectedQty < cat.qty;
                                // Simplified display price logic for the selection UI part
                                let displayCatPrice = cat.pricing.singleOccupancyAdultPrice;
                                if (cat.pricing.discountedSingleOccupancyAdultPrice && cat.pricing.discountedSingleOccupancyAdultPrice > 0) {
                                    displayCatPrice = cat.pricing.discountedSingleOccupancyAdultPrice;
                                }
                                
                                return (
                                    <div key={cat.id} className="p-3.5 border border-gray-200 rounded-lg bg-gray-50 shadow-sm">
                                       <div className="flex justify-between items-center mb-1.5">
                                            <div className="flex-grow">
                                                <p className="font-semibold text-sm text-gray-800">{cat.title}</p>
                                                <p className="text-xs text-gray-500">Approx. {cat.currency} {displayCatPrice.toLocaleString()} / adult / night</p>
                                                 <p className="text-xs text-green-600">{cat.qty - selectedQty} room(s) available</p>
                                            </div>
                                             <div className="flex items-center border border-gray-300 rounded-lg bg-white shadow-sm ml-2 shrink-0">
                                                <button type="button" onClick={() => handleRoomQuantityChange(cat.id, -1)} disabled={selectedQty <= 0} className="px-2.5 py-1.5 text-blue-600 disabled:text-gray-300 rounded-l-md hover:bg-gray-50"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg></button>
                                                <div className="px-3 text-sm font-semibold text-gray-800 min-w-[36px] text-center">{selectedQty}</div>
                                                <button type="button" onClick={() => handleRoomQuantityChange(cat.id, 1)} disabled={!canIncrement} className="px-2.5 py-1.5 text-blue-600 disabled:text-gray-300 rounded-r-md hover:bg-gray-50"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg></button>
                                            </div>
                                       </div>
                                    </div> );
                            })}
                        </div>
                    ) : ( <p className="text-sm text-gray-500 italic py-4 text-center">No specific room types available for this property.</p> )}
                    <div className="mt-3 pt-2 text-sm text-right border-t">Total Selected Rooms: <span className="font-semibold text-gray-800">{totalSelectedRooms}</span> / {MAX_COMBINED_ROOMS}</div>
                </div>
              </div>

              {checkInDate && checkOutDate && days > 0 && totalSelectedRooms > 0 && property.costing && (
                <div className="border-t-2 border-gray-200 pt-5 mb-6 space-y-2.5">
                    <div className="flex justify-between text-sm"><span className="text-gray-600">Est. Room Total ({days} {days === 1 ? 'night' : 'nights'})</span><span className="font-medium text-gray-800">{property.costing.currency} {subtotalNights.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-600">Service Fee</span><span className="font-medium text-gray-800">{property.costing.currency} {serviceCharge.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-600">Taxes & Fees (approx. {TAX_RATE_PERCENTAGE * 100}%)</span><span className="font-medium text-gray-800">{property.costing.currency} {taxesApplied.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                    <div className="flex justify-between font-bold text-xl pt-3 border-t border-gray-300 mt-3 text-blue-700"><span>Grand Total</span><span>{property.costing.currency} {totalBookingPricing.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                </div>
              )}
              {bookingError && <div className="my-4 p-3 bg-red-100 text-red-700 text-sm rounded-lg border border-red-300">{bookingError}</div>}
              <button onClick={handleBookNowClick} disabled={!checkInDate || !checkOutDate || days <= 0 || totalSelectedRooms <= 0 || totalSelectedRooms > MAX_COMBINED_ROOMS || !(property.categoryRooms && property.categoryRooms.length > 0) || guestCount > totalSelectedRooms * MAX_OCCUPANTS_PER_ROOM} className="w-full bg-blue-600 text-white py-3.5 px-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-500/50">Book Now</button>
              <p className="text-xs text-gray-500 text-center mt-3">You won&apos;t be charged yet. This will reserve your rooms.</p>
            </div>
          </div>
        </div>
      </div>

      {showBookingModal && property && property.costing && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 sm:p-8 max-h-[95vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200"><h3 className="text-2xl font-bold text-gray-800">Complete Your Booking</h3><button onClick={() => setShowBookingModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button></div>
            <div className="mb-6 space-y-4">
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg border">{property.bannerImage && <div className="relative h-20 w-28 mr-2 rounded-md overflow-hidden flex-shrink-0 shadow"><Image src={property.bannerImage.url} alt={property.title || ""} layout="fill" objectFit="cover" /></div>}<div><h4 className="font-semibold text-lg text-gray-800">{property.title}</h4><p className="text-sm text-gray-500">{property.location.city}, {property.location.country}</p>{property.totalRating && property.totalRating > 0 && <div className="flex items-center mt-1">{renderRatingStars(property.totalRating)}<span className="text-xs ml-1.5 text-gray-500">({property.totalRating.toFixed(1)})</span></div>}</div></div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 p-4 bg-gray-50 rounded-lg border text-sm"><div><div className="text-xs text-gray-500 uppercase tracking-wider">Check-in</div><div className="font-medium text-gray-700">{checkInDate?.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div></div><div><div className="text-xs text-gray-500 uppercase tracking-wider">Check-out</div><div className="font-medium text-gray-700">{checkOutDate?.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div></div><div><div className="text-xs text-gray-500 uppercase tracking-wider">Duration</div><div className="font-medium text-gray-700">{days} {days === 1 ? 'night' : 'nights'}</div></div><div><div className="text-xs text-gray-500 uppercase tracking-wider">Guests</div><div className="font-medium text-gray-700">{guestCount} ({adultCount} Ad, {childCount} Ch)</div></div></div>
                <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-white">
                    <h5 className="text-sm font-semibold mb-2 text-gray-700">Selected Rooms Breakdown ({totalSelectedRooms} total)</h5>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-2">
                       {/* eslint-disable-next-line @typescript-eslint/no-unused-vars */}
                        {Object.entries(selectedRooms).filter(([_, qty]) => qty > 0).map(([catId, qty]) => {
                            const category = property.categoryRooms?.find(cat => cat.id === catId);
                            // Simplified display for modal
                            const displayPrice = category ? (category.pricing.discountedSingleOccupancyAdultPrice && category.pricing.discountedSingleOccupancyAdultPrice > 0 ? category.pricing.discountedSingleOccupancyAdultPrice : category.pricing.singleOccupancyAdultPrice) : 0;
                            const currency = category ? category.currency : (property.costing?.currency || 'USD');
                            return (<div key={catId} className="flex justify-between items-center text-xs text-gray-600"><span>{qty} x {category?.title || 'Room'}</span><span className="text-gray-700 font-medium">{currency} {(displayPrice * qty).toLocaleString()} / night (approx. base)</span></div>);
                         })}
                    </div>
                     <div className="flex justify-between font-semibold text-sm pt-2.5 border-t border-gray-200 mt-2.5"><span>Total Price Per Night (Calculated)</span><span>{property.costing?.currency || 'USD'} {totalBookingPricePerNight.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                </div>
              <div className="flex flex-col space-y-1.5 mb-4 p-4 bg-gray-100 rounded-lg border border-gray-200"><div className="flex justify-between text-sm"><span className="text-gray-600">Subtotal ({days} {days === 1 ? 'night' : 'nights'})</span><span className="text-gray-800 font-medium">{property.costing.currency} {subtotalNights.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div><div className="flex justify-between text-sm"><span className="text-gray-600">Service Fee</span><span className="text-gray-800 font-medium">{property.costing.currency} {serviceCharge.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div><div className="flex justify-between text-sm"><span className="text-gray-600">Taxes & Fees (approx. {TAX_RATE_PERCENTAGE * 100}%)</span><span className="text-gray-800 font-medium">{property.costing.currency} {taxesApplied.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div></div>
              <div className="flex justify-between font-bold text-xl p-4 bg-blue-50 rounded-lg border border-blue-200 text-blue-700"><span>Grand Total</span><span>{property.costing.currency} {totalBookingPricing.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
            </div>
            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Your Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="modal-firstName">First Name</label><input id="modal-firstName" type="text" name="firstName" value={bookingData.firstName} onChange={handleInputChange} required className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"/></div><div><label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="modal-lastName">Last Name</label><input id="modal-lastName" type="text" name="lastName" value={bookingData.lastName} onChange={handleInputChange} required className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"/></div></div>
                 <div><label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="modal-email">Email</label><input id="modal-email" type="email" name="email" value={bookingData.email} onChange={handleInputChange} required className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"/></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="modal-phone">Phone Number</label><input id="modal-phone" type="tel" name="phone" value={bookingData.phone} onChange={handleInputChange} required className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"/></div>
                 <div><label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="modal-specialRequests">Special Requests (Optional)</label><textarea id="modal-specialRequests" name="specialRequests" value={bookingData.specialRequests} onChange={handleInputChange} rows={3} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="e.g., late check-in, dietary needs"></textarea></div>
              {bookingError && <div className="my-4 p-3 bg-red-100 text-red-700 text-sm rounded-lg border border-red-300">{bookingError}</div>}
              <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:bg-blue-400 disabled:cursor-wait shadow-lg hover:shadow-blue-500/50">{isSubmitting ? <span className="flex items-center justify-center"><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Processing...</span> : "Confirm Booking"}</button>
            </form>
          </div>
        </div>
      )}
      {bookingConfirmed && property && <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[110] backdrop-blur-sm"><div className="bg-white rounded-xl max-w-md w-full p-8 text-center shadow-2xl"><div className="mb-5"><div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center border-4 border-green-200"><svg className="w-12 h-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></div></div><h3 className="text-2xl font-bold text-gray-800 mb-3">Booking Confirmed!</h3><p className="mb-6 text-gray-600">Your booking for <span className="font-semibold">{property.title}</span> has been successfully processed. A confirmation email has been sent to <span className="font-semibold">{bookingData.email}</span>.</p><button onClick={() => setBookingConfirmed(false)} className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-blue-300">Done</button></div></div>}
    </div>
  );
}