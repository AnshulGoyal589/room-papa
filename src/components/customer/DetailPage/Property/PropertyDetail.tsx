'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
// import { Property } from '@/lib/mongodb/models/Property'; // Using the provided schema interface below instead
import {
    BookingFormData,
    PropertyType, // Assuming this is defined elsewhere e.g. 'Hotel', 'Apartment'
    PricingByMealPlan,
    DiscountedPricingByMealPlan
} from '@/types'; // Assuming these are in your @/types
// import DummyReviews from './Reviews'; // Assuming this component can take property.review and property.totalRating
import { useUser, useClerk, SignedOut } from '@clerk/nextjs';
import {
    Wifi, Car, Droplet, Wind, Dumbbell, Coffee as CoffeeIconLucide, CheckCircle, Star as StarIcon, MapPin, Users as UsersIcon, Image as ImageIconLucide, CalendarOff, X,
    ChevronDown, ChevronUp, Heart, Share2, AlertTriangle, Award, Bed, ListChecks,// Added more icons
    Utensils,
    Tv,
    HelpCircle // For question mark icon
} from 'lucide-react';
import { ObjectId } from 'mongodb'; // Assuming you have mongodb installed or ObjectId type definition
import RazorpayPaymentButton from '@/components/payment/RazorpayPaymentButton';

// --- Provided Property Schema ---
interface MongoImage { // Assuming an Image structure based on usage
    publicId?: string;
    url: string;
    alt?: string; // Optional alt text from CMS
}

export interface PropertySchema { // Renamed to avoid conflict with component's Property type
  _id?: ObjectId;
  userId?: string; // Owner/Host ID
  title?: string;
  description?: string;
  type: PropertyType; // e.g., 'Hotel', 'Apartment', 'Villa'
  location: {
    address: string;
    state: string;
    city: string;
    country: string;
  };
  startDate: string; // Overall listing start availability
  endDate: string;   // Overall listing end availability
  costing: {         // Calculated summary: lowest starting price
    price: number;
    discountedPrice: number;
    currency: string;
  };
  totalRating?: number;
  review?: {
    userId?: string; 
    userName?: string; 
    comment: string;
    rating: number;
    createdAt?: Date; 
  }[];
  createdAt?: Date;
  updatedAt?: Date;
  bannerImage?: MongoImage;
  detailImages?: MongoImage[];
  rooms: number; 
  categoryRooms?: StoredRoomCategory[];
  amenities: string[]; 
  accessibility?: string[];
  roomAccessibility?: string[];
  popularFilters?: string[];
  funThingsToDo?: string[];
  meals?: string[]; 
  facilities?: string[]; 
  bedPreference?: string[];
  reservationPolicy?: string[];
  brands?: string[];
  roomFacilities?: string[]; 
  propertyRating?: number; 
  googleMaps?: string; 
}
// --- End Provided Property Schema ---


// --- Define Extended Types incorporating Admin Changes ---
interface RoomCategoryPricing {
    singleOccupancyAdultPrice: PricingByMealPlan;
    discountedSingleOccupancyAdultPrice?: DiscountedPricingByMealPlan;
    doubleOccupancyAdultPrice: PricingByMealPlan;
    discountedDoubleOccupancyAdultPrice?: DiscountedPricingByMealPlan;
    tripleOccupancyAdultPrice: PricingByMealPlan;
    discountedTripleOccupancyAdultPrice?: DiscountedPricingByMealPlan;
    child5to12Price: PricingByMealPlan;
    discountedChild5to12Price?: DiscountedPricingByMealPlan;
    child12to18Price: PricingByMealPlan;
    discountedChild12to18Price?: DiscountedPricingByMealPlan;
}

interface StoredRoomCategory {
    id: string; 
    _id?: string; 
    title: string;
    qty: number; // Total physical rooms of this type
    currency: string;
    pricing: RoomCategoryPricing; 
    unavailableDates: string[];
    size?: string; 
    bedConfiguration?: string; 
    maxOccupancy?: number; // Max people a single room of this type can hold
    roomSpecificAmenities?: string[]; 
}

interface ExtendedProperty extends Omit<PropertySchema, 'categoryRooms' | 'costing' | 'rooms' | 'startDate' | 'endDate' | 'createdAt' | 'updatedAt'> {
    _id: ObjectId; 
    categoryRooms: StoredRoomCategory[];
    costing: { 
        price: number; 
        discountedPrice: number; 
        currency: string;
    };
    rooms: number; 
    startDate: string; 
    endDate: string;   
    createdAt: Date; 
    updatedAt: Date; 
    userId?: string;
    title?: string;
    description?: string;
    type: PropertyType;
    location: {
        address: string;
        state: string;
        city: string;
        country: string;
    };
    totalRating?: number;
    review?: {
        userId?: string;
        userName?: string;
        comment: string;
        rating: number;
        createdAt?: Date;
    }[];
    bannerImage?: MongoImage;
    detailImages?: MongoImage[];
    amenities: string[];
    accessibility?: string[];
    roomAccessibility?: string[];
    popularFilters?: string[];
    funThingsToDo?: string[];
    meals?: string[];
    facilities?: string[];
    bedPreference?: string[];
    reservationPolicy?: string[];
    brands?: string[];
    roomFacilities?: string[];
    propertyRating?: number;
    googleMaps?: string;
}

// --- NEW: Interface for Displayable Room Offers ---
interface DisplayableRoomOffer {
    offerId: string; // Unique ID, e.g., `${categoryId}_2adults`
    categoryId: string;
    categoryTitle: string;
    bedConfiguration?: string;
    size?: string;
    roomSpecificAmenities?: string[];
    maxPhysicalRoomsForCategory: number; // category.qty

    // Offer-specific configuration
    intendedAdults: number; // e.g., 1 for single, 2 for double, 3 for triple pricing basis
    intendedChildren: number; // For this specific offer, usually 0 for base offers
    guestCapacityInOffer: number; // Max guests this specific offer type is for (e.g. 2 for a "2 adult" offer)

    // Pricing (for display, per night for this specific offer configuration)
    pricePerNight: number;
    originalPricePerNight?: number;
    isDiscounted: boolean;
    currency: string;
}
// --- END TYPE DEFINITIONS ---


