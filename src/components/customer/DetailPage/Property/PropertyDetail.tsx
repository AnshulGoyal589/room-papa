'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
// import { formatDistanceToNow } from 'date-fns';
import { Property } from '@/lib/mongodb/models/Property'; // Base Property type from model
// --- ADJUST TYPE IMPORTS AS PER YOUR ACTUAL FILE ---
// Assuming your types file defines these based on the admin form changes
import {
    BookingFormData,
    // PropertyAmenities,
    // StoredRoomCategory, // Removed import, using local definition
    PropertyType,
    PricingByMealPlan,
    DiscountedPricingByMealPlan
} from '@/types';
import DummyReviews from './Reviews'; // Assuming this component exists
import { useUser, useClerk } from '@clerk/nextjs';
import {
    Wifi, Car, Droplet, Wind, Dumbbell, Sparkles, Utensils, Briefcase, Tv, Coffee, BedDouble, SunMedium, ShieldAlert, Filter, Drama, CheckCircle, FileText, Building, Star as StarIcon, MapPin, Users as UsersIcon, Image as ImageIcon, CalendarOff, X,
    ChevronDown, ChevronUp // Added Chevron icons and Wheelchair
} from 'lucide-react';
import { ObjectId } from 'mongodb';

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

// Updated Room Category type (Uncommented and will be used)
interface StoredRoomCategory {
    id: string; // Ensure ID is consistently used
    _id?: string; // Mongoose ID might still be present
    title: string;
    qty: number;
    currency: string;
    pricing: RoomCategoryPricing; // Use the detailed pricing structure
    unavailableDates: string[]; // Array of dates in 'YYYY-MM-DD' format
}

// Update Property type to use the new StoredRoomCategory
interface ExtendedProperty extends Omit<Property, 'categoryRooms' | 'costing' | 'rooms'> {
    _id?: ObjectId; // Allow both string and ObjectId for compatibility and make it optional
    categoryRooms: StoredRoomCategory[];
    costing: { // Calculated overview
        price: number; // Overall min price per adult
        discountedPrice: number; // Overall min discounted price per adult
        currency: string;
    };
    rooms: number; // Calculated total qty
    // Keep other fields from Property type
    startDate: string; // Overall listing start date (YYYY-MM-DD)
    endDate: string;   // Overall listing end date (YYYY-MM-DD)
    createdAt: Date; // Ensure it's a Date object
    updatedAt: Date; // Ensure it's a Date object
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
        dates.push(currentDate.toISOString().split('T')[0]); // Format as YYYY-MM-DD
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
};