// Helper function to calculate days between two dates
const calculateDays = (start: Date | null, end: Date | null): number => {
    if (!start || !end || end <= start) {
        return 0;
    }
    const startMidnight = new Date(start); startMidnight.setHours(0, 0, 0, 0);
    const endMidnight = new Date(end); endMidnight.setHours(0, 0, 0, 0);
    const diffTime = Math.abs(endMidnight.getTime() - startMidnight.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
};

// Helper to get all dates in a range (inclusive of start, exclusive of end)
const getDatesInRange = (startDate: Date, endDate: Date): string[] => {
    const dates: string[] = [];
    const currentDate = new Date(startDate);
    while (currentDate < endDate) {
        dates.push(currentDate.toISOString().split('T')[0]); 
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
};

// Helper to get price safely from nested structure
const getPrice = (
    priceGroup: PricingByMealPlan | DiscountedPricingByMealPlan | undefined,
    mealPlan: keyof PricingByMealPlan
): number => {
    if (priceGroup && typeof priceGroup === 'object' && mealPlan in priceGroup) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const price = (priceGroup as any)[mealPlan];
      return typeof price === 'number' ? price : 0;
    }
    return 0;
};


// --- Define Tax and Fee Constants ---
const SERVICE_FEE_FIXED = 10; 
const TAX_RATE_PERCENTAGE = 0.05; 

// --- localStorage Key ---
const LOCAL_STORAGE_KEY = 'propertyBookingPreferences_v3'; // Incremented version
const MAX_COMBINED_ROOMS = 5; 
const MAX_OCCUPANTS_PER_ROOM = 3; // Default if not specified by category

// Helper to generate unique IDs if needed
const generateId = () => Math.random().toString(36).substr(2, 9);

// Initial state for fallback pricing
const initialPricingState: RoomCategoryPricing = {
    singleOccupancyAdultPrice: { noMeal: 0, breakfastOnly: 0, allMeals: 0 },
    discountedSingleOccupancyAdultPrice: { noMeal: 0, breakfastOnly: 0, allMeals: 0 },
    doubleOccupancyAdultPrice: { noMeal: 0, breakfastOnly: 0, allMeals: 0 },
    discountedDoubleOccupancyAdultPrice: { noMeal: 0, breakfastOnly: 0, allMeals: 0 },
    tripleOccupancyAdultPrice: { noMeal: 0, breakfastOnly: 0, allMeals: 0 },
    discountedTripleOccupancyAdultPrice: { noMeal: 0, breakfastOnly: 0, allMeals: 0 },
    child5to12Price: { noMeal: 0, breakfastOnly: 0, allMeals: 0 },
    discountedChild5to12Price: { noMeal: 0, breakfastOnly: 0, allMeals: 0 },
    child12to18Price: { noMeal: 0, breakfastOnly: 0, allMeals: 0 },
    discountedChild12to18Price: { noMeal: 0, breakfastOnly: 0, allMeals: 0 },
};


export default function PropertyDetailPage() {
    const { openSignIn } = useClerk();
    const router = useRouter();
    const params = useParams();
    const { isSignedIn, user, isLoaded } = useUser();

    const [property, setProperty] = useState<ExtendedProperty | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [activeImage, setActiveImage] = useState<string | null>(null);

    const [checkInDate, setCheckInDate] = useState<Date | null>(null);
    const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
    
    // adultCount state is now influenced by room selection. Initial value 1.
    const [adultCount, setAdultCount] = useState<number>(1); 
    const [childCount, setChildCount] = useState<number>(0); // Global child count for booking
    
    const [selectedOffers, setSelectedOffers] = useState<Record<string, number>>({}); 
    const [selectedMealPlan, setSelectedMealPlan] = useState<keyof PricingByMealPlan>('breakfastOnly');

    const [totalSelectedPhysicalRooms, setTotalSelectedPhysicalRooms] = useState<number>(0);
    const [totalBookingPricePerNight, setTotalBookingPricePerNight] = useState<number>(0);
    const [subtotalNights, setSubtotalNights] = useState<number>(0);
    const [serviceCharge, setServiceCharge] = useState<number>(0);
    const [taxesApplied, setTaxesApplied] = useState<number>(0);
    const [totalBookingPricing, setTotalBookingPricing] = useState<number>(0);
    const [availabilityError, setAvailabilityError] = useState<string | null>(null); 

    const [showBookingModal, setShowBookingModal] = useState(false);
    const [bookingData, setBookingData] = useState<BookingFormData>({ firstName: '', lastName: '', email: '', phone: '', passengers: 1, rooms: 0, specialRequests: '' });
    // const [isSubmitting, setIsSubmitting] = useState(false);
    const [bookingConfirmed, setBookingConfirmed] = useState(false);
    const [bookingError, setBookingError] = useState<string | null>(null); 
    const [modalBookingError, setModalBookingError] = useState<string | null>(null);

    const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";
    
    const [showAllAmenities, setShowAllAmenities] = useState(false);

    // globalGuestCount will use the adultCount state, which is now derived from selections or dropdown
    const globalGuestCount = useMemo(() => adultCount + childCount, [adultCount, childCount]);
    const days = useMemo(() => calculateDays(checkInDate, checkOutDate), [checkInDate, checkOutDate]);

    const validateDate = (selectedDateStr: string, propertyStartDateStr: string, propertyEndDateStr: string): Date => {
        const date = new Date(selectedDateStr); date.setHours(12, 0, 0, 0); 
        const minDate = new Date(propertyStartDateStr); minDate.setHours(0, 0, 0, 0);
        const maxDate = new Date(propertyEndDateStr); maxDate.setHours(23, 59, 59, 999);

        if (date < minDate) return minDate;
        if (date > maxDate) return maxDate;
        return date;
    };

     const checkAvailabilityForSelection = useCallback((
        startDate: Date | null,
        endDate: Date | null,
        currentSelectedOffers: Record<string, number>,
        allCategories: StoredRoomCategory[] | undefined
    ): { available: boolean; message: string | null } => {
        if (!startDate || !endDate || endDate <= startDate || !allCategories || Object.keys(currentSelectedOffers).length === 0) {
            return { available: true, message: null }; 
        }

        const dateRange = getDatesInRange(startDate, endDate); 
        if (dateRange.length === 0) return { available: true, message: null }; 

        const involvedCategoryIds = new Set<string>();
        Object.keys(currentSelectedOffers).forEach(offerId => {
            if (currentSelectedOffers[offerId] > 0) {
                involvedCategoryIds.add(offerId.split('_')[0]);
            }
        });

        for (const catId of Array.from(involvedCategoryIds)) {
            const category = allCategories.find(c => c.id === catId || c._id === catId); 
            if (category && category.unavailableDates && category.unavailableDates.length > 0) {
                for (const dateStr of dateRange) {
                    if (category.unavailableDates.includes(dateStr)) {
                        return {
                            available: false,
                            message: `Room type "${category.title}" is unavailable on ${new Date(dateStr).toLocaleDateString()}. Please adjust dates or room selection.`
                        };
                    }
                }
            }
        }
        return { available: true, message: null }; 
    }, []); 


    useEffect(() => {
        const fetchPropertyDetails = async () => {
            if (!params?.id) return;
            try {
                setLoading(true); setError(null); setAvailabilityError(null);
                const response = await fetch(`/api/properties/${params.id}`);
                if (!response.ok) throw new Error(`Failed to fetch property: ${response.statusText} (${response.status})`);
                const data: PropertySchema = await response.json();
                if (!data || typeof data !== 'object' || !data._id) throw new Error('Invalid property data received');

                const propertyStartDate = data.startDate ? new Date(data.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
                const propertyEndDate = data.endDate ? new Date(data.endDate).toISOString().split('T')[0] : new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0]; 

                const parsedProperty: ExtendedProperty = {
                    ...data, 
                    _id: data._id,
                    startDate: propertyStartDate,
                    endDate: propertyEndDate,
                    createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
                    updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    categoryRooms: Array.isArray(data.categoryRooms) ? data.categoryRooms.map((cat: any): StoredRoomCategory => ({
                        id: cat.id || cat._id?.toString() || generateId(), 
                        _id: cat._id?.toString(), 
                        title: cat.title || "Unnamed Room",
                        qty: typeof cat.qty === 'number' ? cat.qty : 0,
                        currency: cat.currency || data.costing?.currency || "USD",
                        pricing: (cat.pricing && typeof cat.pricing === 'object' && 'singleOccupancyAdultPrice' in cat.pricing)
                            ? { 
                                singleOccupancyAdultPrice: { ...initialPricingState.singleOccupancyAdultPrice, ...(cat.pricing.singleOccupancyAdultPrice || {})},
                                discountedSingleOccupancyAdultPrice: { ...initialPricingState.discountedSingleOccupancyAdultPrice, ...(cat.pricing.discountedSingleOccupancyAdultPrice || {})},
                                doubleOccupancyAdultPrice: { ...initialPricingState.doubleOccupancyAdultPrice, ...(cat.pricing.doubleOccupancyAdultPrice || {})},
                                discountedDoubleOccupancyAdultPrice: { ...initialPricingState.discountedDoubleOccupancyAdultPrice, ...(cat.pricing.discountedDoubleOccupancyAdultPrice || {})},
                                tripleOccupancyAdultPrice: { ...initialPricingState.tripleOccupancyAdultPrice, ...(cat.pricing.tripleOccupancyAdultPrice || {})},
                                discountedTripleOccupancyAdultPrice: { ...initialPricingState.discountedTripleOccupancyAdultPrice, ...(cat.pricing.discountedTripleOccupancyAdultPrice || {})},
                                child5to12Price: { ...initialPricingState.child5to12Price, ...(cat.pricing.child5to12Price || {})},
                                discountedChild5to12Price: { ...initialPricingState.discountedChild5to12Price, ...(cat.pricing.discountedChild5to12Price || {})},
                                child12to18Price: { ...initialPricingState.child12to18Price, ...(cat.pricing.child12to18Price || {})},
                                discountedChild12to18Price: { ...initialPricingState.discountedChild12to18Price, ...(cat.pricing.discountedChild12to18Price || {})},
                            }
                            : initialPricingState, 
                        unavailableDates: Array.isArray(cat.unavailableDates) ? cat.unavailableDates : [], 
                        size: cat.size,
                        bedConfiguration: cat.bedConfiguration,
                        maxOccupancy: typeof cat.maxOccupancy === 'number' && cat.maxOccupancy > 0 ? cat.maxOccupancy : MAX_OCCUPANTS_PER_ROOM,
                        roomSpecificAmenities: Array.isArray(cat.roomSpecificAmenities) ? cat.roomSpecificAmenities : [],
                    })) : [],
                    review: Array.isArray(data.review) ? data.review : [],
                    costing: data.costing || { price: 0, discountedPrice: 0, currency: 'USD' },
                    rooms: data.rooms || 0, 
                    amenities: data.amenities || [],
                };
                setProperty(parsedProperty);
                if (parsedProperty.bannerImage?.url) setActiveImage(parsedProperty.bannerImage.url);
                else if (parsedProperty.detailImages?.[0]?.url) setActiveImage(parsedProperty.detailImages[0].url);
                else setActiveImage('/images/placeholder-property.jpg');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (err: any) {
                setError(`Error fetching details: ${err.message}.`);
                console.error("Fetch error:", err);
            } finally { setLoading(false); }
        };
        fetchPropertyDetails();
    }, [params?.id]);

    const getDateFromLocalStorage = (key: string) => {
        if (typeof window === 'undefined') return null;
        const storedValue = localStorage.getItem(key);
        const date = storedValue ? new Date(storedValue) : null;
        if (date && !isNaN(date.getTime())) { 
            const year = date.getFullYear(); 
            const month = date.getMonth() + 1; 
            const day = date.getDate();       
            const monthFormatted = month < 10 ? `0${month}` : month.toString();
            const dayFormatted = day < 10 ? `0${day}` : day.toString();
            return `${year}-${monthFormatted}-${dayFormatted}`;
        }
        return null;
      };

    useEffect(() => {
        if (property && typeof window !== 'undefined') {
            const storedPreferences = localStorage.getItem(LOCAL_STORAGE_KEY);
            const localCheckIn = getDateFromLocalStorage('checkIn');
            const localCheckOut = getDateFromLocalStorage('checkOut');
            const localAdultsString = localStorage.getItem('adults');
            const localChildrenString = localStorage.getItem('children');
            
            if (storedPreferences) {
                try {
                    const parsedPrefs = JSON.parse(storedPreferences);
                    
                    if (localCheckIn) parsedPrefs.checkInDate = localCheckIn; 
                    if (localCheckOut) parsedPrefs.checkOutDate = localCheckOut;
                    if (localAdultsString) parsedPrefs.adultCount = parseInt(localAdultsString, 10);
                    if (localChildrenString) parsedPrefs.childCount = parseInt(localChildrenString, 10);

                    if (parsedPrefs.propertyId === property._id?.toString()) { 
                        let tempCheckInDate: Date | null = null;
                        if (parsedPrefs.checkInDate) {
                            tempCheckInDate = validateDate(new Date(parsedPrefs.checkInDate).toISOString().split('T')[0], property.startDate, property.endDate);
                        }

                        let tempCheckOutDate: Date | null = null;
                        if (parsedPrefs.checkOutDate) {
                            const minValCO = tempCheckInDate ? new Date(tempCheckInDate.getTime() + 86400000).toISOString().split('T')[0] : property.startDate;
                            let validatedCO = validateDate(new Date(parsedPrefs.checkOutDate).toISOString().split('T')[0], minValCO, property.endDate);
                            if (tempCheckInDate && validatedCO <= tempCheckInDate) {
                                const nextDay = new Date(tempCheckInDate); nextDay.setDate(tempCheckInDate.getDate() + 1);
                                validatedCO = (nextDay <= new Date(property.endDate)) ? nextDay : new Date(property.endDate);
                            }
                            tempCheckOutDate = validatedCO;
                        }
                        
                        let tempSelectedOffers: Record<string, number> = {};
                        if (typeof parsedPrefs.selectedOffers === 'object' && parsedPrefs.selectedOffers !== null && property.categoryRooms) {
                             tempSelectedOffers = parsedPrefs.selectedOffers;
                        }

                        setCheckInDate(tempCheckInDate);
                        setCheckOutDate(tempCheckOutDate);
                        
                        // Adult count from local storage is an initial value. If rooms are selected, it will be derived.
                        // So, we set it here, and the pricing useEffect will potentially override it.
                        if (typeof parsedPrefs.adultCount === 'number' && parsedPrefs.adultCount >= 1) setAdultCount(parsedPrefs.adultCount); else if (localAdultsString === null) setAdultCount(1); 
                        if (typeof parsedPrefs.childCount === 'number' && parsedPrefs.childCount >= 0) setChildCount(parsedPrefs.childCount); else if (localChildrenString === null) setChildCount(0);

                        setSelectedOffers(tempSelectedOffers);
                        if (parsedPrefs.selectedMealPlan && ['noMeal', 'breakfastOnly', 'allMeals'].includes(parsedPrefs.selectedMealPlan)) {
                            setSelectedMealPlan(parsedPrefs.selectedMealPlan);
                        } else { setSelectedMealPlan('breakfastOnly'); }
                        
                        const { available, message } = checkAvailabilityForSelection(
                            tempCheckInDate, 
                            tempCheckOutDate, 
                            tempSelectedOffers,
                            property.categoryRooms
                        );
                         if (!available) {
                             setAvailabilityError(message);
                         } else {
                             setAvailabilityError(null);
                         }
                    } else { 
                         localStorage.removeItem(LOCAL_STORAGE_KEY);
                         applyQueryParamData(property, localCheckIn, localCheckOut, localAdultsString, localChildrenString);
                    }
                } catch (e) { 
                    console.error("Failed to parse booking preferences", e); 
                    localStorage.removeItem(LOCAL_STORAGE_KEY); 
                    applyQueryParamData(property, localCheckIn, localCheckOut, localAdultsString, localChildrenString);
                }
            } else if (property) { 
                 applyQueryParamData(property, localCheckIn, localCheckOut, localAdultsString, localChildrenString);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [property, params?.id]); 

    const applyQueryParamData = (
        prop: ExtendedProperty, 
        localCheckInStr: string | null, 
        localCheckOutStr: string | null, 
        localAdultsStr: string | null, 
        localChildrenStr: string | null
    ) => {
        let qCheckIn: Date | null = null;
        let qCheckOut: Date | null = null;
        let qAdults = 1; 
        let qChildren = 0; 

        if (localCheckInStr) qCheckIn = validateDate(localCheckInStr, prop.startDate, prop.endDate);
        if (localCheckOutStr) {
            const minCO = qCheckIn ? new Date(qCheckIn.getTime() + 86400000).toISOString().split('T')[0] : prop.startDate;
            qCheckOut = validateDate(localCheckOutStr, minCO, prop.endDate);
            if (qCheckIn && qCheckOut && qCheckOut <= qCheckIn) {
                const nextDay = new Date(qCheckIn); nextDay.setDate(qCheckIn.getDate() + 1);
                qCheckOut = (nextDay <= new Date(prop.endDate)) ? nextDay : new Date(prop.endDate);
            }
        }
        if (localAdultsStr) qAdults = Math.max(1, parseInt(localAdultsStr, 10));
        if (localChildrenStr) qChildren = Math.max(0, parseInt(localChildrenStr, 10));

        setCheckInDate(qCheckIn);
        setCheckOutDate(qCheckOut);
        setAdultCount(qAdults); // Initial adult count
        setChildCount(qChildren);
        setSelectedOffers({});
        setSelectedMealPlan('breakfastOnly'); 
    };


    useEffect(() => {
        if (property && typeof window !== 'undefined' && !loading) {
            const preferencesToSave = {
                propertyId: property._id?.toString(), 
                checkInDate: checkInDate ? checkInDate.toISOString() : null,
                checkOutDate: checkOutDate ? checkOutDate.toISOString() : null,
                adultCount, // Saves current adultCount, whether from dropdown or derived
                childCount,
                selectedOffers, 
                selectedMealPlan,
            };
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(preferencesToSave));
        }
    }, [checkInDate, checkOutDate, adultCount, childCount, selectedOffers, selectedMealPlan, property, loading]);

    // MODIFIED: Function to generate displayable offers based on room categories
    const displayableRoomOffers = useMemo((): DisplayableRoomOffer[] => {
        if (!property?.categoryRooms) return [];

        const offers: DisplayableRoomOffer[] = [];
        property.categoryRooms.forEach(cat => {
            const calculateOfferPrice = (numAdults: number): { price: number, originalPrice?: number, isDiscounted: boolean } => {
                let basePrice = 0, discountedPrice = 0;
                if (numAdults === 1) {
                    basePrice = getPrice(cat.pricing.singleOccupancyAdultPrice, selectedMealPlan);
                    discountedPrice = getPrice(cat.pricing.discountedSingleOccupancyAdultPrice, selectedMealPlan);
                } else if (numAdults === 2) {
                    basePrice = getPrice(cat.pricing.doubleOccupancyAdultPrice, selectedMealPlan);
                    discountedPrice = getPrice(cat.pricing.discountedDoubleOccupancyAdultPrice, selectedMealPlan);
                } else if (numAdults >= 3) {
                    basePrice = getPrice(cat.pricing.tripleOccupancyAdultPrice, selectedMealPlan);
                    discountedPrice = getPrice(cat.pricing.discountedTripleOccupancyAdultPrice, selectedMealPlan);
                }

                if (basePrice === 0 && selectedMealPlan !== 'noMeal') {
                    let fbBase = 0, fbDisc = 0;
                    if (numAdults === 1) { fbBase = getPrice(cat.pricing.singleOccupancyAdultPrice, 'noMeal'); fbDisc = getPrice(cat.pricing.discountedSingleOccupancyAdultPrice, 'noMeal');}
                    else if (numAdults === 2) { fbBase = getPrice(cat.pricing.doubleOccupancyAdultPrice, 'noMeal'); fbDisc = getPrice(cat.pricing.discountedDoubleOccupancyAdultPrice, 'noMeal');}
                    else if (numAdults >= 3) { fbBase = getPrice(cat.pricing.tripleOccupancyAdultPrice, 'noMeal'); fbDisc = getPrice(cat.pricing.discountedTripleOccupancyAdultPrice, 'noMeal');}
                    basePrice = fbBase; discountedPrice = fbDisc;
                }
                
                const isDisc = discountedPrice > 0 && discountedPrice < basePrice;
                return {
                    price: isDisc ? discountedPrice : basePrice,
                    originalPrice: isDisc ? basePrice : undefined,
                    isDiscounted: isDisc
                };
            };

            const offerConfigs = [
                { intendedAdults: 1, guestCapacityInOffer: 1, offerKeySuffix: '1guest' },
                { intendedAdults: 2, guestCapacityInOffer: 2, offerKeySuffix: '2guests' },
                { intendedAdults: 3, guestCapacityInOffer: 3, offerKeySuffix: '3guests' },
            ];

            offerConfigs.forEach(oc => {
                if (cat.maxOccupancy && cat.maxOccupancy >= oc.guestCapacityInOffer) {
                     const pricingExists = 
                        (oc.intendedAdults === 1 && cat.pricing.singleOccupancyAdultPrice) ||
                        (oc.intendedAdults === 2 && cat.pricing.doubleOccupancyAdultPrice) ||
                        (oc.intendedAdults === 3 && cat.pricing.tripleOccupancyAdultPrice);

                    if (pricingExists) {
                        const priceInfo = calculateOfferPrice(oc.intendedAdults);
                         if (priceInfo.price > 0) {
                            offers.push({
                                offerId: `${cat.id}_${oc.offerKeySuffix}`,
                                categoryId: cat.id,
                                categoryTitle: cat.title,
                                bedConfiguration: cat.bedConfiguration,
                                size: cat.size,
                                roomSpecificAmenities: cat.roomSpecificAmenities,
                                maxPhysicalRoomsForCategory: cat.qty,
                                intendedAdults: oc.intendedAdults,
                                intendedChildren: 0, 
                                guestCapacityInOffer: oc.guestCapacityInOffer,
                                pricePerNight: priceInfo.price,
                                originalPricePerNight: priceInfo.originalPrice,
                                isDiscounted: priceInfo.isDiscounted,
                                currency: cat.currency,
                            });
                        }
                    }
                }
            });
        });
        return offers;
    }, [property?.categoryRooms, selectedMealPlan]);


    // Calculate Total Price based on selection, MEAL PLAN, derived adultCount and childCount
    useEffect(() => {
        if (!property?.categoryRooms || !displayableRoomOffers || !checkInDate || !checkOutDate || days <= 0) {
            setTotalBookingPricePerNight(0);
            setSubtotalNights(0); setServiceCharge(0); setTaxesApplied(0); setTotalBookingPricing(0);
            setBookingError(null);
            // If no rooms are selected, adultCount is controlled by dropdown. Don't reset it here unless specifically intended.
            return;
        }

        let newActualAdultCountBasedOnOffers = 0;
        let calculatedPricePerNight = 0;
        const currentBookedRoomInstances: {
            category: StoredRoomCategory;
            offer: DisplayableRoomOffer;
            childrenAssigned: number; // To track children per instance for capacity checks
        }[] = [];

        if (totalSelectedPhysicalRooms > 0 && displayableRoomOffers.length > 0) {
            Object.entries(selectedOffers).forEach(([offerId, qty]) => {
                if (qty > 0) {
                    const offer = displayableRoomOffers.find(o => o.offerId === offerId);
                    const category = property.categoryRooms.find(c => c.id === offer?.categoryId || c._id === offer?.categoryId);

                    if (offer && category) {
                        calculatedPricePerNight += offer.pricePerNight * qty; // Base price from offer (for its intended adults)
                        newActualAdultCountBasedOnOffers += offer.intendedAdults * qty;
                        for (let i = 0; i < qty; i++) {
                            currentBookedRoomInstances.push({
                                category,
                                offer,
                                childrenAssigned: 0,
                            });
                        }
                    }
                }
            });
        }
        
        // This is the number of adults determined by the selected room offers.
        // If rooms are selected, adultCount state should reflect this.
        const adultCountToSet = totalSelectedPhysicalRooms > 0 ? Math.max(1, newActualAdultCountBasedOnOffers) : adultCount; // Use current adultCount if no rooms

        if (totalSelectedPhysicalRooms > 0 && adultCount !== adultCountToSet) {
            setAdultCount(adultCountToSet);
            // This will trigger a re-render and this useEffect will run again.
            // The calculations below in *this* execution cycle should use adultCountToSet.
        }
        
        // Adults for pricing are now based on adultCountToSet (derived from offers if any, else from dropdown via adultCount state)
        // Children are from childCount state (dropdown)
        let remainingChildrenToPlace = childCount;
        let childrenPriceComponent = 0;
        let newErrorMessage: string | null = null;

        if (remainingChildrenToPlace > 0 && currentBookedRoomInstances.length > 0) {
            for (const instance of currentBookedRoomInstances) {
                if (remainingChildrenToPlace === 0) break;

                const { category, offer } = instance;
                const pricing = category.pricing;
                const adultsInThisRoomInstanceByOffer = offer.intendedAdults;
                const capacityForChildrenInInstance = Math.max(0, (category.maxOccupancy || MAX_OCCUPANTS_PER_ROOM) - adultsInThisRoomInstanceByOffer);
                
                const childrenToAssignToInstance = Math.min(remainingChildrenToPlace, capacityForChildrenInInstance);

                if (childrenToAssignToInstance > 0) {
                    instance.childrenAssigned = childrenToAssignToInstance; // Track for validation
                    remainingChildrenToPlace -= childrenToAssignToInstance;

                    let pricePerChildForInstance = 0;
                    let child5to12Base = getPrice(pricing.child5to12Price, selectedMealPlan);
                    let child5to12Disc = getPrice(pricing.discountedChild5to12Price, selectedMealPlan);
                    if (child5to12Base === 0 && selectedMealPlan !== 'noMeal') child5to12Base = getPrice(pricing.child5to12Price, 'noMeal');
                    if (child5to12Disc === 0 && selectedMealPlan !== 'noMeal') child5to12Disc = getPrice(pricing.discountedChild5to12Price, 'noMeal');
                    const calculatedChild5to12Price = (child5to12Disc > 0 && child5to12Disc < child5to12Base) ? child5to12Disc : child5to12Base;

                    if (calculatedChild5to12Price > 0) {
                        pricePerChildForInstance = calculatedChild5to12Price;
                    } else {
                        let child12to18Base = getPrice(pricing.child12to18Price, selectedMealPlan);
                        let child12to18Disc = getPrice(pricing.discountedChild12to18Price, selectedMealPlan);
                        if (child12to18Base === 0 && selectedMealPlan !== 'noMeal') child12to18Base = getPrice(pricing.child12to18Price, 'noMeal');
                        if (child12to18Disc === 0 && selectedMealPlan !== 'noMeal') child12to18Disc = getPrice(pricing.discountedChild12to18Price, 'noMeal');
                        const calculatedChild12to18Price = (child12to18Disc > 0 && child12to18Disc < child12to18Base) ? child12to18Disc : child12to18Base;
                        if (calculatedChild12to18Price > 0) pricePerChildForInstance = calculatedChild12to18Price;
                    }
                    childrenPriceComponent += pricePerChildForInstance * childrenToAssignToInstance;
                }
            }
        }
        calculatedPricePerNight += childrenPriceComponent;

        if (remainingChildrenToPlace > 0) {
            newErrorMessage = `Not enough room capacity for all ${childCount} children. ${remainingChildrenToPlace} children could not be assigned. Please adjust room selection or reduce child count.`;
        }
        
        // Final check on total guests vs total capacity (adults are by offer, children distributed)
        const totalGuestCapacityInSelectedRooms = currentBookedRoomInstances.reduce((sum, inst) => sum + (inst.category.maxOccupancy || MAX_OCCUPANTS_PER_ROOM), 0);
        const totalGuestsAttemptingToBook = adultCountToSet + childCount; // adultCountToSet is derived if rooms selected

        if (totalSelectedPhysicalRooms > 0 && totalGuestsAttemptingToBook > totalGuestCapacityInSelectedRooms && !newErrorMessage) {
             // This condition might be slightly redundant if remainingChildrenToPlace already covers it,
             // but it's a good safeguard.
             newErrorMessage = `Total guests (${totalGuestsAttemptingToBook}) exceed capacity of selected rooms (${totalGuestCapacityInSelectedRooms}). Adjust selection.`;
        }
        
        setBookingError(newErrorMessage);
        setTotalBookingPricePerNight(calculatedPricePerNight);

        if (calculatedPricePerNight > 0 && days > 0 && !newErrorMessage) {
            const currentSubtotalNights = calculatedPricePerNight * days;
            setSubtotalNights(currentSubtotalNights);
            // Service fee: Assuming SERVICE_FEE_FIXED is a per-booking, per-night fee, not per room.
            const currentServiceCharge = SERVICE_FEE_FIXED * days; 
            setServiceCharge(currentServiceCharge);
            const currentTaxes = (currentSubtotalNights + currentServiceCharge) * TAX_RATE_PERCENTAGE;
            setTaxesApplied(currentTaxes);
            setTotalBookingPricing(currentSubtotalNights + currentServiceCharge + currentTaxes);
        } else {
            setSubtotalNights(0); setServiceCharge(0); setTaxesApplied(0); setTotalBookingPricing(0);
            if (calculatedPricePerNight <= 0 && totalSelectedPhysicalRooms > 0 && days > 0 && !newErrorMessage) {
                // Avoid setting error if adultCount is being updated by this effect, which will trigger re-calculation
                const adultCountIsStableOrNoRooms = !(totalSelectedPhysicalRooms > 0 && adultCount !== adultCountToSet);
                if (adultCountIsStableOrNoRooms) {
                     setBookingError("Could not calculate a valid price. Check room rates or contact support.");
                }
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        selectedOffers, 
        property, // Includes property.categoryRooms, property.costing.currency etc.
        displayableRoomOffers, 
        days, 
        adultCount, // adultCount state (used for comparison and when no rooms selected)
        childCount, 
        selectedMealPlan, 
        checkInDate, 
        checkOutDate, 
        totalSelectedPhysicalRooms,
        // setAdultCount is a setter, not a dependency here
    ]);


    // --- Event Handlers ---

    const handleCheckInChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!property) return;
        const selectedValue = e.target.value;
        let validatedCheckIn: Date | null = null;

        if (!selectedValue) {
            setCheckInDate(null);
            setCheckOutDate(null); 
        } else {
            validatedCheckIn = validateDate(selectedValue, property.startDate, property.endDate);
            setCheckInDate(validatedCheckIn);

            if (checkOutDate && validatedCheckIn >= checkOutDate) {
                const nextDay = new Date(validatedCheckIn);
                nextDay.setDate(validatedCheckIn.getDate() + 1);
                const maxEndDate = new Date(property.endDate);
                 const validNextDay = nextDay <= maxEndDate ? nextDay : maxEndDate;
                 if (validNextDay > validatedCheckIn) {
                    setCheckOutDate(validNextDay);
                 } else {
                    setCheckOutDate(null); 
                 }
            } else if (!checkOutDate && validatedCheckIn) { 
                const nextDay = new Date(validatedCheckIn);
                nextDay.setDate(validatedCheckIn.getDate() + 1);
                const maxEndDate = new Date(property.endDate);
                if (nextDay <= maxEndDate) {
                    setCheckOutDate(nextDay);
                }
            }
        }
         const { available, message } = checkAvailabilityForSelection(validatedCheckIn, checkOutDate, selectedOffers, property?.categoryRooms);
         setAvailabilityError(available ? null : message);
         setBookingError(null); 
    };

    const handleCheckOutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!property || !checkInDate) return; 
        const selectedValue = e.target.value;
         let validatedCheckOut: Date | null = null;

        if (!selectedValue) {
            setCheckOutDate(null);
        } else {
            const minCODateStr = new Date(checkInDate.getTime() + 86400000).toISOString().split('T')[0];
            validatedCheckOut = validateDate(selectedValue, minCODateStr, property.endDate);

             if (validatedCheckOut <= checkInDate) { 
                 const dayAfterCI = new Date(checkInDate);
                 dayAfterCI.setDate(checkInDate.getDate() + 1);
                 const maxEndDate = new Date(property.endDate);
                 validatedCheckOut = dayAfterCI <= maxEndDate ? dayAfterCI : null; 
             }
            setCheckOutDate(validatedCheckOut);
        }
         const { available, message } = checkAvailabilityForSelection(checkInDate, validatedCheckOut, selectedOffers, property?.categoryRooms);
         setAvailabilityError(available ? null : message);
         setBookingError(null);
    };


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

    const handleImageClick = (imageUrl: string) => { setActiveImage(imageUrl); };

    const handleOfferQuantityChange = (offerId: string, quantity: number) => {
        if (!property?.categoryRooms) return;
        
        const [categoryIdFromFile] = offerId.split('_');
        const category = property.categoryRooms.find(cat => cat.id === categoryIdFromFile || cat._id === categoryIdFromFile);
        if (!category) return;

        const newQty = Math.max(0, quantity);

        const tempSelectedOffers = { ...selectedOffers };
        if (newQty === 0) {
            delete tempSelectedOffers[offerId];
        } else {
            tempSelectedOffers[offerId] = newQty;
        }

        let qtySumForThisCategory = 0;
        for (const currentOfferId in tempSelectedOffers) {
            if (currentOfferId.startsWith(category.id + '_') || currentOfferId.startsWith(category._id + '_')) { // check both id and _id
                qtySumForThisCategory += tempSelectedOffers[currentOfferId];
            }
        }


        if (qtySumForThisCategory > category.qty) {
            setBookingError(`Cannot select more than ${category.qty} rooms of type "${category.title}".`);
            setTimeout(() => { setBookingError(null); }, 3000);
            return; 
        }
        
        const newTotalSelectedPhysical = Object.values(tempSelectedOffers).reduce((sum, q) => sum + q, 0);
        if (newTotalSelectedPhysical > MAX_COMBINED_ROOMS) {
            setBookingError(`Maximum ${MAX_COMBINED_ROOMS} rooms allowed in total.`);
            setTimeout(() => { setBookingError(null); }, 3000);
            return;
        }
        
        setSelectedOffers(tempSelectedOffers); 

        const { available, message } = checkAvailabilityForSelection(checkInDate, checkOutDate, tempSelectedOffers, property.categoryRooms);
        setAvailabilityError(available ? null : message);
    
        if (bookingError && (bookingError.startsWith("Not enough room capacity") || bookingError.startsWith("Your selection does not accommodate"))) {
             setBookingError(null);
        }
    };


    useEffect(() => {
        let currentTotal = 0;
        Object.values(selectedOffers).forEach(qty => currentTotal += qty);
        setTotalSelectedPhysicalRooms(currentTotal);
    }, [selectedOffers]);

    const handleMealPlanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedMealPlan(e.target.value as keyof PricingByMealPlan);
         setBookingError(null); 
         setAvailabilityError(null); 
    };

    const handleBookNowOrReserveClick = () => { 
        if (!isLoaded) return; 
        let localError: string | null = null;
        setModalBookingError(null);

        if (!isSignedIn) {
            openSignIn({redirectUrl: window.location.href}); 
            return;
        }

        if (!checkInDate || !checkOutDate) { localError = "Please select check-in and check-out dates."; }
        else if (days <= 0) { localError = "Check-out date must be after check-in date."; }
        else if (totalSelectedPhysicalRooms <= 0) { localError = "Please select at least one room offer."; }
        else if (totalSelectedPhysicalRooms > MAX_COMBINED_ROOMS) { localError = `Cannot book more than ${MAX_COMBINED_ROOMS} rooms.`; }
        
        const { available, message: availabilityMsg } = checkAvailabilityForSelection(checkInDate, checkOutDate, selectedOffers, property?.categoryRooms);
        if (!available) {
            setAvailabilityError(availabilityMsg);
            return; 
        } else {
            setAvailabilityError(null);
        }

        if (bookingError) { 
            return;
        }
        
        if (totalBookingPricing <= 0 && totalSelectedPhysicalRooms > 0 && days > 0) {
           localError = "Calculated price is zero. Please check room rates or contact support.";
        }

        if(localError) {
            setBookingError(localError); 
            return;
        }
        setBookingError(null); 

        // globalGuestCount uses the adultCount state, which is updated by pricing useEffect
        setBookingData(prev => ({ ...prev, passengers: globalGuestCount, rooms: totalSelectedPhysicalRooms }));
        setShowBookingModal(true);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setBookingData(prev => ({ ...prev, [name]: value }));
    };
    

    // const handleBookingSubmit = async (e: React.FormEvent) => {
    //     e.preventDefault();
    //     console.log("Form submitted, but Razorpay button should handle actual booking POST.");
    // };


    const renderRatingStars = (rating: number, starSize: string = "w-4 h-4") => (
        <div className="flex items-center">
            {[1, 2, 3, 4, 5].map(star => (
                <StarIcon key={star} className={`${starSize} ${star <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
            ))}
        </div>
    );

    const getAmenityIcon = (amenity: string): React.ReactNode => {
        const lowerAmenity = amenity.toLowerCase();
        if (lowerAmenity.includes('wifi') || lowerAmenity.includes('internet')) return <Wifi size={16} className="text-green-600" />;
        if (lowerAmenity.includes('parking')) return <Car size={16} className="text-green-600" />;
        if (lowerAmenity.includes('pool')) return <Droplet size={16} className="text-green-600" />;
        if (lowerAmenity.includes('air conditioning') || lowerAmenity.includes('ac')) return <Wind size={16} className="text-green-600" />;
        if (lowerAmenity.includes('gym') || lowerAmenity.includes('fitness')) return <Dumbbell size={16} className="text-green-600" />;
        if (lowerAmenity.includes('restaurant')) return <Utensils size={16} className="text-green-600" />;
        if (lowerAmenity.includes('tv') || lowerAmenity.includes('television')) return <Tv size={16} className="text-green-600" />;
        if (lowerAmenity.includes('coffee') || lowerAmenity.includes('tea maker')) return <CoffeeIconLucide size={16} className="text-green-600" />;
        if (lowerAmenity.includes('breakfast')) return <CoffeeIconLucide size={16} className="text-green-600" />;
        if (lowerAmenity.includes('balcony')) return <ImageIconLucide size={16} className="text-gray-500" />; 
        if (lowerAmenity.includes('view')) return <ImageIconLucide size={16} className="text-gray-500" />;
        if (lowerAmenity.includes('kitchen') || lowerAmenity.includes('kitchenette')) return <Utensils size={16} className="text-green-600" />;
        return <CheckCircle size={16} className="text-green-600" />;
    };

     const formatAmenityName = (amenity: string): string => {
        let name = amenity.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        if (name.toLowerCase() === 'wifi') return 'Wi-Fi';
        if (name.startsWith("Is ")) name = name.substring(3); 
        if (name.startsWith("Has ")) name = name.substring(4); 
        return name;
     };
    
    const allImages = useMemo(() => {
        if (!property) return [];
        const images: MongoImage[] = [];
        if (property.bannerImage?.url) images.push({ ...property.bannerImage, publicId: property.bannerImage.publicId || 'banner', url: property.bannerImage.url });
        
        property.detailImages?.forEach(img => {
            if (img.url && img.url !== property.bannerImage?.url) { 
                images.push({ ...img, publicId: img.publicId || img.url, url: img.url });
            }
        });
        return images.filter(img => img.url).map(img => ({...img, alt: img.alt || property.title || 'Property image'}));
    }, [property]);

    const mainGalleryImage = allImages[0];
    const sideGalleryImages = allImages.slice(1, 3); 

    const renderPropertyHighlights = () => {
        if (!property) return null;
        const highlights = [];
        if (property.type) highlights.push({ icon: <Award className="text-blue-600" />, title: 'Property Type', text: [property.type] });
        
        const viewAmenity = property.amenities?.find(a => a.toLowerCase().includes('view') || a.toLowerCase().includes('balcony') || a.toLowerCase().includes('terrace'));
        if (viewAmenity) highlights.push({ icon: <ImageIconLucide className="text-blue-600" />, title: 'Featured Amenity', text: [formatAmenityName(viewAmenity)] });
        else if (property.funThingsToDo?.some(ft => ft.toLowerCase().includes('view'))) {
             highlights.push({ icon: <ImageIconLucide className="text-blue-600" />, title: 'Scenic Surroundings', text: ["Beautiful views often reported"] });
        }

        const mealTexts: string[] = [];
        const breakfastMeal = property.meals?.find(m => m.toLowerCase().includes('breakfast'));
        if (breakfastMeal) mealTexts.push(formatAmenityName(breakfastMeal));
        const lunchMeal = property.meals?.find(m => m.toLowerCase().includes('lunch'));
        if (lunchMeal) mealTexts.push(formatAmenityName(lunchMeal));
        const dinnerMeal = property.meals?.find(m => m.toLowerCase().includes('dinner'));
        if (dinnerMeal) mealTexts.push(formatAmenityName(dinnerMeal));

        if (mealTexts.length > 0) {
            highlights.push({ icon: <CoffeeIconLucide className="text-blue-600" />, title: 'Meal Options', text: [mealTexts.join(', ')] });
        } else if (property.amenities?.find(a => a.toLowerCase().includes('breakfast'))) {
            highlights.push({ icon: <CoffeeIconLucide className="text-blue-600" />, title: 'Breakfast Available', text: ['Breakfast amenity offered'] });
        }
        
        const kitchenAmenity = property.amenities?.find(a => a.toLowerCase().includes('kitchen'));
        if (kitchenAmenity) highlights.push({ icon: <Utensils className="text-blue-600" />, title: 'Kitchen Facilities', text: [formatAmenityName(kitchenAmenity)] });

        const wifiAmenity = property.amenities?.find(a => a.toLowerCase().includes('wifi') || a.toLowerCase().includes('internet'));
        if (wifiAmenity) highlights.push({ icon: <Wifi className="text-blue-600" />, title: 'Wi-Fi Available', text: [formatAmenityName(wifiAmenity)] });
        
        return (
            <div className="bg-white p-4 rounded-md border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Property highlights</h3>
                {highlights.length > 0 ? (
                    <div className="space-y-3">
                        {highlights.slice(0, 4).map((item, index) => (
                            <div key={index} className="flex items-start">
                                <span className="mr-2 mt-0.5 shrink-0">{React.cloneElement(item.icon, { size: 20 })}</span>
                                <div>
                                    <p className="text-sm font-semibold text-gray-700">{item.title}</p>
                                    <p className="text-xs text-gray-500">{item.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500">No specific highlights available.</p>
                )}
            </div>
        );
    };

    if (loading) return <div className="flex justify-center items-center min-h-screen"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div></div>;
    if (error || !property) return <div className="container mx-auto px-4 py-16 text-center"><h2 className="text-2xl font-bold text-red-600 mb-4">{error || 'Property details could not be loaded.'}</h2>{error && <p className="text-gray-600 mb-4">Please check the URL or try refreshing the page.</p>}<button onClick={() => router.push('/properties')} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">View Other Properties</button></div>;


    return (
        <div className="bg-gray-100">
            <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-5">
                <div className="mb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            {property.type && <span className="text-xs bg-yellow-400 text-yellow-900 font-semibold px-2 py-0.5 rounded-sm mr-2 uppercase">{property.type}</span>}
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 inline">{property.title || 'Property Title N/A'}</h1>
                        </div>
                        <div className="flex items-center space-x-2 mt-1 sm:mt-0">
                            <button className="p-1.5 rounded-full hover:bg-gray-200"><Heart size={18} className="text-blue-600" /></button>
                            <button className="p-1.5 rounded-full hover:bg-gray-200"><Share2 size={18} className="text-blue-600" /></button>
                        </div>
                    </div>
                    <div className="flex items-center text-xs text-gray-600 mt-1">
                        {(property.totalRating != null && property.totalRating > 0) && (
                            <div className="flex items-center mr-2">{renderRatingStars(property.totalRating, "w-3.5 h-3.5")}<span className="ml-1 bg-blue-600 text-white text-[10px] font-bold px-1 py-0.5 rounded-sm">{property.totalRating.toFixed(1)}</span></div>
                        )}
                        {property.propertyRating && property.propertyRating > 0 && (
                           <span className="mr-2">{renderRatingStars(property.propertyRating, "w-3 h-3")} <span className="text-[10px] align-super">({property.propertyRating}-star)</span></span>
                        )}
                        <MapPin size={12} className="mr-1 text-gray-500" />
                        <span>{property.location.address}, {property.location.city}</span>
                    </div>
                </div>

                 <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-5">
                    <div className="md:col-span-8">
                        <div className="grid grid-cols-3 grid-rows-3 gap-1.5 h-[300px] md:h-[420px] rounded-lg overflow-hidden">
                            {mainGalleryImage && (
                                <div className="col-span-2 row-span-3 relative cursor-pointer group" onClick={() => handleImageClick(mainGalleryImage.url)}>
                                    <Image src={activeImage || mainGalleryImage.url} alt={mainGalleryImage.alt || property.title || 'Main property view'} layout="fill" objectFit="cover" priority className="transition-opacity hover:opacity-90" onError={(e) => e.currentTarget.src = '/images/placeholder-property.jpg'} />
                                </div>
                            )}
                            {!mainGalleryImage && <div className="col-span-2 row-span-3 bg-gray-200 flex items-center justify-center text-gray-500">No Image</div>}
                            
                            {sideGalleryImages.map((image, index) => (
                                <div key={`side-img-${index}`} className={`col-span-1 ${index === 0 ? 'row-span-2' : 'row-span-1'} relative cursor-pointer group`} onClick={() => handleImageClick(image.url)}>
                                    <Image src={image.url} alt={image.alt || `Property view ${index + 2}`} layout="fill" objectFit="cover" sizes="25vw" className="transition-opacity hover:opacity-90" onError={(e) => e.currentTarget.src = '/images/placeholder-property.jpg'} />
                                </div>
                            ))}
                            {mainGalleryImage && sideGalleryImages.length < 1 && <div className="col-span-1 row-span-2 bg-gray-200"></div>}
                            {mainGalleryImage && sideGalleryImages.length < 2 && <div className="col-span-1 row-span-1 bg-gray-200"></div>}
                        </div>
                        {allImages.length > 1 && (
                            <div className="flex space-x-1.5 mt-1.5 overflow-x-auto pb-1">
                                {allImages.map((img, idx) => (
                                    <div key={`thumb-${idx}`} className={`relative w-20 h-14 rounded-sm overflow-hidden cursor-pointer border-2 shrink-0 ${activeImage === img.url ? 'border-blue-500' : 'border-transparent hover:border-gray-400'}`} onClick={() => handleImageClick(img.url)}>
                                        <Image src={img.url} alt={img.alt || `Thumbnail ${idx+1}`} layout="fill" objectFit="cover" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="md:col-span-4 space-y-4">
                        {property.googleMaps && (
                            <div id="map-section" className="bg-white rounded-md h-48 md:h-56 overflow-hidden border border-gray-200 shadow-sm">
                                {property.googleMaps.startsWith('<iframe') ? (
                                    <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: property.googleMaps.replace(/width=".*?"/, 'width="100%"').replace(/height=".*?"/, 'height="100%"')}} />
                                ) : (
                                     <iframe title={`${property.title} location map`} src={property.googleMaps} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
                                )}
                            </div>
                        )}
                        {renderPropertyHighlights()}
                    </div>
                </div>

                <div className="bg-white p-4 rounded-md border border-gray-200 mb-5">
                    <h2 className="text-xl font-bold text-gray-800 mb-3">About this property</h2>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{property.description || "No detailed description available."}</p>
                </div >

                <SignedOut>
                    <div className="bg-yellow-50 border border-yellow-300 p-4 rounded-md mb-6 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-yellow-800">Sign in, save money</h3>
                            <p className="text-sm text-yellow-700">To see if you can save 10% or more at this property, sign in</p>
                            <div className="mt-2">
                                <button onClick={() => openSignIn({ redirectUrl: typeof window !== 'undefined' ? window.location.href : undefined})} className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded-md hover:bg-blue-700 mr-2">Sign in</button>
                                <button onClick={() => openSignIn({ redirectUrl: typeof window !== 'undefined' ? window.location.href : undefined })} className="text-blue-600 text-sm font-semibold hover:underline">Create an account</button>
                            </div>
                        </div>
                        <Image src="/images/genius-logo.png" alt="Genius Loyalty Program" width={80} height={80} />
                    </div>
                </SignedOut>

                <div className="bg-white p-0 rounded-md border border-gray-200 mb-6">
                    <div className="bg-gray-50 p-4 border-b border-gray-200">
                        <h2 className="text-xl font-bold text-gray-800 mb-3">Select your rooms</h2>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                            <div className="md:col-span-1">
                                <label htmlFor="checkin-date-table" className="block text-xs font-medium text-gray-500 mb-1">Check-in</label>
                                <input id="checkin-date-table" type="date" value={checkInDate ? checkInDate.toISOString().split('T')[0] : ''} onChange={handleCheckInChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm shadow-sm" min={property.startDate} max={property.endDate} required />
                            </div>
                             <div className="md:col-span-1">
                                <label htmlFor="checkout-date-table" className="block text-xs font-medium text-gray-500 mb-1">Check-out</label>
                                <input id="checkout-date-table" type="date" value={checkOutDate ? checkOutDate.toISOString().split('T')[0] : ''} onChange={handleCheckOutChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm shadow-sm" min={checkInDate ? new Date(checkInDate.getTime() + 86400000).toISOString().split('T')[0] : property.startDate} max={property.endDate} required disabled={!checkInDate} />
                            </div>
                            <div className="md:col-span-1">
                                <label htmlFor="adult-count-selector" className="block text-xs font-medium text-gray-500 mb-1">Adults</label>
                                <select 
                                    id="adult-count-selector" 
                                    value={adultCount} // This value is now updated by useEffect if rooms are selected
                                    onChange={e => {
                                        // If user changes dropdown, this sets adultCount.
                                        // If rooms are ALREADY selected, pricing useEffect will likely re-derive and override this.
                                        // If NO rooms selected, this sets the desired adult count.
                                        setAdultCount(parseInt(e.target.value));
                                        setBookingError(null); // Clear errors when user interacts
                                    }} 
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 text-sm shadow-sm"
                                >
                                    {[...Array(10)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
                                </select>
                            </div>
                             <div className="md:col-span-1">
                                <label htmlFor="child-count-selector" className="block text-xs font-medium text-gray-500 mb-1">Children (0-17)</label>
                                 <select id="child-count-selector" value={childCount} onChange={e => {setChildCount(parseInt(e.target.value)); setBookingError(null);}} className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 text-sm shadow-sm">
                                    {[...Array(6)].map((_, i) => <option key={i} value={i}>{i}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="mt-4">
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Preferred Meal Plan (for all rooms):</label>
                            <div className="flex flex-wrap gap-2">
                                {(['noMeal', 'breakfastOnly', 'allMeals'] as (keyof PricingByMealPlan)[]).map(plan => {
                                    const labelText = { noMeal: 'Room Only', breakfastOnly: 'Breakfast', allMeals: 'All Meals'}[plan];
                                    return (
                                    <label key={`meal-plan-table-${plan}`} className={`flex items-center px-2.5 py-1 border rounded-md cursor-pointer transition-colors text-xs ${selectedMealPlan === plan ? 'bg-blue-100 border-blue-400 ring-1 ring-blue-400' : 'border-gray-300 hover:bg-gray-100'}`}>
                                        <input type="radio" name="mealPlanTable" value={plan} checked={selectedMealPlan === plan} onChange={handleMealPlanChange} className="h-3 w-3 text-blue-600 border-gray-300 focus:ring-blue-500 mr-1.5" />
                                        <span className={`${selectedMealPlan === plan ? 'text-blue-700 font-semibold' : 'text-gray-600'}`}>{labelText}</span>
                                    </label>
                                    );
                                })}
                            </div>
                        </div>
                         {availabilityError && <div className="mt-3 p-2 bg-yellow-100 text-yellow-800 text-xs rounded-md border border-yellow-300 flex items-start"><CalendarOff className='h-3.5 w-3.5 mr-1.5 shrink-0 text-yellow-600 mt-px'/><p>{availabilityError}</p></div>}
                         {bookingError && <div id="main-page-booking-error" className="mt-3 p-2 bg-red-100 text-red-700 text-xs rounded-md border border-red-300 flex items-start"><AlertTriangle className='h-3.5 w-3.5 mr-1.5 shrink-0 text-red-500 mt-px'/><p>{bookingError}</p></div>}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1000px]">
                            <thead className="bg-gray-100 text-left text-xs text-gray-500 uppercase tracking-wider">
                                <tr>
                                    <th className="px-4 py-2.5 font-semibold w-[30%]">Room type</th>
                                    <th className="px-3 py-2.5 font-semibold text-center w-[10%]">Offer for</th>
                                    <th className="px-3 py-2.5 font-semibold w-[20%]">Price for {days > 0 ? `${days} night${days > 1 ? 's' : ''}` : 'N/A'}</th>
                                    <th className="px-3 py-2.5 font-semibold w-[25%]">Your choices</th>
                                    <th className="px-4 py-2.5 font-semibold text-center w-[15%]">Select rooms</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {displayableRoomOffers.length === 0 && property.categoryRooms && property.categoryRooms.length > 0 && (
                                    <tr><td colSpan={5} className="text-center py-6 text-gray-500">No pricing options available for the selected meal plan. Try another plan.</td></tr>
                                )}
                                {!property.categoryRooms || property.categoryRooms.length === 0 && (
                                     <tr><td colSpan={5} className="text-center py-8 text-gray-500">No room types available for this property.</td></tr>
                                )}
                                {property.categoryRooms && property.categoryRooms.map((category) => {
                                    const offersForThisCategory = displayableRoomOffers.filter(offer => offer.categoryId === category.id || offer.categoryId === category._id);
                                    if (offersForThisCategory.length === 0) return null;

                                    return (
                                        <React.Fragment key={category.id || category._id}>
                                            {offersForThisCategory.map((offer, offerIndex) => {
                                                const currentQtySelected = selectedOffers[offer.offerId] || 0;
                                                const totalPriceForOfferNights = offer.pricePerNight * days;
                                                const totalOriginalPriceForOfferNights = offer.originalPricePerNight ? offer.originalPricePerNight * days : 0;
                                                
                                                const serviceFeePerRoomNightApproximation = (SERVICE_FEE_FIXED * days) / Math.max(1, totalSelectedPhysicalRooms || 1); // Distribute booking service fee approx
                                                const illustrativeTaxForOffer = (totalPriceForOfferNights + serviceFeePerRoomNightApproximation) * TAX_RATE_PERCENTAGE; 
                                                
                                                let sumOfOtherOffersInCat = 0;
                                                Object.keys(selectedOffers).forEach(oId => {
                                                    if ((oId.startsWith(category.id + '_') || oId.startsWith(category._id + '_')) && oId !== offer.offerId) {
                                                        sumOfOtherOffersInCat += selectedOffers[oId];
                                                    }
                                                });
                                                // const remainingForCat = category.qty - sumOfOtherOffersInCat;
                                                
                                                // let sumOfOffersInOtherCats = 0;
                                                // Object.keys(selectedOffers).forEach(oId => {
                                                //     if (!(oId.startsWith(category.id + '_') || oId.startsWith(category._id + '_'))) {
                                                //         sumOfOffersInOtherCats += selectedOffers[oId];
                                                //     }
                                                // });
                                                // const remainingForTotalMax = MAX_COMBINED_ROOMS - sumOfOffersInOtherCats - sumOfOtherOffersInCat; // this is wrong if sumOfOtherOffersInCat included current offer
                                                const maxSelectableForThisOffer = Math.min(category.qty - sumOfOtherOffersInCat, MAX_COMBINED_ROOMS - (totalSelectedPhysicalRooms - currentQtySelected));


                                                return (
                                                    <tr key={offer.offerId} className={`${currentQtySelected > 0 ? 'bg-blue-50/50' : ''}`}>
                                                        {offerIndex === 0 ? (
                                                            <td className="px-4 py-3 align-top" rowSpan={offersForThisCategory.length}>
                                                                <a href="#" onClick={(e) => e.preventDefault()} className="font-semibold text-blue-600 hover:underline text-sm">{offer.categoryTitle}</a>
                                                                {offer.bedConfiguration && <p className="text-xs text-gray-600 mt-0.5 flex items-center"><Bed size={14} className="mr-1.5 text-gray-500" />{offer.bedConfiguration}</p>}
                                                                {offer.size && <p className="text-xs text-gray-500 mt-0.5">Size: {offer.size}</p>}
                                                                <div className="mt-1.5 space-y-0.5">
                                                                    {(offer.roomSpecificAmenities?.slice(0,2) || property.roomFacilities?.slice(0,2) || []).map(amenity => (
                                                                        <div key={amenity} className="flex items-center text-xs text-gray-600">
                                                                            {getAmenityIcon(amenity)} <span className="ml-1.5">{formatAmenityName(amenity)}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </td>
                                                        ) : null }

                                                        <td className="px-3 py-3 align-top text-center">
                                                            <div className="flex justify-center items-center">
                                                                {[...Array(offer.intendedAdults)].map((_, i) => <UsersIcon key={i} size={14} className={`text-gray-500 ${i > 0 ? 'ml-0.5' : ''}`} />)}
                                                            </div>
                                                            <p className="text-xs text-gray-500 mt-1">Max {offer.guestCapacityInOffer} total</p>
                                                        </td>
                                                        <td className="px-3 py-3 align-top">
                                                            {days > 0 && offer.pricePerNight > 0 ? (
                                                                <>
                                                                    {offer.isDiscounted && offer.originalPricePerNight && totalPriceForOfferNights < totalOriginalPriceForOfferNights && (
                                                                        <p className="text-xs text-gray-400 line-through">{offer.currency} {totalOriginalPriceForOfferNights.toLocaleString()}</p>
                                                                    )}
                                                                    <p className="text-lg font-bold text-gray-800">{offer.currency} {totalPriceForOfferNights.toLocaleString()}</p>
                                                                    <p className="text-[11px] text-gray-500">+ {offer.currency} {illustrativeTaxForOffer.toFixed(0)} taxes & charges (approx)</p>
                                                                    {offer.isDiscounted && <span className="text-xs bg-red-500 text-white font-semibold px-1.5 py-0.5 rounded-sm mt-1 inline-block">Deal!</span>}
                                                                </>
                                                            ) : days > 0 ? (
                                                                <p className="text-sm text-red-500">Price not available</p>
                                                            ) : (
                                                                <p className="text-sm text-gray-500">Select dates</p>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-3 align-top text-xs text-gray-600 space-y-1">
                                                            <p className="flex items-center text-green-600 font-semibold">
                                                                <CheckCircle size={14} className="mr-1.5 shrink-0" /> 
                                                                {selectedMealPlan === 'breakfastOnly' ? 'Very good breakfast included' : selectedMealPlan === 'allMeals' ? 'All meals included' : 'Room only'}
                                                                <HelpCircle size={13} className="ml-1 text-gray-400 hover:text-gray-600 cursor-pointer" aria-label={`Price shown is for ${selectedMealPlan === 'noMeal' ? 'room only' : selectedMealPlan === 'breakfastOnly' ? 'room with breakfast' : 'room with all meals'}.`} />
                                                            </p>
                                                            {property.reservationPolicy && property.reservationPolicy.length > 0 && property.reservationPolicy[0].toLowerCase().includes('cancel') ? (
                                                                <p className="flex items-center text-green-600"><CheckCircle size={14} className="mr-1.5 shrink-0" /> {property.reservationPolicy[0]}</p>
                                                            ) : (
                                                                <p className="flex items-center text-green-600"><CheckCircle size={14} className="mr-1.5 shrink-0" /> Free cancellation option often available</p> 
                                                            )}
                                                             <p className="text-gray-500 text-[11px]">&bull; Pay options vary by policy</p>
                                                        </td>
                                                        <td className="px-4 py-3 align-top text-center">
                                                            {category.qty > 0 ? (
                                                                <select 
                                                                    value={currentQtySelected} 
                                                                    onChange={(e) => handleOfferQuantityChange(offer.offerId, parseInt(e.target.value))}
                                                                    className="p-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 w-20"
                                                                    disabled={days <= 0 || maxSelectableForThisOffer < 0 || availabilityError ? true : false}
                                                                >
                                                                    {[...Array(Math.max(0, maxSelectableForThisOffer) + 1)].map((_, i) => (
                                                                        <option key={i} value={i}>{i}</option>
                                                                    ))}
                                                                </select>
                                                            ) : (
                                                                <span className="text-xs text-red-500">Sold out</span>
                                                            )}
                                                             <p className="text-[11px] text-gray-500 mt-1">Max {category.qty} for {category.title}</p>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </React.Fragment>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                     {displayableRoomOffers.length > 0 && days > 0 && totalSelectedPhysicalRooms > 0 && (
                        <div className="p-4 border-t border-gray-200">
                            <div className="mb-2 text-left">
                                {totalBookingPricing > 0 && !bookingError ? (
                                     <p className="text-sm text-gray-700">
                                        Selected: <span className="font-semibold">{totalSelectedPhysicalRooms} room{totalSelectedPhysicalRooms !== 1 && 's'}</span> for <span className="font-semibold">{globalGuestCount} guest{globalGuestCount !== 1 && 's'}</span> ({adultCount} Ad, {childCount} Ch) for <span className="font-semibold">{days} night{days !== 1 && 's'}.</span>
                                        <br/>Total price: <strong className="text-xl ml-1 text-blue-700">{property.costing.currency} {totalBookingPricing.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                                    </p>
                                ) : bookingError ? null 
                                : ( totalSelectedPhysicalRooms > 0 && days > 0 && 
                                     <p className="text-sm text-red-600">Total price cannot be calculated. Please review selections.</p>
                                )}
                            </div>
                            <div className="text-right">
                                <button 
                                    onClick={handleBookNowOrReserveClick}
                                    disabled={!checkInDate || !checkOutDate || days <= 0 || totalSelectedPhysicalRooms <= 0 || !!availabilityError || totalBookingPricing <=0 || !!bookingError}
                                    className="bg-blue-600 text-white font-semibold py-2.5 px-6 rounded-md hover:bg-blue-700 text-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    I&apos;ll reserve
                                </button>
                                <p className="text-xs text-gray-500 mt-1 text-left">You won&apos;t be charged yet. Final confirmation on next step.</p>
                            </div>
                        </div>
                    )}
                </div>


                <section className="bg-white p-4 sm:p-6 rounded-md border border-gray-200 mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center"><ListChecks className="mr-2 h-5 w-5 text-blue-600" />Most Popular Facilities</h2>
                    {(property.amenities || property.facilities) && ((property.amenities && property.amenities.length > 0) || (property.facilities && property.facilities.length > 0)) ? (
                        <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-2`}>
                            {(showAllAmenities ? (property.facilities || property.amenities) : (property.facilities || property.amenities).slice(0, 8)).map((item, index) => (
                                <div key={`pop-facil-${index}`} className="flex items-center py-1">
                                    {getAmenityIcon(item)}
                                    <span className="ml-2 text-sm text-gray-700">{formatAmenityName(item)}</span>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-sm text-gray-500">No specific popular facilities listed.</p>}
                    {(property.facilities || property.amenities) && (property.facilities || property.amenities).length > 8 && (
                        <button onClick={() => setShowAllAmenities(!showAllAmenities)} className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-semibold flex items-center">
                            {showAllAmenities ? 'Show less' : `Show all ${(property.facilities || property.amenities).length} facilities`} 
                            {showAllAmenities ? <ChevronUp size={16} className="ml-1" /> : <ChevronDown size={16} className="ml-1" />}
                        </button>
                    )}
                </section>
            </div> 

            {showBookingModal && property && property.costing && checkInDate && checkOutDate && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
                    <div className="bg-white rounded-lg max-w-lg w-full p-6 sm:p-7 max-h-[90vh] overflow-y-auto shadow-xl">
                         <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-200">
                             <h3 className="text-xl font-bold text-gray-800">Confirm your booking</h3>
                             <button onClick={() => {setShowBookingModal(false); setModalBookingError(null);}} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={24} /></button>
                         </div>

                        <div className="mb-5 space-y-3">
                            <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-md border border-gray-200">
                                {activeImage && <div className="relative h-16 w-24 mr-1 rounded-md overflow-hidden flex-shrink-0 shadow-sm"><Image src={activeImage} alt={property.title || "Property image"} layout="fill" objectFit="cover" onError={(e) => (e.currentTarget as HTMLImageElement).src = '/images/placeholder-property.jpg'} /></div>}
                                <div className="flex-grow">
                                    <h4 className="font-semibold text-md text-gray-800">{property.title || "N/A"}</h4>
                                    <p className="text-xs text-gray-500">{property.location.city}, {property.location.country}</p>
                                     {(property.totalRating != null && property.totalRating > 0) && (
                                        <div className="flex items-center mt-0.5">{renderRatingStars(property.totalRating, "w-3.5 h-3.5")}<span className="text-xs ml-1 text-gray-500">({property.totalRating.toFixed(1)})</span></div>
                                     )}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-x-3 gap-y-2 p-3 bg-gray-50 rounded-md border border-gray-200 text-xs">
                                <div><div className="text-gray-500 uppercase tracking-wide text-[10px]">Check-in</div><div className="font-medium text-gray-700">{checkInDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div></div>
                                <div><div className="text-gray-500 uppercase tracking-wide text-[10px]">Check-out</div><div className="font-medium text-gray-700">{checkOutDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div></div>
                                <div><div className="text-gray-500 uppercase tracking-wide text-[10px]">Duration</div><div className="font-medium text-gray-700">{days} {days === 1 ? 'night' : 'nights'}</div></div>
                                {/* globalGuestCount uses the derived adultCount state */}
                                <div><div className="text-gray-500 uppercase tracking-wide text-[10px]">Guests</div><div className="font-medium text-gray-700">{globalGuestCount} ({adultCount} Ad, {childCount} Ch)</div></div>
                                <div className="col-span-2"><div className="text-gray-500 uppercase tracking-wide text-[10px]">Meal Plan</div><div className="font-medium text-gray-700">{selectedMealPlan === 'noMeal' ? 'Room Only' : selectedMealPlan === 'breakfastOnly' ? 'Breakfast Included' : 'All Meals'}</div></div>
                                <div className="col-span-2"><div className="text-gray-500 uppercase tracking-wide text-[10px]">Rooms</div><div className="font-medium text-gray-700">{totalSelectedPhysicalRooms} room{totalSelectedPhysicalRooms !== 1 && 's'} selected</div></div>
                            </div>
                             <div className="flex flex-col space-y-1 p-3 bg-blue-50 rounded-md border border-blue-200">
                                <div className="flex justify-between text-xs"><span className="text-gray-600">Subtotal ({days} {days === 1 ? 'night' : 'nights'})</span><span className="text-gray-700 font-medium">{property.costing.currency} {subtotalNights.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                                <div className="flex justify-between text-xs"><span className="text-gray-600">Service Fee</span><span className="text-gray-700 font-medium">{property.costing.currency} {serviceCharge.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                                <div className="flex justify-between text-xs"><span className="text-gray-600">Taxes & Fees (approx. {TAX_RATE_PERCENTAGE * 100}%)</span><span className="text-gray-700 font-medium">{property.costing.currency} {taxesApplied.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                                <div className="flex justify-between font-bold text-md pt-1.5 border-t border-blue-200 mt-1.5 text-blue-700"><span>Grand Total</span><span>{property.costing.currency} {totalBookingPricing.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                            </div>
                        </div>

                        <div className="space-y-3.5">
                            <h4 className="text-md font-semibold text-gray-700 pt-3 border-t border-gray-200">Your Information</h4>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><div><label className="block text-xs font-medium text-gray-600 mb-0.5" htmlFor="modal-firstName">First Name</label><input id="modal-firstName" type="text" name="firstName" value={bookingData.firstName} onChange={handleInputChange} required className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 text-sm"/></div><div><label className="block text-xs font-medium text-gray-600 mb-0.5" htmlFor="modal-lastName">Last Name</label><input id="modal-lastName" type="text" name="lastName" value={bookingData.lastName} onChange={handleInputChange} required className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 text-sm"/></div></div>
                             <div><label className="block text-xs font-medium text-gray-600 mb-0.5" htmlFor="modal-email">Email</label><input id="modal-email" type="email" name="email" value={bookingData.email} onChange={handleInputChange} required className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 text-sm"/></div>
                             <div><label className="block text-xs font-medium text-gray-600 mb-0.5" htmlFor="modal-phone">Phone Number</label><input id="modal-phone" type="tel" name="phone" value={bookingData.phone} onChange={handleInputChange} required className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 text-sm"/></div>
                             <div><label className="block text-xs font-medium text-gray-600 mb-0.5" htmlFor="modal-specialRequests">Special Requests</label><textarea id="modal-specialRequests" name="specialRequests" value={bookingData.specialRequests} onChange={handleInputChange} rows={2} className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 text-sm" placeholder="Optional (e.g., late check-in)"></textarea></div>

                            {modalBookingError && <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-md border border-red-200">{modalBookingError}</div>}
                            
                            <RazorpayPaymentButton
                                amountInSubunits={Math.round(totalBookingPricing * 100)}
                                currency={property.costing.currency}
                                receiptId={`booking_${property._id}_${Date.now()}`}
                                bookingPayload={{ 
                                    type: "property" as const,
                                    details: {
                                        id: params?.id as string,
                                        title: property.title || "N/A",
                                        ownerId: property.userId || "N/A",
                                        locationFrom: "NA",
                                        locationTo: `${property.location.address}, ${property.location.city}, ${property.location.country}`,
                                        type: property.type as PropertyType,
                                    },
                                    bookingDetails: {
                                        checkIn: checkInDate.toISOString(), 
                                        checkOut: checkOutDate.toISOString(),
                                        adults: adultCount, // Uses the derived adultCount state
                                        children: childCount,
                                        totalGuests: globalGuestCount, // Uses derived adultCount
                                        totalRoomsSelected: totalSelectedPhysicalRooms,
                                        selectedMealPlan: selectedMealPlan,
                                        roomsDetail: Object.entries(selectedOffers)
                                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                            .filter(([_, qty]) => qty > 0)
                                            .map(([offerId, qty]) => {
                                                const offer = displayableRoomOffers.find(o => o.offerId === offerId);
                                                return {
                                                    categoryId: offer?.categoryId || 'unknown',
                                                    offerKey: offerId.split('_').slice(1).join('_'),
                                                    title: offer?.categoryTitle || 'Unknown Room',
                                                    qty: qty,
                                                    estimatedPricePerRoomNight: offer?.pricePerNight || 0,
                                                    currency: offer?.currency || property.costing?.currency || 'USD'
                                                };
                                            }),
                                        calculatedPricePerNight: totalBookingPricePerNight,
                                        currency: property.costing?.currency || 'USD',
                                        numberOfNights: days,
                                        subtotal: subtotalNights,
                                        serviceFee: serviceCharge,
                                        taxes: taxesApplied,
                                        totalPrice: totalBookingPricing,
                                    },
                                    guestDetails: {
                                        firstName: bookingData.firstName,
                                        lastName: bookingData.lastName,
                                        email: bookingData.email,
                                        phone: bookingData.phone,
                                        specialRequests: bookingData.specialRequests,
                                    },
                                    recipients: [bookingData.email, user?.primaryEmailAddress?.emailAddress, 'your-admin-email@example.com'].filter(Boolean) as string[]
                                }}
                                prefill={{
                                    name: `${bookingData.firstName} ${bookingData.lastName}`,
                                    email: bookingData.email,
                                    contact: bookingData.phone,
                                }}
                                notes={{
                                    propertyTitle: property.title || "N/A",
                                    checkIn: checkInDate?.toISOString().split('T')[0] || "N/A",
                                    checkOut: checkOutDate?.toISOString().split('T')[0] || "N/A",
                                }}
                                onPaymentSuccess={(confirmationData) => {
                                    console.log("Payment successful, booking confirmed by backend:", confirmationData);
                                    setBookingConfirmed(true);
                                    setShowBookingModal(false); 
                                    setModalBookingError(null);
                                    if (typeof window !== 'undefined') {
                                        localStorage.removeItem(LOCAL_STORAGE_KEY);
                                    }
                                }}
                                onPaymentError={(errorMessage) => {
                                    setModalBookingError(errorMessage);
                                }}
                                razorpayKeyId={RAZORPAY_KEY_ID}
                                companyName="YourStays.com" 
                                disabled={
                                    !bookingData.firstName || 
                                    !bookingData.lastName || 
                                    !bookingData.email || 
                                    !bookingData.phone || 
                                    totalBookingPricing <= 0 ||
                                    !!availabilityError || 
                                    !!bookingError
                                }
                                buttonText={`Pay ${property.costing.currency} ${totalBookingPricing.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} & Book`}
                            />
                        </div>
                    </div>
                </div>
            )}

            {bookingConfirmed && property && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[110] backdrop-blur-sm">
                    <div className="bg-white rounded-lg max-w-md w-full p-7 text-center shadow-xl">
                        <div className="mb-4"><div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center border-2 border-green-200"><CheckCircle className="w-10 h-10 text-green-500" /></div></div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Booking Confirmed!</h3>
                        <p className="mb-5 text-sm text-gray-600">Your booking for <span className="font-semibold">{property.title}</span> is confirmed. A confirmation email has been sent to <span className="font-semibold">{bookingData.email}</span>.</p>
                        <button onClick={() => { setBookingConfirmed(false); router.refresh(); }} className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400">Great!</button>
                    </div>
                </div>
            )}
        </div>
    );
}