// Helper to get price safely from nested structure
const getPrice = (
    priceGroup: PricingByMealPlan | DiscountedPricingByMealPlan | undefined,
    mealPlan: keyof PricingByMealPlan
): number => {
    // Check if priceGroup exists and has the mealPlan key
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
const LOCAL_STORAGE_KEY = 'propertyBookingPreferences_v2'; // Use new key for new structure
const MAX_COMBINED_ROOMS = 5;
const MAX_OCCUPANTS_PER_ROOM = 3;

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
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const [checkInDate, setCheckInDate] = useState<Date | null>(null);
    const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
    const [adultCount, setAdultCount] = useState<number>(1);
    const [childCount, setChildCount] = useState<number>(0);
    const [selectedRooms, setSelectedRooms] = useState<Record<string, number>>({}); // Key: category ID, Value: quantity
    const [selectedMealPlan, setSelectedMealPlan] = useState<keyof PricingByMealPlan>('noMeal'); // State for meal plan

    const [totalSelectedRooms, setTotalSelectedRooms] = useState<number>(0);
    const [totalBookingPricePerNight, setTotalBookingPricePerNight] = useState<number>(0);
    const [subtotalNights, setSubtotalNights] = useState<number>(0);
    const [serviceCharge, setServiceCharge] = useState<number>(0);
    const [taxesApplied, setTaxesApplied] = useState<number>(0);
    const [totalBookingPricing, setTotalBookingPricing] = useState<number>(0);
    const [availabilityError, setAvailabilityError] = useState<string | null>(null); // For unavailable dates


    const [showBookingModal, setShowBookingModal] = useState(false);
    const [bookingData, setBookingData] = useState<BookingFormData>({ firstName: '', lastName: '', email: '', phone: '', passengers: 1, rooms: 0, specialRequests: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [bookingConfirmed, setBookingConfirmed] = useState(false);
    const [bookingError, setBookingError] = useState<string | null>(null); // General booking errors

    // States for "Read More" toggles
    const [showAllAmenities, setShowAllAmenities] = useState(false);
    const [showAllFacilities, setShowAllFacilities] = useState(false);
    const [showAllRoomFacilities, setShowAllRoomFacilities] = useState(false);
    const [showAllPropertyAccess, setShowAllPropertyAccess] = useState(false);
    const [showAllRoomAccess, setShowAllRoomAccess] = useState(false);
    const [showAllFunThings, setShowAllFunThings] = useState(false);
    const [showAllMeals, setShowAllMeals] = useState(false);
    const [showAllBedOptions, setShowAllBedOptions] = useState(false);

    const initialMobileDisplayCount = 4; // Number of items to show initially on mobile

    const guestCount = useMemo(() => adultCount, [adultCount]);
    const days = useMemo(() => calculateDays(checkInDate, checkOutDate), [checkInDate, checkOutDate]);

    // Validate date against property's overall availability window
    const validateDate = (selectedDateStr: string, propertyStartDateStr: string, propertyEndDateStr: string): Date => {
        const date = new Date(selectedDateStr); date.setHours(12, 0, 0, 0); // Use noon to avoid TZ issues with boundaries
        const minDate = new Date(propertyStartDateStr); minDate.setHours(0, 0, 0, 0);
        const maxDate = new Date(propertyEndDateStr); maxDate.setHours(23, 59, 59, 999);

        if (date < minDate) return minDate;
        if (date > maxDate) return maxDate;
        return date;
    };

     // Check if the selected dates are available for the chosen rooms
     const checkAvailabilityForSelection = useCallback((
        startDate: Date | null,
        endDate: Date | null,
        currentSelectedRooms: Record<string, number>,
        allCategories: StoredRoomCategory[] | undefined
    ): { available: boolean; message: string | null } => {
        if (!startDate || !endDate || endDate <= startDate || !allCategories || Object.keys(currentSelectedRooms).length === 0) {
            return { available: true, message: null }; // No dates or rooms selected, or invalid range
        }

        const dateRange = getDatesInRange(startDate, endDate); // Gets dates [start, end)
        if (dateRange.length === 0) return { available: true, message: null }; // Single day selection? Or invalid range result.

        for (const [catId, qty] of Object.entries(currentSelectedRooms)) {
            if (qty > 0) {
                const category = allCategories.find(c => c.id === catId || c._id === catId); // Check both id and _id
                if (category && category.unavailableDates && category.unavailableDates.length > 0) {
                    for (const dateStr of dateRange) {
                        if (category.unavailableDates.includes(dateStr)) {
                            return {
                                available: false,
                                message: `Room type "${category.title}" is unavailable on ${dateStr}. Please adjust dates or room selection.`
                            };
                        }
                    }
                }
            }
        }

        return { available: true, message: null }; // All selected rooms are available for the range
    }, []); // Empty dependency array as getDatesInRange is a global helper


    // Fetch Property Details
    useEffect(() => {
        const fetchPropertyDetails = async () => {
            if (!params?.id) return;
            try {
                setLoading(true); setError(null); setAvailabilityError(null);
                const response = await fetch(`/api/properties/${params.id}`);
                if (!response.ok) throw new Error(`Failed to fetch property: ${response.statusText} (${response.status})`);
                const data = await response.json();
                if (!data || typeof data !== 'object' || !data._id) throw new Error('Invalid property data received');

                // Ensure overall start/end dates exist, provide fallbacks if missing
                const propertyStartDate = data.startDate ? new Date(data.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
                const propertyEndDate = data.endDate ? new Date(data.endDate).toISOString().split('T')[0] : new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0]; // Default to 1 year if missing

                const parsedProperty: ExtendedProperty = {
                    ...(data as Property), // Cast base properties
                    _id: data._id, // Ensure _id is explicitly part of ExtendedProperty
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
                        currency: cat.currency || "USD",
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
                    })) : [],
                    review: Array.isArray(data.review) ? data.review : [],
                    costing: data.costing || { price: 0, discountedPrice: 0, currency: 'USD' },
                    rooms: data.rooms || 0, 
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

    // Load preferences from Local Storage
    useEffect(() => {
        if (property && typeof window !== 'undefined') {
            const storedPreferences = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (storedPreferences) {
                try {
                    const parsedPrefs = JSON.parse(storedPreferences);
                    if (parsedPrefs.propertyId === property._id) {
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
                        
                        let tempSelectedRooms: Record<string, number> = {};
                        if (typeof parsedPrefs.selectedRooms === 'object' && parsedPrefs.selectedRooms !== null && property.categoryRooms) {
                            const validSelectedRooms: Record<string, number> = {};
                            let currentTotalRoomsFromStorage = 0;
                            for (const [catId, qty] of Object.entries(parsedPrefs.selectedRooms)) {
                                if (typeof qty === 'number' && qty > 0) {
                                    const categoryInfo = property.categoryRooms.find(cat => cat.id === catId || cat._id === catId);
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
                            tempSelectedRooms = validSelectedRooms;
                        }

                        // Set states
                        setCheckInDate(tempCheckInDate);
                        setCheckOutDate(tempCheckOutDate);
                        if (typeof parsedPrefs.adultCount === 'number' && parsedPrefs.adultCount >= 1) setAdultCount(parsedPrefs.adultCount);
                        if (typeof parsedPrefs.childCount === 'number' && parsedPrefs.childCount >= 0) setChildCount(parsedPrefs.childCount);
                        setSelectedRooms(tempSelectedRooms);
                        if (parsedPrefs.selectedMealPlan && ['noMeal', 'breakfastOnly', 'allMeals'].includes(parsedPrefs.selectedMealPlan)) {
                            setSelectedMealPlan(parsedPrefs.selectedMealPlan);
                        } else { setSelectedMealPlan('noMeal'); }
                        
                        const { available, message } = checkAvailabilityForSelection(
                            tempCheckInDate, 
                            tempCheckOutDate, 
                            tempSelectedRooms, 
                            property.categoryRooms
                        );
                         if (!available) {
                             setAvailabilityError(message);
                         } else {
                             setAvailabilityError(null);
                         }
                    } else {
                         localStorage.removeItem(LOCAL_STORAGE_KEY);
                    }
                } catch (e) { console.error("Failed to parse booking preferences", e); localStorage.removeItem(LOCAL_STORAGE_KEY); }
            }
        }
    }, [property, checkAvailabilityForSelection]);


    // Save preferences to Local Storage
    useEffect(() => {
        if (property && typeof window !== 'undefined' && !loading) {
            const preferencesToSave = {
                propertyId: property._id, 
                checkInDate: checkInDate ? checkInDate.toISOString() : null,
                checkOutDate: checkOutDate ? checkOutDate.toISOString() : null,
                adultCount,
                childCount,
                selectedRooms,
                selectedMealPlan,
            };
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(preferencesToSave));
        }
    }, [checkInDate, checkOutDate, adultCount, childCount, selectedRooms, selectedMealPlan, property, loading]);


    // Calculate Total Price based on selection and MEAL PLAN
    useEffect(() => {
        if (!property?.categoryRooms || totalSelectedRooms === 0 || guestCount === 0 || !checkInDate || !checkOutDate || days <= 0) {
            setTotalBookingPricePerNight(0);
            setSubtotalNights(0); setServiceCharge(0); setTaxesApplied(0); setTotalBookingPricing(0);
            return;
        }

        let calculatedPricePerNight = 0;
        let remainingAdults = adultCount;
        let remainingChildren = childCount;

        const roomInstances: { catId: string; category: StoredRoomCategory }[] = [];
        Object.entries(selectedRooms).forEach(([catId, qty]) => {
            if (qty > 0) {
                const category = property.categoryRooms?.find(c => c.id === catId || c._id === catId);
                if (category) {
                    for (let i = 0; i < qty; i++) {
                        roomInstances.push({ catId, category });
                    }
                }
            }
        });

        for (const { category } of roomInstances) {
            if (remainingAdults === 0 && remainingChildren === 0) break; 

            let roomPriceForThisInstance = 0;
            let adultsInThisRoom = 0;
            let childrenInThisRoom = 0;
            const pricing = category.pricing; 

            const adultsToAssign = Math.min(remainingAdults, MAX_OCCUPANTS_PER_ROOM);
            adultsInThisRoom = adultsToAssign;
            remainingAdults -= adultsToAssign;

            const remainingCapacity = MAX_OCCUPANTS_PER_ROOM - adultsInThisRoom;
            const childrenToAssign = Math.min(remainingChildren, remainingCapacity);
            childrenInThisRoom = childrenToAssign;
            remainingChildren -= childrenToAssign;

            let adultBasePrice = 0;
            let adultDiscountedPrice = 0;

            if (adultsInThisRoom === 3) {
                adultBasePrice = getPrice(pricing.tripleOccupancyAdultPrice, selectedMealPlan);
                adultDiscountedPrice = getPrice(pricing.discountedTripleOccupancyAdultPrice, selectedMealPlan);
            } else if (adultsInThisRoom === 2) {
                adultBasePrice = getPrice(pricing.doubleOccupancyAdultPrice, selectedMealPlan);
                adultDiscountedPrice = getPrice(pricing.discountedDoubleOccupancyAdultPrice, selectedMealPlan);
            } else if (adultsInThisRoom === 1) {
                adultBasePrice = getPrice(pricing.singleOccupancyAdultPrice, selectedMealPlan);
                adultDiscountedPrice = getPrice(pricing.discountedSingleOccupancyAdultPrice, selectedMealPlan);
            } else if (adultsInThisRoom === 0 && childrenInThisRoom > 0) {
                 adultBasePrice = getPrice(pricing.singleOccupancyAdultPrice, selectedMealPlan);
                 adultDiscountedPrice = getPrice(pricing.discountedSingleOccupancyAdultPrice, selectedMealPlan);
            }

            roomPriceForThisInstance = (adultDiscountedPrice > 0 && adultDiscountedPrice < adultBasePrice) ? adultDiscountedPrice : adultBasePrice;

            if (childrenInThisRoom > 0 && adultsInThisRoom >= 0) { 
                const childBase = getPrice(pricing.child5to12Price, selectedMealPlan); 
                const childDisc = getPrice(pricing.discountedChild5to12Price, selectedMealPlan);
                const childPricePerChild = (childDisc > 0 && childDisc < childBase) ? childDisc : childBase;
                roomPriceForThisInstance += childPricePerChild * childrenInThisRoom;
            }

            calculatedPricePerNight += roomPriceForThisInstance;
        }

        if (remainingAdults > 0 ) {
            console.warn("Calculation Warning: Not all guests could be assigned to the selected rooms based on MAX_OCCUPANTS_PER_ROOM. Price calculated for assigned guests only.");
            const newErrorMessage = `Not enough room capacity selected for ${guestCount} guests. Please add more rooms.`;
            if (bookingError !== newErrorMessage) {
                setBookingError(newErrorMessage);
            }
        } else {
            if (bookingError?.startsWith("Not enough room capacity")) setBookingError(null); 
        }

        setTotalBookingPricePerNight(calculatedPricePerNight);

        if (calculatedPricePerNight > 0 && days > 0) {
            const currentSubtotalNights = calculatedPricePerNight * days;
            setSubtotalNights(currentSubtotalNights);
            const currentServiceCharge = SERVICE_FEE_FIXED; 
            setServiceCharge(currentServiceCharge);
            const currentTaxes = (currentSubtotalNights + currentServiceCharge) * TAX_RATE_PERCENTAGE;
            setTaxesApplied(currentTaxes);
            setTotalBookingPricing(currentSubtotalNights + currentServiceCharge + currentTaxes);
        } else {
            setSubtotalNights(0); setServiceCharge(0); setTaxesApplied(0); setTotalBookingPricing(0);
        }

    }, [selectedRooms, property?.categoryRooms, days, adultCount, childCount, totalSelectedRooms, guestCount, selectedMealPlan, checkInDate, checkOutDate, bookingError]);


    // --- Event Handlers ---

    const handleCheckInChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!property) return;
        const selectedValue = e.target.value;
        let validatedCheckIn: Date | null = null;

        if (!selectedValue) {
            setCheckInDate(null);
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
            }
        }
         const { available, message } = checkAvailabilityForSelection(validatedCheckIn, checkOutDate, selectedRooms, property?.categoryRooms);
         setAvailabilityError(available ? null : message);
    };

    const handleCheckOutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!property) return;
        const selectedValue = e.target.value;
         let validatedCheckOut: Date | null = null;

        if (!selectedValue) {
            setCheckOutDate(null);
        } else {
            const minCODateStr = checkInDate
                ? new Date(checkInDate.getTime() + 86400000).toISOString().split('T')[0] 
                : property.startDate;
            validatedCheckOut = validateDate(selectedValue, minCODateStr, property.endDate);

             if (checkInDate && validatedCheckOut <= checkInDate) {
                 const dayAfterCI = new Date(checkInDate);
                 dayAfterCI.setDate(checkInDate.getDate() + 1);
                 const maxEndDate = new Date(property.endDate);
                 validatedCheckOut = dayAfterCI <= maxEndDate ? dayAfterCI : null; 
             }
            setCheckOutDate(validatedCheckOut);
        }
         const { available, message } = checkAvailabilityForSelection(checkInDate, validatedCheckOut, selectedRooms, property?.categoryRooms);
         setAvailabilityError(available ? null : message);
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

    const handleImageClick = (imageUrl: string) => { setSelectedImage(imageUrl); };

    const handleGuestChange = (type: 'adult' | 'child', change: number) => {
        if (type === 'adult') {
            setAdultCount(prev => Math.max(1, prev + change));
        } else {
            setChildCount(prev => Math.max(0, prev + change));
        }
        setBookingError(null);
        setAvailabilityError(null);
    };

    const handleRoomQuantityChange = (categoryID: string, change: number) => {
        if (!property?.categoryRooms) return;
        const category = property.categoryRooms.find(cat => cat.id === categoryID || cat._id === categoryID);
        if (!category) return;

        const currentQty = selectedRooms[category.id] || 0; 
        const newQty = Math.max(0, currentQty + change); 

        if (newQty > category.qty) return; 

        const newSelectedRooms = { ...selectedRooms, [category.id]: newQty };
         const newTotalSelected = Object.values(newSelectedRooms).reduce((sum, q) => sum + q, 0);


        if (change > 0 && newTotalSelected > MAX_COMBINED_ROOMS) {
            setBookingError(`Maximum ${MAX_COMBINED_ROOMS} rooms allowed in total.`);
            setTimeout(() => setBookingError(null), 3000);
            return; 
        }

        let availabilityCheck: { available: boolean; message: string | null } = { available: true, message: null };
        if (change > 0) { 
             availabilityCheck = checkAvailabilityForSelection(checkInDate, checkOutDate, {[category.id]: 1}, property.categoryRooms);
        }

        if (!availabilityCheck.available) {
             setAvailabilityError(availabilityCheck.message);
             return; 
         } else {
            setAvailabilityError(null);
        }

        setSelectedRooms(newSelectedRooms);

        const currentGuestCount = adultCount + childCount;
        if (currentGuestCount > newTotalSelected * MAX_OCCUPANTS_PER_ROOM) {
            setBookingError(`Not enough room capacity selected for ${currentGuestCount} guests. Max ${MAX_OCCUPANTS_PER_ROOM} per room.`);
        } else {
            if (bookingError?.startsWith("Not enough room capacity")) {
                setBookingError(null);
            }
        }
    };


    useEffect(() => {
        let currentTotal = 0;
        Object.values(selectedRooms).forEach(qty => currentTotal += qty);
        setTotalSelectedRooms(currentTotal);
    }, [selectedRooms ]);

    const handleMealPlanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedMealPlan(e.target.value as keyof PricingByMealPlan);
         setBookingError(null);
         setAvailabilityError(null);
    };

    const handleBookNowClick = () => {
        if (!isLoaded) return; 
        setBookingError(null); 
        setAvailabilityError(null);

        if (!isSignedIn) {
            openSignIn();
            return;
        }

        if (!checkInDate || !checkOutDate) { setBookingError("Please select check-in and check-out dates."); return; }
        if (days <= 0) { setBookingError("Check-out date must be after check-in date."); return; }
        if (totalSelectedRooms <= 0) { setBookingError("Please select at least one room."); return; }
        if (totalSelectedRooms > MAX_COMBINED_ROOMS) { setBookingError(`Cannot book more than ${MAX_COMBINED_ROOMS} rooms.`); return; }
        if (guestCount > totalSelectedRooms * MAX_OCCUPANTS_PER_ROOM) { setBookingError(`Not enough rooms for ${guestCount} guests (Max ${MAX_OCCUPANTS_PER_ROOM} per room). Please add more rooms.`); return; }

         const { available, message } = checkAvailabilityForSelection(checkInDate, checkOutDate, selectedRooms, property?.categoryRooms);
         if (!available) {
             setAvailabilityError(message);
             return;
         }

        setBookingData(prev => ({ ...prev, passengers: guestCount, rooms: totalSelectedRooms }));
        setShowBookingModal(true);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setBookingData(prev => ({ ...prev, [name]: value }));
    };

    const handleBookingSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!property || !checkInDate || !checkOutDate || totalSelectedRooms <= 0 || availabilityError) {
            alert("Booking details incomplete or unavailable. Please check dates and room selection.");
            return;
        };

        setIsSubmitting(true);
        setBookingError(null); 

        const selectedRoomDetailsPayload = Object.entries(selectedRooms)
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            .filter(([_, qty]) => qty > 0)
            .map(([catId, qty]) => {
                const category = property.categoryRooms?.find(cat => cat.id === catId || cat._id === catId);
                 let pricePerRoomNight = 0;
                 if (category) {
                    const basePrice = getPrice(category.pricing.singleOccupancyAdultPrice, selectedMealPlan);
                    const discPrice = getPrice(category.pricing.discountedSingleOccupancyAdultPrice, selectedMealPlan);
                    pricePerRoomNight = (discPrice > 0 && discPrice < basePrice) ? discPrice : basePrice;
                 }
                const currency = category ? category.currency : property.costing?.currency || 'USD';
                return {
                    categoryId: catId,
                    title: category?.title || 'Unknown Room',
                    qty: qty,
                    estimatedPricePerRoomNight: pricePerRoomNight, 
                    currency: currency
                };
            });

        try {
            const bookingPayload = {
                type: "property" as const, 
                details: {
                    id: params?.id as string, 
                    title: property.title,
                    ownerId: property.userId, 
                    locationFrom: "NA", 
                    locationTo: `${property.location.address}, ${property.location.city}, ${property.location.country}`,
                    type: property.type as PropertyType,
                },
                bookingDetails: {
                    checkIn: checkInDate.toISOString(),
                    checkOut: checkOutDate.toISOString(),
                    adults: adultCount,
                    children: childCount,
                    totalGuests: guestCount,
                    totalRoomsSelected: totalSelectedRooms,
                    selectedMealPlan: selectedMealPlan, 
                    roomsDetail: selectedRoomDetailsPayload,
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
                recipients: [bookingData.email, 'owner@example.com'] 
            };

            console.log("Booking Payload:", JSON.stringify(bookingPayload, null, 2)); 

            const response = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingPayload),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Booking submission failed with status: ' + response.status }));
                throw new Error(errorData.message || 'Failed to submit booking');
            }

            setBookingConfirmed(true);
            setShowBookingModal(false);
            if (typeof window !== 'undefined') {
                localStorage.removeItem(LOCAL_STORAGE_KEY); 
            }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error('Error submitting booking:', error);
            setBookingError(`Booking failed: ${error.message}. Please try again.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Rendering Helpers ---
    const renderRatingStars = (rating: number) => (
        <div className="flex">
            {[1, 2, 3, 4, 5].map(star => (
                <StarIcon key={star} className={`w-5 h-5 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
            ))}
        </div>
    );

    const getAmenityIcon = (amenity: string): React.ReactNode => {
        const lowerAmenity = amenity.toLowerCase();
        if (lowerAmenity.includes('wifi') || lowerAmenity.includes('internet')) return <Wifi size={20} />;
        if (lowerAmenity.includes('parking')) return <Car size={20} />;
        if (lowerAmenity.includes('pool')) return <Droplet size={20} />;
        if (lowerAmenity.includes('air conditioning') || lowerAmenity.includes('ac')) return <Wind size={20} />;
        if (lowerAmenity.includes('gym') || lowerAmenity.includes('fitness')) return <Dumbbell size={20} />;
        if (lowerAmenity.includes('spa')) return <Sparkles size={20} />;
        if (lowerAmenity.includes('restaurant')) return <Utensils size={20} />;
        if (lowerAmenity.includes('tv') || lowerAmenity.includes('television')) return <Tv size={20} />;
        if (lowerAmenity.includes('coffee') || lowerAmenity.includes('tea maker') || lowerAmenity.includes('breakfast')) return <Coffee size={20} />;
        // Default icon for other amenities
        return <CheckCircle size={20} />;
    };

     const formatAmenityName = (amenity: string): string => {
        const name = amenity.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        // Specific overrides if needed, e.g., "Wifi" -> "Wi-Fi"
        if (name.toLowerCase() === 'wifi') return 'Wi-Fi';
        return name;
     };

    // Helper function to render lists with "Read More" functionality
    const renderDynamicList = (
        items: string[] | undefined,
        listKeyPrefix: string,
        showAll: boolean,
        setShowAll: React.Dispatch<React.SetStateAction<boolean>>,
        iconRenderer: (item: string) => React.ReactNode,
        nameFormatter: (item: string) => string,
        iconContainerClasses: string,
        gridColsClass: string = "sm:grid-cols-2 md:grid-cols-3" // Default grid for most lists
    ) => {
        if (!items || items.length === 0) return null;

        const displayedItems = showAll ? items : items.slice(0, initialMobileDisplayCount);

        return (
            <>
                <div className={`flex flex-wrap gap-3 sm:grid ${gridColsClass} sm:gap-4`}>
                    {displayedItems.map((item, index) => (
                        <div 
                            key={`${listKeyPrefix}-${index}`} 
                            className="flex items-center bg-gray-50 p-3 rounded-lg border border-gray-200 min-w-[140px] flex-1 sm:flex-none sm:min-w-0" // Mobile: min-width and flex-1; Desktop: grid handles width
                        >
                            <div className={`${iconContainerClasses} p-2 rounded-full mr-3 shrink-0`}>
                                {iconRenderer(item)}
                            </div>
                            <span className="text-sm text-gray-700">{nameFormatter(item)}</span>
                        </div>
                    ))}
                </div>
                {items.length > initialMobileDisplayCount && (
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-semibold flex items-center sm:hidden"
                    >
                        {showAll ? 'Show Less' : `Show All ${items.length} items`}
                        {showAll ? <ChevronUp size={18} className="ml-1" /> : <ChevronDown size={18} className="ml-1" />}
                    </button>
                )}
            </>
        );
    };


    // --- Main Render ---
    if (loading) return <div className="flex justify-center items-center min-h-screen"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div></div>;
    if (error || !property) return <div className="container mx-auto px-4 py-16 text-center"><h2 className="text-2xl font-bold text-red-600 mb-4">{error || 'Property details could not be loaded.'}</h2>{error && <p className="text-gray-600 mb-4">Please check the URL or try refreshing the page.</p>}<button onClick={() => router.push('/properties')} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">View Other Properties</button></div>;


    return (
        <div className="min-h-screen bg-gray-100 pb-16">
            {/* Hero Section */}
             <div className="relative h-96 md:h-[550px] w-full group overflow-hidden">
                 <Image 
                    src={selectedImage || property.bannerImage?.url || '/images/placeholder-property.jpg'} 
                    alt={property.title || 'Property Main Image'} 
                    layout="fill" 
                    objectFit="cover" 
                    priority 
                    className="transform transition-transform duration-500 group-hover:scale-110 brightness-70" 
                    onError={() => setSelectedImage('/images/placeholder-property.jpg')}
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex flex-col justify-end p-6 md:p-10">
                    <div className="inline-block px-4 py-1.5 bg-blue-600 w-fit text-white text-xs sm:text-sm font-semibold rounded-full mb-3 shadow-md uppercase tracking-wider">{property.type}</div>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-2 shadow-text">{property.title || `Beautiful ${property.type} in ${property.location.city}`}</h1>
                    <div className="flex items-center text-gray-200 text-sm sm:text-base mb-4 shadow-text"><MapPin className="w-5 h-5 mr-2 shrink-0"/><span>{property.location.address}, {property.location.city}, {property.location.state}, {property.location.country}</span></div>
                    {(property.totalRating != null && property.totalRating > 0) ? (
                        <div className="flex items-center text-yellow-400">{renderRatingStars(property.totalRating)}<span className="ml-2 text-white font-semibold">{property.totalRating.toFixed(1)} <span className="text-gray-300 font-normal">({(property.review?.length || 0)} reviews)</span></span></div>
                    ) : (property.propertyRating != null && property.propertyRating > 0) ? (
                         <div className="flex items-center text-yellow-400">{renderRatingStars(property.propertyRating)}<span className="ml-2 text-white font-semibold">{property.propertyRating.toFixed(1)} Stars <span className="text-gray-300 font-normal">(Unrated by users)</span></span></div>
                    ) : null}
                </div>
             </div>

            <div className="container mx-auto px-4 lg:px-8 py-8 md:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                    {/* Left Column (Details) */}
                    <div className="lg:col-span-8 space-y-10">
                        {/* Overview Section */}
                        <section className="bg-white p-6 sm:p-8 rounded-xl shadow-xl">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3 flex items-center"><UsersIcon className="mr-3 h-6 w-6 text-blue-600" />Property Overview</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-center">
                                <div className="p-4 bg-gray-50 rounded-lg border"><div className="text-gray-500 text-sm mb-1 uppercase tracking-wider">Type</div><div className="font-semibold text-lg text-blue-700 capitalize">{property.type}</div></div>
                                {property.categoryRooms && property.categoryRooms.length > 0 && <div className="p-4 bg-gray-50 rounded-lg border"><div className="text-gray-500 text-sm mb-1 uppercase tracking-wider">Total Room Types</div><div className="font-semibold text-lg text-blue-700">{property.categoryRooms.length}</div></div>}
                                {property.propertyRating != null && property.propertyRating >= 0 && <div className="p-4 bg-gray-50 rounded-lg border"><div className="text-gray-500 text-sm mb-1 uppercase tracking-wider">Official Rating</div><div className="font-semibold text-lg text-blue-700 flex items-center justify-center">{renderRatingStars(property.propertyRating)}<span className='ml-2'>({property.propertyRating === 0 ? 'Unrated' : `${property.propertyRating}-Star`})</span></div></div>}
                                {property.googleMaps && (property.googleMaps.startsWith('<iframe') || property.googleMaps.startsWith('https://')) && (
                                    <div className="sm:col-span-2 md:col-span-3 mt-4">
                                        <div className="text-gray-700 text-sm font-medium mb-2 text-left">Location Map</div>
                                        {property.googleMaps.startsWith('<iframe') ? (
                                            <div className="w-full h-72 md:h-96 rounded-lg overflow-hidden border-2 border-gray-200 shadow-inner" dangerouslySetInnerHTML={{ __html: property.googleMaps }} />
                                        ) : (
                                             <iframe src={property.googleMaps} width="100%" height="350" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="w-full h-72 md:h-96 rounded-lg overflow-hidden border-2 border-gray-200 shadow-inner"></iframe>
                                        )}
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* About Section */}
                        <section className="bg-white p-6 sm:p-8 rounded-xl shadow-xl">
                            <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-3">About This Property</h2>
                            <div className="prose prose-sm sm:prose-base max-w-none text-gray-700 leading-relaxed"><p>{property.description || "No detailed description available for this property."}</p></div>
                        </section>

                        {/* Gallery Section */}
                        {property.detailImages && property.detailImages.length > 0 && (
                            <section className="bg-white p-6 sm:p-8 rounded-xl shadow-xl">
                                <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3 flex items-center"><ImageIcon className="mr-3 h-6 w-6 text-blue-600" />Gallery</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                    {property.bannerImage?.url && (
                                        <div className={`relative aspect-video sm:aspect-square cursor-pointer rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow ${selectedImage === property.bannerImage.url ? 'ring-4 ring-offset-2 ring-blue-500' : 'ring-1 ring-gray-300'}`} onClick={() => handleImageClick(property.bannerImage!.url)}>
                                            <Image src={property.bannerImage.url} alt={property.bannerImage.alt || "Property Banner"} layout="fill" objectFit="cover" sizes="(max-width: 640px) 50vw, 200px" onError={(e) => e.currentTarget.src = '/images/placeholder-property.jpg'} />
                                        </div>
                                    )}
                                    {property.detailImages.filter(img => img.url !== property.bannerImage?.url).slice(0, 7).map((image, index) => (
                                        <div key={image.publicId || index} className={`relative aspect-video sm:aspect-square cursor-pointer rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow ${selectedImage === image.url ? 'ring-4 ring-offset-2 ring-blue-500' : 'ring-1 ring-gray-300'}`} onClick={() => handleImageClick(image.url)}>
                                            <Image src={image.url} alt={image.alt || `Property image ${index + 1}`} layout="fill" objectFit="cover" sizes="(max-width: 640px) 50vw, 200px" onError={(e) => e.currentTarget.src = '/images/placeholder-property.jpg'} />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Amenities & Features Section */}
                        {((property.amenities && property.amenities.length > 0) || (property.facilities && property.facilities.length > 0) || (property.roomFacilities && property.roomFacilities.length > 0)) && (
                            <section className="bg-white p-6 sm:p-8 rounded-xl shadow-xl">
                                <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3 flex items-center"><FileText className="mr-3 h-6 w-6 text-blue-600" />Amenities & Features</h2>
                                {property.amenities && property.amenities.length > 0 && (
                                    <div className="mb-6">
                                        <h3 className="text-lg font-semibold text-gray-700 mb-3">General Amenities</h3>
                                        {renderDynamicList(
                                            property.amenities,
                                            'gen-amenity',
                                            showAllAmenities,
                                            setShowAllAmenities,
                                            getAmenityIcon,
                                            formatAmenityName,
                                            'bg-blue-100 text-blue-600'
                                        )}
                                    </div>
                                )}
                                {property.facilities && property.facilities.length > 0 && (
                                    <div className="mb-6">
                                        <h3 className="text-lg font-semibold text-gray-700 mb-3">On-site Facilities</h3>
                                        {renderDynamicList(
                                            property.facilities,
                                            'facility',
                                            showAllFacilities,
                                            setShowAllFacilities,
                                            () => <Briefcase size={20} />, // Specific icon for facilities
                                            (item) => item, // No special formatting for facility names
                                            'bg-green-100 text-green-600'
                                        )}
                                    </div>
                                )}
                                {property.roomFacilities && property.roomFacilities.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-700 mb-3">Standard In-Room Facilities</h3>
                                        {renderDynamicList(
                                            property.roomFacilities,
                                            'room-facility',
                                            showAllRoomFacilities,
                                            setShowAllRoomFacilities,
                                            getAmenityIcon,
                                            formatAmenityName,
                                            'bg-purple-100 text-purple-600'
                                        )}
                                    </div>
                                )}
                            </section>
                        )}

                        {/* Accessibility Section */}
                        {((property.accessibility && property.accessibility.length > 0) || (property.roomAccessibility && property.roomAccessibility.length > 0)) && (
                            <section className="bg-white p-6 sm:p-8 rounded-xl shadow-xl">
                                <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3 flex items-center"><ShieldAlert className="mr-3 h-6 w-6 text-blue-600" />Accessibility</h2>
                                {property.accessibility && property.accessibility.length > 0 && (
                                    <div className="mb-6">
                                        <h3 className="text-lg font-semibold text-gray-700 mb-3">Property Accessibility</h3>
                                        {renderDynamicList(
                                            property.accessibility,
                                            'prop-access',
                                            showAllPropertyAccess,
                                            setShowAllPropertyAccess,
                                            () => <CheckCircle size={20} />,
                                            (item) => item,
                                            'bg-indigo-100 text-indigo-600',
                                            'sm:grid-cols-1 md:grid-cols-2' // Accessibility lists might be longer, 2 cols on desktop
                                        )}
                                    </div>
                                )}
                                {property.roomAccessibility && property.roomAccessibility.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-700 mb-3">Room Accessibility Features</h3>
                                         {renderDynamicList(
                                            property.roomAccessibility,
                                            'room-access',
                                            showAllRoomAccess,
                                            setShowAllRoomAccess,
                                            () => <CheckCircle size={20} />,
                                            (item) => item,
                                            'bg-teal-100 text-teal-600',
                                            'sm:grid-cols-1 md:grid-cols-2' // Accessibility lists
                                        )}
                                    </div>
                                )}
                            </section>
                        )}

                        {/* Other Sections using renderDynamicList */}
                        {property.funThingsToDo && property.funThingsToDo.length > 0 && (
                            <section className="bg-white p-6 sm:p-8 rounded-xl shadow-xl">
                                <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-3 flex items-center"><Drama className="mr-3 h-6 w-6 text-blue-600"/>Fun Things To Do Nearby</h2>
                                {renderDynamicList(
                                    property.funThingsToDo,
                                    'fun',
                                    showAllFunThings,
                                    setShowAllFunThings,
                                    () => <SunMedium size={20}/>,
                                    (item) => item,
                                    'bg-pink-100 text-pink-600',
                                    'sm:grid-cols-1 md:grid-cols-2'
                                )}
                            </section>
                        )}
                        {property.meals && property.meals.length > 0 && (
                            <section className="bg-white p-6 sm:p-8 rounded-xl shadow-xl">
                                <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-3 flex items-center"><Utensils className="mr-3 h-6 w-6 text-blue-600"/>Meal Options (Property-wide)</h2>
                                {renderDynamicList(
                                    property.meals,
                                    'meal',
                                    showAllMeals,
                                    setShowAllMeals,
                                    () => <Utensils size={20}/>,
                                    (item) => item,
                                    'bg-orange-100 text-orange-600',
                                    'sm:grid-cols-1 md:grid-cols-2'
                                )}
                            </section>
                        )}
                        {property.bedPreference && property.bedPreference.length > 0 && (
                            <section className="bg-white p-6 sm:p-8 rounded-xl shadow-xl">
                                <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-3 flex items-center"><BedDouble className="mr-3 h-6 w-6 text-blue-600"/>Bed Options Available</h2>
                                 {renderDynamicList(
                                    property.bedPreference,
                                    'bed',
                                    showAllBedOptions,
                                    setShowAllBedOptions,
                                    () => <BedDouble size={20}/>,
                                    (item) => item,
                                    'bg-lime-100 text-lime-600',
                                    'sm:grid-cols-1 md:grid-cols-2'
                                )}
                            </section>
                        )}

                        {/* Sections that don't need "Read More" for items (list or tags) */}
                        {property.reservationPolicy && property.reservationPolicy.length > 0 && ( <section className="bg-white p-6 sm:p-8 rounded-xl shadow-xl"> <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-3 flex items-center"><FileText className="mr-3 h-6 w-6 text-blue-600"/>Reservation Policy</h2> <ul className="list-disc list-inside pl-2 space-y-1.5 text-sm text-gray-700 marker:text-blue-500">{property.reservationPolicy.map((policy, index) => (<li key={`policy-${index}`}>{policy}</li>))}</ul> </section> )}
                        {property.popularFilters && property.popularFilters.length > 0 && ( <section className="bg-white p-6 sm:p-8 rounded-xl shadow-xl"> <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-3 flex items-center"><Filter className="mr-3 h-6 w-6 text-blue-600"/>Popular Filters</h2> <div className="flex flex-wrap gap-2">{property.popularFilters.map((filter, index) => (<span key={`filter-${index}`} className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-medium border border-blue-200">{filter}</span>))}</div> </section> )}
                        {property.brands && property.brands.length > 0 && ( <section className="bg-white p-6 sm:p-8 rounded-xl shadow-xl"> <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-3 flex items-center"><Building className="mr-3 h-6 w-6 text-blue-600"/>Associated Brands</h2> <div className="flex flex-wrap gap-2">{property.brands.map((brand, index) => (<span key={`brand-${index}`} className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full text-xs font-medium border border-purple-200">{brand}</span>))}</div> </section> )}

                        {/* Reviews Section */}
                        <DummyReviews />

                    </div>

                    {/* --- Right Column (Booking Sidebar) --- */}
                    <div className="lg:col-span-4">
                        <div className="bg-white p-6 rounded-xl shadow-xl sticky top-10">
                             {property.costing && property.costing.price > 0 && (
                                <div className="mb-6 pb-4 border-b border-gray-200">
                                    <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Starting from (per adult/night)</span>
                                    <div className="flex items-baseline mt-1.5">
                                        <span className="text-3xl font-extrabold text-blue-600">
                                            {property.costing.currency}{' '}
                                            {(property.costing.discountedPrice > 0 && property.costing.discountedPrice < property.costing.price ? property.costing.discountedPrice : property.costing.price).toLocaleString()}
                                        </span>
                                        {(property.costing.discountedPrice > 0 && property.costing.price > property.costing.discountedPrice) && (
                                            <span className="ml-2 line-through text-gray-400 text-lg">{property.costing.currency} {property.costing.price.toLocaleString()}</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1.5">Based on lowest room rate & meal plan.</p>
                                </div>
                             )}

                            <div className="space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="checkin-date" className="block text-sm font-medium text-gray-700 mb-1">Check-in</label>
                                        <input id="checkin-date" type="date" value={checkInDate ? checkInDate.toISOString().split('T')[0] : ''} onChange={handleCheckInChange} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm shadow-sm" min={new Date(property.startDate).toISOString().split('T')[0]} max={new Date(property.endDate).toISOString().split('T')[0]} required />
                                    </div>
                                    <div>
                                        <label htmlFor="checkout-date" className="block text-sm font-medium text-gray-700 mb-1">Check-out</label>
                                        <input id="checkout-date" type="date" value={checkOutDate ? checkOutDate.toISOString().split('T')[0] : ''} onChange={handleCheckOutChange} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm shadow-sm" min={checkInDate ? new Date(checkInDate.getTime() + 86400000).toISOString().split('T')[0] : new Date(property.startDate).toISOString().split('T')[0]} max={new Date(property.endDate).toISOString().split('T')[0]} required disabled={!checkInDate} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Adults</label>
                                        <div className="flex items-center border border-gray-300 rounded-lg shadow-sm"> <button type="button" onClick={() => handleGuestChange('adult', -1)} disabled={adultCount <= 1} className="px-3 py-2.5 text-blue-600 disabled:text-gray-400 rounded-l-lg hover:bg-gray-50"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg></button> <div className="flex-1 text-center text-sm font-semibold text-gray-800">{adultCount}</div> <button type="button" onClick={() => handleGuestChange('adult', 1)} className="px-3 py-2.5 text-blue-600 rounded-r-lg hover:bg-gray-50"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg></button> </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Children <span className="text-xs text-gray-400">(5-12)</span></label>
                                        <div className="flex items-center border border-gray-300 rounded-lg shadow-sm"> <button type="button" onClick={() => handleGuestChange('child', -1)} disabled={childCount <= 0} className="px-3 py-2.5 text-blue-600 disabled:text-gray-400 rounded-l-lg hover:bg-gray-50"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg></button> <div className="flex-1 text-center text-sm font-semibold text-gray-800">{childCount}</div> <button type="button" onClick={() => handleGuestChange('child', 1)} className="px-3 py-2.5 text-blue-600 rounded-r-lg hover:bg-gray-50"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg></button> </div>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 text-center">Total Guests: <span className="font-semibold">{guestCount}</span></p>

                                <div className="space-y-1 border-t pt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Meal Plan</label>
                                    <div className="space-y-2">
                                        {(['noMeal', 'breakfastOnly', 'allMeals'] as (keyof PricingByMealPlan)[]).map(plan => {
                                            const isPlanOffered = property.categoryRooms?.some(cat => {
                                                if ((selectedRooms[cat.id] || selectedRooms[cat._id!] || 0) > 0) { 
                                                    return getPrice(cat.pricing.singleOccupancyAdultPrice, plan) > 0 ||
                                                           getPrice(cat.pricing.doubleOccupancyAdultPrice, plan) > 0 ||
                                                           getPrice(cat.pricing.tripleOccupancyAdultPrice, plan) > 0;
                                                }
                                                return false;
                                            });
                                            const isDisabled = plan !== 'noMeal' && !isPlanOffered && totalSelectedRooms > 0;
                                            const labelText = { noMeal: 'Room Only', breakfastOnly: 'Breakfast Included', allMeals: 'All Meals (Breakfast + Lunch/Dinner)'}[plan];

                                            return (
                                            <label key={plan} className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${selectedMealPlan === plan ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-400' : 'border-gray-200 hover:bg-gray-50'} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                                <input type="radio" name="mealPlan" value={plan} checked={selectedMealPlan === plan} onChange={handleMealPlanChange} className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500" disabled={isDisabled} />
                                                <span className={`ml-3 text-sm font-medium ${selectedMealPlan === plan ? 'text-blue-800' : 'text-gray-700'}`}>{labelText}</span>
                                            </label>
                                            );
                                        })}
                                    </div>
                                     <p className="text-xs text-gray-500 mt-1">Select your preferred meal option for the booking.</p>
                                </div>


                                <div className="space-y-1 border-t pt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Rooms <span className="text-xs text-gray-400">(Max {MAX_COMBINED_ROOMS} total)</span></label>
                                    {property.categoryRooms && property.categoryRooms.length > 0 ? (
                                        <div className="space-y-3 max-h-72 overflow-y-auto pr-2 border rounded-lg p-2 bg-gray-50/50">
                                            {property.categoryRooms.map((cat: StoredRoomCategory) => {
                                                const selectedQty = selectedRooms[cat.id] || 0; 
                                                const remainingQty = cat.qty - selectedQty;
                                                const canIncrement = totalSelectedRooms < MAX_COMBINED_ROOMS && remainingQty > 0;

                                                const displayBasePrice = getPrice(cat.pricing.singleOccupancyAdultPrice, selectedMealPlan);
                                                const displayDiscPrice = getPrice(cat.pricing.discountedSingleOccupancyAdultPrice, selectedMealPlan);
                                                const displayCatPrice = (displayDiscPrice > 0 && displayDiscPrice < displayBasePrice) ? displayDiscPrice : displayBasePrice;

                                                return (
                                                    <div key={cat.id} className="p-3 border border-gray-200 rounded-lg bg-white shadow-sm">
                                                        <div className="flex justify-between items-center mb-1.5">
                                                            <div className="flex-grow">
                                                                <p className="font-semibold text-sm text-gray-800">{cat.title}</p>
                                                                {displayCatPrice > 0 ? (
                                                                   <p className="text-xs text-gray-500">Approx. {cat.currency} {displayCatPrice.toLocaleString()} / night ({selectedMealPlan === 'noMeal' ? 'Room Only' : selectedMealPlan === 'breakfastOnly' ? '+Breakfast' : '+All Meals'})</p>
                                                                ) : (
                                                                    <p className="text-xs text-red-500">Pricing not available for selected meal plan</p>
                                                                )}
                                                                 <p className={`text-xs ${remainingQty > 0 ? 'text-green-600' : 'text-red-600'}`}>{remainingQty} room(s) available</p>
                                                            </div>
                                                            <div className="flex items-center border border-gray-300 rounded-lg bg-white shadow-sm ml-2 shrink-0">
                                                                <button type="button" onClick={() => handleRoomQuantityChange(cat.id, -1)} disabled={selectedQty <= 0} className="px-2.5 py-1.5 text-blue-600 disabled:text-gray-300 rounded-l-md hover:bg-gray-50"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg></button>
                                                                <div className="px-3 text-sm font-semibold text-gray-800 min-w-[36px] text-center">{selectedQty}</div>
                                                                <button type="button" onClick={() => handleRoomQuantityChange(cat.id, 1)} disabled={!canIncrement} className="px-2.5 py-1.5 text-blue-600 disabled:text-gray-300 rounded-r-md hover:bg-gray-50"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg></button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 italic py-4 text-center">No specific room types available for this property.</p>
                                    )}
                                    <div className="mt-3 pt-2 text-sm text-right border-t">Total Selected Rooms: <span className="font-semibold text-gray-800">{totalSelectedRooms}</span> / {MAX_COMBINED_ROOMS}</div>
                                </div>
                            </div>

                            {(checkInDate && checkOutDate && days > 0 && totalSelectedRooms > 0 && property.costing && totalBookingPricePerNight > 0) && (
                                <div className="border-t-2 border-gray-200 pt-5 mt-5 mb-6 space-y-2.5">
                                    <div className="flex justify-between text-sm"><span className="text-gray-600">Est. Room Total ({days} {days === 1 ? 'night' : 'nights'})</span><span className="font-medium text-gray-800">{property.costing.currency} {subtotalNights.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-gray-600">Service Fee</span><span className="font-medium text-gray-800">{property.costing.currency} {serviceCharge.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-gray-600">Taxes & Fees (approx. {TAX_RATE_PERCENTAGE * 100}%)</span><span className="font-medium text-gray-800">{property.costing.currency} {taxesApplied.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                                    <div className="flex justify-between font-bold text-xl pt-3 border-t border-gray-300 mt-3 text-blue-700"><span>Grand Total</span><span>{property.costing.currency} {totalBookingPricing.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                                    <p className="text-xs text-gray-500 text-center">Price based on {selectedMealPlan === 'noMeal' ? 'Room Only' : selectedMealPlan === 'breakfastOnly' ? 'Breakfast Included' : 'All Meals'} plan.</p>
                                </div>
                            )}

                             {availabilityError && <div className="my-4 p-3 bg-yellow-100 text-yellow-800 text-sm rounded-lg border border-yellow-300 flex items-start"><CalendarOff className='h-5 w-5 mr-2 shrink-0 text-yellow-600'/><p>{availabilityError}</p></div>}
                            {bookingError && <div className="my-4 p-3 bg-red-100 text-red-700 text-sm rounded-lg border border-red-300">{bookingError}</div>}

                            <button
                                onClick={handleBookNowClick}
                                disabled={
                                    !checkInDate || !checkOutDate || days <= 0 ||
                                    totalSelectedRooms <= 0 || totalSelectedRooms > MAX_COMBINED_ROOMS ||
                                    !(property.categoryRooms && property.categoryRooms.length > 0) || 
                                    guestCount > totalSelectedRooms * MAX_OCCUPANTS_PER_ROOM ||
                                    !!availabilityError 
                                }
                                className="w-full bg-blue-600 text-white py-3.5 px-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-500/50"
                            >
                                Book Now
                            </button>
                            <p className="text-xs text-gray-500 text-center mt-3">You won&apos;t be charged yet.</p>
                        </div>
                    </div>
                </div>
            </div>

            {showBookingModal && property && property.costing && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
                    <div className="bg-white rounded-xl max-w-lg w-full p-6 sm:p-8 max-h-[95vh] overflow-y-auto shadow-2xl">
                         <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                             <h3 className="text-2xl font-bold text-gray-800">Complete Your Booking</h3>
                             <button onClick={() => setShowBookingModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={28} /></button>
                         </div>

                        <div className="mb-6 space-y-4">
                            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg border">
                                {property.bannerImage && <div className="relative h-20 w-28 mr-2 rounded-md overflow-hidden flex-shrink-0 shadow"><Image src={property.bannerImage.url} alt={property.title || ""} layout="fill" objectFit="cover" onError={(e) => e.currentTarget.style.display = 'none'} /></div>}
                                <div>
                                    <h4 className="font-semibold text-lg text-gray-800">{property.title}</h4>
                                    <p className="text-sm text-gray-500">{property.location.city}, {property.location.country}</p>
                                     {(property.totalRating != null && property.totalRating > 0) && (
                                        <div className="flex items-center mt-1">{renderRatingStars(property.totalRating)}<span className="text-xs ml-1.5 text-gray-500">({property.totalRating.toFixed(1)})</span></div>
                                     )}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-3 p-4 bg-gray-50 rounded-lg border text-sm">
                                <div><div className="text-xs text-gray-500 uppercase tracking-wider">Check-in</div><div className="font-medium text-gray-700">{checkInDate?.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div></div>
                                <div><div className="text-xs text-gray-500 uppercase tracking-wider">Check-out</div><div className="font-medium text-gray-700">{checkOutDate?.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div></div>
                                <div><div className="text-xs text-gray-500 uppercase tracking-wider">Duration</div><div className="font-medium text-gray-700">{days} {days === 1 ? 'night' : 'nights'}</div></div>
                                <div><div className="text-xs text-gray-500 uppercase tracking-wider">Guests</div><div className="font-medium text-gray-700">{guestCount} ({adultCount} Ad, {childCount} Ch)</div></div>
                                <div className="col-span-2"><div className="text-xs text-gray-500 uppercase tracking-wider">Meal Plan</div><div className="font-medium text-gray-700">{selectedMealPlan === 'noMeal' ? 'Room Only' : selectedMealPlan === 'breakfastOnly' ? 'Breakfast Included' : 'All Meals'}</div></div>
                            </div>
                            <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-white">
                                <h5 className="text-sm font-semibold mb-2 text-gray-700">Selected Rooms ({totalSelectedRooms} total)</h5>
                                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-2">
                                    {/* eslint-disable-next-line @typescript-eslint/no-unused-vars */}
                                     {Object.entries(selectedRooms).filter(([_, qty]) => qty > 0).map(([catId, qty]) => {
                                        const category = property.categoryRooms?.find(cat => cat.id === catId || cat._id === catId);
                                        return (<div key={catId} className="flex justify-between items-center text-xs text-gray-600"><span>{qty} x {category?.title || 'Room'}</span></div>);
                                    })}
                                </div>
                                <div className="flex justify-between font-semibold text-sm pt-2.5 border-t border-gray-200 mt-2.5"><span>Total Price Per Night (Calculated)</span><span>{property.costing?.currency || 'USD'} {totalBookingPricePerNight.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                            </div>
                            <div className="flex flex-col space-y-1.5 mb-4 p-4 bg-gray-100 rounded-lg border border-gray-200">
                                <div className="flex justify-between text-sm"><span className="text-gray-600">Subtotal ({days} {days === 1 ? 'night' : 'nights'})</span><span className="text-gray-800 font-medium">{property.costing.currency} {subtotalNights.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                                <div className="flex justify-between text-sm"><span className="text-gray-600">Service Fee</span><span className="text-gray-800 font-medium">{property.costing.currency} {serviceCharge.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                                <div className="flex justify-between text-sm"><span className="text-gray-600">Taxes & Fees (approx. {TAX_RATE_PERCENTAGE * 100}%)</span><span className="text-gray-800 font-medium">{property.costing.currency} {taxesApplied.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                            </div>
                            <div className="flex justify-between font-bold text-xl p-4 bg-blue-50 rounded-lg border border-blue-200 text-blue-700"><span>Grand Total</span><span>{property.costing.currency} {totalBookingPricing.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                        </div>

                        <form onSubmit={handleBookingSubmit} className="space-y-4">
                            <h4 className="text-lg font-semibold text-gray-800 mb-3 pt-4 border-t">Your Information</h4>
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

            {bookingConfirmed && property && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[110] backdrop-blur-sm">
                    <div className="bg-white rounded-xl max-w-md w-full p-8 text-center shadow-2xl">
                        <div className="mb-5"><div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center border-4 border-green-200"><CheckCircle className="w-12 h-12 text-green-500" /></div></div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-3">Booking Confirmed!</h3>
                        <p className="mb-6 text-gray-600">Your booking for <span className="font-semibold">{property.title}</span> has been successfully processed. A confirmation email has been sent to <span className="font-semibold">{bookingData.email}</span>.</p>
                        <button onClick={() => { setBookingConfirmed(false); router.refresh(); }} className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-blue-300">Done</button>
                    </div>
                </div>
            )}
        </div>
    );
}