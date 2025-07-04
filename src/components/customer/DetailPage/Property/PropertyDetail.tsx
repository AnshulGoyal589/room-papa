'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    PricingByMealPlan,
    DiscountedPricingByMealPlan
} from '@/types';
import {
    Wifi, Car, Droplet, Wind, Dumbbell, Coffee as CoffeeIconLucide, CheckCircle, Star as StarIcon, MapPin, Users as UsersIcon, Image as ImageIconLucide, CalendarOff,
    ChevronDown, ChevronUp, Heart, Share2, AlertTriangle, Award, Bed, ListChecks,
    Utensils,
    Tv,
    HelpCircle,
    XCircle,
    AlertCircle,
    UserCheck,
    Sparkles, // Added for category activities
    Wrench,   // Added for category facilities
    // CalendarDays // For availability display
} from 'lucide-react';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import { useUser, useClerk, SignedOut } from '@clerk/nextjs';
import { Property } from '@/lib/mongodb/models/Property';
import { DisplayableRoomOffer, ExtendedProperty, RoomCategoryPricing, StoredRoomCategory } from '@/types/booking';
import { Image as MongoImage } from '@/lib/mongodb/models/Image';


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
};


export default function PropertyDetailPage() {
    const LOCAL_STORAGE_KEY = 'propertyBookingPreferences_v3';
    const RESERVATION_DATA_KEY = 'reservationData_v1';
    const MAX_COMBINED_ROOMS = 5;
    const MAX_OCCUPANTS_PER_ROOM = 3;
    const SERVICE_FEE_FIXED = 10;
    const TAX_RATE_PERCENTAGE = 0.05;

    const { openSignIn } = useClerk();
    const router = useRouter();
    const params = useParams();
    const { isSignedIn, isLoaded } = useUser();

    const [property, setProperty] = useState<ExtendedProperty | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [activeImage, setActiveImage] = useState<string | null>(null);

    const [checkInDate, setCheckInDate] = useState<Date | null>(null);
    const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);

    const [adultCount, setAdultCount] = useState<number>(1);
    const [childCount, setChildCount] = useState<number>(0);

    const [selectedOffers, setSelectedOffers] = useState<Record<string, number>>({});
    const [selectedMealPlan, setSelectedMealPlan] = useState<keyof PricingByMealPlan>('breakfastOnly');

    const [totalSelectedPhysicalRooms, setTotalSelectedPhysicalRooms] = useState<number>(0);
    const [totalBookingPricePerNight, setTotalBookingPricePerNight] = useState<number>(0);
    const [subtotalNights, setSubtotalNights] = useState<number>(0);
    const [serviceCharge, setServiceCharge] = useState<number>(0);
    const [taxesApplied, setTaxesApplied] = useState<number>(0);
    const [totalBookingPricing, setTotalBookingPricing] = useState<number>(0);
    const [availabilityError, setAvailabilityError] = useState<string | null>(null);
    const [bookingError, setBookingError] = useState<string | null>(null);

    const [showAllAmenities, setShowAllAmenities] = useState(false);
    const [showReservePopover, setShowReservePopover] = useState(false);

    const globalGuestCount = useMemo(() => adultCount + childCount, [adultCount, childCount]);
    const days = useMemo(() => calculateDays(checkInDate, checkOutDate), [checkInDate, checkOutDate]);

    const validateDate = (selectedDateStr: string, propertyStartDateStr?: string, propertyEndDateStr?: string): Date => {
        const date = new Date(selectedDateStr); date.setHours(12, 0, 0, 0);
        const minDate = new Date(propertyStartDateStr || Date.now()); minDate.setHours(0, 0, 0, 0);
        const maxDate = propertyEndDateStr ? new Date(propertyEndDateStr) : new Date(Date.now() + 365 * 2 * 86400000); // Extended default max date
        maxDate.setHours(23, 59, 59, 999);

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
                involvedCategoryIds.add(offerId.split('_')[0]); // Category ID is the first part of offerId
            }
        });

        for (const catId of Array.from(involvedCategoryIds)) {
            const category = allCategories.find(c => c.id === catId || c._id === catId);
            if (category) {
                // Check category's own availability period
                if (category.availabilityStartDate && new Date(startDate) < new Date(category.availabilityStartDate)) {
                     return { available: false, message: `Room type "${category.title}" is not available before ${new Date(category.availabilityStartDate).toLocaleDateString()}.` };
                }
                if (category.availabilityEndDate && new Date(endDate) > new Date(new Date(category.availabilityEndDate).getTime() + 86400000)) { // Add one day to include the end date itself
                     return { available: false, message: `Room type "${category.title}" is not available after ${new Date(category.availabilityEndDate).toLocaleDateString()}.` };
                }

                // Check specific unavailable dates within the category
                if (category.unavailableDates && category.unavailableDates.length > 0) {
                    for (const dateStr of dateRange) {
                        if (category.unavailableDates.includes(dateStr)) {
                            return {
                                available: false,
                                message: `Room type "${category.title}" is unavailable on ${new Date(dateStr + 'T00:00:00').toLocaleDateString()}. Please adjust dates or room selection.`
                            };
                        }
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
                const data: Property = await response.json();
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
                            }
                            : initialPricingState,
                        unavailableDates: Array.isArray(cat.unavailableDates) ? cat.unavailableDates : [],
                        // NEW FIELDS
                        availabilityStartDate: cat.availabilityStartDate || undefined,
                        availabilityEndDate: cat.availabilityEndDate || undefined,
                        categoryActivities: Array.isArray(cat.categoryActivities) ? cat.categoryActivities : [],
                        categoryFacilities: Array.isArray(cat.categoryFacilities) ? cat.categoryFacilities : [],
                        // END NEW FIELDS
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

    const getCheckInDateFromLocalStorage = () => {
        if (typeof window === 'undefined') return null;
        const storedValue = localStorage.getItem(LOCAL_STORAGE_KEY);
        const parsedValue = storedValue ? JSON.parse(storedValue) : null;
        const checkInDate = parsedValue?.checkInDate || localStorage.getItem('checkIn');
        const date =  new Date(checkInDate);
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
    const getCheckOutDateFromLocalStorage = () => {
        if (typeof window === 'undefined') return null;
        const storedValue = localStorage.getItem(LOCAL_STORAGE_KEY);
        const parsedValue = storedValue ? JSON.parse(storedValue) : null;
        const checkOutDate = parsedValue?.checkOutDate || localStorage.getItem('checkOut');
        const date = new Date(checkOutDate);
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
        if (property && typeof window !== 'undefined' && !loading) {
            const storedPreferences = localStorage.getItem(LOCAL_STORAGE_KEY);
            const localCheckIn = getCheckInDateFromLocalStorage();
            const localCheckOut = getCheckOutDateFromLocalStorage();
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
                                validatedCO = (nextDay <= new Date(property.endDate || Date.now())) ? nextDay : new Date(property.endDate || Date.now());
                            }
                            tempCheckOutDate = validatedCO;
                        }

                        let tempSelectedOffers: Record<string, number> = {};
                        if (typeof parsedPrefs.selectedOffers === 'object' && parsedPrefs.selectedOffers !== null && property.categoryRooms) {
                             tempSelectedOffers = parsedPrefs.selectedOffers;
                        }

                        setCheckInDate(tempCheckInDate);
                        setCheckOutDate(tempCheckOutDate);

                        if (typeof parsedPrefs.adultCount === 'number' && parsedPrefs.adultCount >= 1) setAdultCount(parsedPrefs.adultCount); else if (localAdultsString === null) setAdultCount(1);
                        if (typeof parsedPrefs.childCount === 'number' && parsedPrefs.childCount >= 0) setChildCount(parsedPrefs.childCount); else if (localChildrenString === null) setChildCount(0);

                        setSelectedOffers(tempSelectedOffers);
                        if (parsedPrefs.selectedMealPlan && ['noMeal', 'breakfastOnly', 'allMeals'].includes(parsedPrefs.selectedMealPlan)) {
                            setSelectedMealPlan(parsedPrefs.selectedMealPlan);
                        } else { setSelectedMealPlan('breakfastOnly'); }

                        const { available, message } = checkAvailabilityForSelection( tempCheckInDate, tempCheckOutDate, tempSelectedOffers, property.categoryRooms );
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

        if (localCheckInStr) qCheckIn = validateDate(localCheckInStr, prop.startDate || '', prop.endDate || '');
        if (localCheckOutStr) {
            const minCO = qCheckIn ? new Date(qCheckIn.getTime() + 86400000).toISOString().split('T')[0] : prop.startDate;
            qCheckOut = validateDate(localCheckOutStr, minCO, prop.endDate);
            if (qCheckIn && qCheckOut && qCheckOut <= qCheckIn) {
                const nextDay = new Date(qCheckIn); nextDay.setDate(qCheckIn.getDate() + 1);
                qCheckOut = (nextDay <= new Date(prop.endDate || Date.now())) ? nextDay : new Date(prop.endDate || Date.now());
            }
        }
        if (localAdultsStr) qAdults = Math.max(1, parseInt(localAdultsStr, 10));
        if (localChildrenStr) qChildren = Math.max(0, parseInt(localChildrenStr, 10));

        setCheckInDate(qCheckIn);
        setCheckOutDate(qCheckOut);
        setAdultCount(qAdults);
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
                adultCount,
                childCount,
                selectedOffers,
                selectedMealPlan,
            };
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(preferencesToSave));
        }
    }, [checkInDate, checkOutDate, adultCount, childCount, selectedOffers, selectedMealPlan, property, loading]);

    const displayableRoomOffers = useMemo((): DisplayableRoomOffer[] => {
        if (!property?.categoryRooms || !checkInDate || !checkOutDate) return [];

        const offers: DisplayableRoomOffer[] = [];
        const currentCheckInDateOnly = new Date(checkInDate); currentCheckInDateOnly.setHours(0,0,0,0);
        const currentCheckOutDateOnly = new Date(checkOutDate); currentCheckOutDateOnly.setHours(0,0,0,0);


        property.categoryRooms.forEach(cat => {
            // Check category's own availability period first
            if (cat.availabilityStartDate) {
                const catStartDate = new Date(cat.availabilityStartDate); catStartDate.setHours(0,0,0,0);
                if (currentCheckInDateOnly < catStartDate) return; // Skip if check-in is before category start
            }
            if (cat.availabilityEndDate) {
                const catEndDate = new Date(cat.availabilityEndDate); catEndDate.setHours(23,59,59,999);
                if (currentCheckOutDateOnly > catEndDate) return; // Skip if check-out is after category end
            }

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
                // console.log(`Category ${cat.title} - Offer for ${numAdults} adults: Base Price = ${basePrice}, Discounted Price = ${discountedPrice}, Is Discounted = ${isDisc}`);
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
                                offerId: `${cat._id || cat.id}_${oc.offerKeySuffix}`,
                                categoryId: cat._id?.toString() || cat.id,
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
                                // Add category specific fields to offer for display
                                categoryAvailabilityStartDate: cat.availabilityStartDate,
                                categoryAvailabilityEndDate: cat.availabilityEndDate,
                                categoryActivities: cat.categoryActivities,
                                categoryFacilities: cat.categoryFacilities,
                            });
                        }
                    }
                }
            });
        });
        return offers;
    }, [property?.categoryRooms, selectedMealPlan, checkInDate, checkOutDate]);


    useEffect(() => {
        if (!property?.categoryRooms || !displayableRoomOffers || !checkInDate || !checkOutDate || days <= 0) {
            setTotalBookingPricePerNight(0);
            setSubtotalNights(0); setServiceCharge(0); setTaxesApplied(0); setTotalBookingPricing(0);
            setBookingError(null);
            return;
        }

        let newActualAdultCountBasedOnOffers = 0;
        let calculatedPricePerNight = 0;
        const currentBookedRoomInstances: {
            category: StoredRoomCategory;
            offer: DisplayableRoomOffer;
            childrenAssigned: number;
        }[] = [];

        if (totalSelectedPhysicalRooms > 0 && displayableRoomOffers.length > 0) {
            Object.entries(selectedOffers).forEach(([offerId, qty]) => {
                if (qty > 0) {
                    const offer = displayableRoomOffers.find(o => o.offerId === offerId);
                    const category = property.categoryRooms.find(c => c.id === offer?.categoryId || c._id === offer?.categoryId);

                    if (offer && category) {
                        calculatedPricePerNight += offer.pricePerNight * qty;
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

        const adultCountToSet = totalSelectedPhysicalRooms > 0 ? Math.max(1, newActualAdultCountBasedOnOffers) : adultCount;

        if (totalSelectedPhysicalRooms > 0 && adultCount !== adultCountToSet) {
            setAdultCount(adultCountToSet);
        }

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
                    instance.childrenAssigned = childrenToAssignToInstance;
                    remainingChildrenToPlace -= childrenToAssignToInstance;

                    let pricePerChildForInstance = 0;
                    let child5to12Base = getPrice(pricing.child5to12Price, selectedMealPlan);
                    let child5to12Disc = getPrice(pricing.discountedChild5to12Price, selectedMealPlan);
                    if (child5to12Base === 0 && selectedMealPlan !== 'noMeal') child5to12Base = getPrice(pricing.child5to12Price, 'noMeal');
                    if (child5to12Disc === 0 && selectedMealPlan !== 'noMeal') child5to12Disc = getPrice(pricing.discountedChild5to12Price, 'noMeal');
                    const calculatedChild5to12Price = (child5to12Disc > 0 && child5to12Disc < child5to12Base) ? child5to12Disc : child5to12Base;

                    if (calculatedChild5to12Price > 0) {
                        pricePerChildForInstance = calculatedChild5to12Price;
                    }
                    childrenPriceComponent += pricePerChildForInstance * childrenToAssignToInstance;
                }
            }
        }
        calculatedPricePerNight += childrenPriceComponent;

        if (remainingChildrenToPlace > 0) {
            newErrorMessage = `Not enough room capacity for all ${childCount} children. ${remainingChildrenToPlace} children could not be assigned. Please adjust room selection or reduce child count.`;
        }

        const totalGuestCapacityInSelectedRooms = currentBookedRoomInstances.reduce((sum, inst) => sum + (inst.category.maxOccupancy || MAX_OCCUPANTS_PER_ROOM), 0);
        const totalGuestsAttemptingToBook = adultCountToSet + childCount;

        if (totalSelectedPhysicalRooms > 0 && totalGuestsAttemptingToBook > totalGuestCapacityInSelectedRooms && !newErrorMessage) {
             newErrorMessage = `Total guests (${totalGuestsAttemptingToBook}) exceed capacity of selected rooms (${totalGuestCapacityInSelectedRooms}). Adjust selection.`;
        }

        setBookingError(newErrorMessage);
        setTotalBookingPricePerNight(calculatedPricePerNight);

        if (calculatedPricePerNight > 0 && days > 0 && !newErrorMessage) {
            const currentSubtotalNights = calculatedPricePerNight * days;
            setSubtotalNights(currentSubtotalNights);
            const currentServiceCharge = SERVICE_FEE_FIXED * days;
            setServiceCharge(currentServiceCharge);
            const currentTaxes = (currentSubtotalNights + currentServiceCharge) * TAX_RATE_PERCENTAGE;
            setTaxesApplied(currentTaxes);
            setTotalBookingPricing(currentSubtotalNights + currentServiceCharge + currentTaxes);
        } else {
            setSubtotalNights(0); setServiceCharge(0); setTaxesApplied(0); setTotalBookingPricing(0);
            if (calculatedPricePerNight <= 0 && totalSelectedPhysicalRooms > 0 && days > 0 && !newErrorMessage) {
                const adultCountIsStableOrNoRooms = !(totalSelectedPhysicalRooms > 0 && adultCount !== adultCountToSet);
                if (adultCountIsStableOrNoRooms) {
                     setBookingError("Could not calculate a valid price. Check room rates or contact support.");
                }
            }
        }
    }, [
        selectedOffers, property, displayableRoomOffers, days,
        adultCount, childCount, selectedMealPlan, checkInDate, checkOutDate,
        totalSelectedPhysicalRooms,
    ]);


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
                const maxEndDate = new Date(property.endDate ?? Date.now());
                 const validNextDay = nextDay <= maxEndDate ? nextDay : maxEndDate;
                 if (validNextDay > validatedCheckIn) {
                    setCheckOutDate(validNextDay);
                 } else {
                    setCheckOutDate(null);
                 }
            } else if (!checkOutDate && validatedCheckIn) {
                const nextDay = new Date(validatedCheckIn);
                nextDay.setDate(validatedCheckIn.getDate() + 1);
                const maxEndDate = new Date(property.endDate || Date.now());
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
            validatedCheckOut = validateDate(selectedValue, minCODateStr, property.endDate || '');

             if (validatedCheckOut <= checkInDate) {
                 const dayAfterCI = new Date(checkInDate);
                 dayAfterCI.setDate(checkInDate.getDate() + 1);
                 const maxEndDate = new Date(property.endDate || Date.now());
                 validatedCheckOut = dayAfterCI <= maxEndDate ? dayAfterCI : null;
             }
            setCheckOutDate(validatedCheckOut);
        }
         const { available, message } = checkAvailabilityForSelection(checkInDate, validatedCheckOut, selectedOffers, property?.categoryRooms);
         setAvailabilityError(available ? null : message);
         setBookingError(null);
    };

    const handleImageClick = (imageUrl: string) => { setActiveImage(imageUrl); };

    const handleOfferQuantityChange = (offerId: string, quantity: number) => {
        if (!property?.categoryRooms) return;

        const [categoryIdFromFile] = offerId.split('_');
        const category = property.categoryRooms.find(cat => cat.id === categoryIdFromFile || cat._id === categoryIdFromFile);
        if (!category) return;

        const newQty = Math.max(0, quantity);
        const tempSelectedOffers = { ...selectedOffers };

        if (newQty === 0) delete tempSelectedOffers[offerId];
        else tempSelectedOffers[offerId] = newQty;

        let qtySumForThisCategory = 0;
        Object.keys(tempSelectedOffers).forEach(currentOfferId => {
            if (currentOfferId.startsWith(category.id + '_') || currentOfferId.startsWith(category._id + '_')) {
                qtySumForThisCategory += tempSelectedOffers[currentOfferId];
            }
        });

        if (qtySumForThisCategory > category.qty) {
            setBookingError(`Cannot select more than ${category.qty} rooms of type "${category.title}".`);
            setTimeout(() => setBookingError(null), 3000);
            return;
        }

        const newTotalSelectedPhysical = Object.values(tempSelectedOffers).reduce((sum, q) => sum + q, 0);
        if (newTotalSelectedPhysical > MAX_COMBINED_ROOMS) {
            setBookingError(`Maximum ${MAX_COMBINED_ROOMS} rooms allowed in total.`);
            setTimeout(() => setBookingError(null), 3000);
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
        setTotalSelectedPhysicalRooms(Object.values(selectedOffers).reduce((sum, qty) => sum + qty, 0));
    }, [selectedOffers]);

    const handleMealPlanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedMealPlan(e.target.value as keyof PricingByMealPlan);
        setBookingError(null);
        setAvailabilityError(null);
    };

    const handleBookNowOrReserveClick = () => {
        if (!isLoaded || !property) return;
        let localError: string | null = null;

        if (!isSignedIn) {
            openSignIn({ redirectUrl: window.location.href });
            return;
        }

        if (!checkInDate || !checkOutDate) localError = "Please select check-in and check-out dates.";
        else if (days <= 0) localError = "Check-out date must be after check-in date.";
        else if (totalSelectedPhysicalRooms <= 0) localError = "Please select at least one room offer.";
        else if (totalSelectedPhysicalRooms > MAX_COMBINED_ROOMS) localError = `Cannot book more than ${MAX_COMBINED_ROOMS} rooms.`;

        const { available, message: availabilityMsg } = checkAvailabilityForSelection(checkInDate, checkOutDate, selectedOffers, property?.categoryRooms);
        if (!available) {
            setAvailabilityError(availabilityMsg);
            return;
        } else setAvailabilityError(null);

        if (bookingError) return;
        if (totalBookingPricing <= 0 && totalSelectedPhysicalRooms > 0 && days > 0) {
            localError = "Calculated price is zero. Please check room rates or contact support.";
        }
        if (localError) {
            setBookingError(localError);
            return;
        }
        setBookingError(null);

        const reservationData = {
            propertyId: property._id, propertyTitle: property.title, propertyImage: activeImage || property.bannerImage?.url,
            propertyLocation: { address: property.location.address, city: property.location.city, country: property.location.country },
            propertyRating: property.totalRating, checkInDate: checkInDate?.toISOString(), checkOutDate: checkOutDate?.toISOString(),
            days, adultCount, childCount, globalGuestCount, totalSelectedPhysicalRooms, selectedOffers, selectedMealPlan, displayableRoomOffers,
            pricingDetails: { subtotalNights, serviceCharge, taxesApplied, totalBookingPricing, currency: property.costing?.currency || 'USD', totalBookingPricePerNight },
            ownerId: property.userId, propertyType: property.type,
            reservationPolicy : property.reservationPolicy || [],
        };
        if (typeof window !== 'undefined') {
            localStorage.setItem(RESERVATION_DATA_KEY, JSON.stringify(reservationData));
            router.push(`/customer/book/${property._id}`);
        }
    };

    const renderRatingStars = (rating: number, starSize: string = "w-4 h-4") => (
        <div className="flex items-center">
            {[1, 2, 3, 4, 5].map(star => (
                <StarIcon key={star} className={`${starSize} ${star <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
            ))}
        </div>
    );

    const getAmenityIcon = (amenity: string, size = 16, color = "text-green-600"): React.ReactNode => {
        const lowerAmenity = amenity.toLowerCase();
        if (lowerAmenity.includes('wifi') || lowerAmenity.includes('internet')) return <Wifi size={size} className={color} />;
        if (lowerAmenity.includes('parking')) return <Car size={size} className={color} />;
        if (lowerAmenity.includes('pool')) return <Droplet size={size} className={color} />;
        if (lowerAmenity.includes('air conditioning') || lowerAmenity.includes('ac')) return <Wind size={size} className={color} />;
        if (lowerAmenity.includes('gym') || lowerAmenity.includes('fitness')) return <Dumbbell size={size} className={color} />;
        if (lowerAmenity.includes('restaurant')) return <Utensils size={size} className={color} />;
        if (lowerAmenity.includes('tv') || lowerAmenity.includes('television')) return <Tv size={size} className={color} />;
        if (lowerAmenity.includes('coffee') || lowerAmenity.includes('tea maker') || lowerAmenity.includes('breakfast')) return <CoffeeIconLucide size={size} className={color} />;
        if (lowerAmenity.includes('balcony') || lowerAmenity.includes('view')) return <ImageIconLucide size={size} className="text-gray-500" />;
        if (lowerAmenity.includes('kitchen') || lowerAmenity.includes('kitchenette')) return <Utensils size={size} className={color} />;
        if (lowerAmenity.includes('air purifier')) return <Wind size={size} className={color} />;
        if (lowerAmenity.includes('hand sanitiser')) return <Droplet size={size} className={color} />;
        return <CheckCircle size={size} className={color} />;
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
            if (img.url && img.url !== property.bannerImage?.url) images.push({ ...img, publicId: img.publicId || img.url, url: img.url });
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
        if (mealTexts.length > 0) highlights.push({ icon: <CoffeeIconLucide className="text-blue-600" />, title: 'Meal Options', text: [mealTexts.join(', ')] });
        else if (property.amenities?.find(a => a.toLowerCase().includes('breakfast'))) highlights.push({ icon: <CoffeeIconLucide className="text-blue-600" />, title: 'Breakfast Available', text: ['Breakfast amenity offered'] });
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
                                <div><p className="text-sm font-semibold text-gray-700">{item.title}</p><p className="text-xs text-gray-500">{item.text.join(', ')}</p></div>
                            </div>
                        ))}
                    </div>
                ) : <p className="text-sm text-gray-500">No specific highlights available.</p>}
            </div>
        );
    };

    if (loading) return <div className="flex justify-center items-center min-h-screen"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div></div>;
    if (error || !property) return <div className="container mx-auto px-4 py-16 text-center"><h2 className="text-2xl font-bold text-red-600 mb-4">{error || 'Property details could not be loaded.'}</h2><p className="text-gray-600 mb-4">Please check the URL or try refreshing the page.</p><button onClick={() => router.push('/properties')} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">View Other Properties</button></div>;

    const currencySymbol = property.costing?.currency === 'INR' ? '₹' : (property.costing?.currency === 'USD' ? '$' : (property.costing?.currency === 'EUR' ? '€' : (property.costing?.currency || '$')));


    return (
        <>
        <div className="bg-gray-100">
            <div className="container mx-auto px-2 sm:px-4 lg:px-16 py-16">
                {/* Header Section */}
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

                {/* Image Gallery and Map Section */}
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
                        {property?.googleMaps && (
                            <div id="map-section" className="bg-white rounded-md h-48 md:h-56 overflow-hidden border border-gray-200 shadow-sm">
                                {property?.googleMaps?.startsWith('<iframe') ? (
                                    <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: property.googleMaps.replace(/width=".*?"/, 'width="100%"').replace(/height=".*?"/, 'height="100%"')}} />
                                ) : (
                                     <iframe title={`${property.title} location map`} src={property.googleMaps} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
                                )}
                            </div>
                        )}
                        {renderPropertyHighlights()}
                    </div>
                </div>

                {/* About Property Section */}
                <div className="bg-white p-4 rounded-md border border-gray-200 mb-5">
                    <h2 className="text-xl font-bold text-gray-800 mb-3">About this property</h2>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{property.description || "No detailed description available."}</p>
                </div >

                {/* SignedOut Section */}
                <SignedOut>
                    <div className="bg-yellow-50 border border-yellow-300 p-4 rounded-md mb-6 flex flex-col sm:flex-row items-center sm:items-center justify-between text-center sm:text-left gap-4 sm:gap-2">
                        <div className="flex-grow">
                            <h3 className="text-lg font-bold text-yellow-800">Sign in, save money</h3>
                            <p className="text-sm text-yellow-700">To see if you can save 10% or more at this property, sign in</p>
                            <div className="mt-3">
                                <button onClick={() => openSignIn({ redirectUrl: typeof window !== 'undefined' ? window.location.href : undefined})} className="bg-blue-600 text-white text-sm px-4 py-2 rounded-md hover:bg-blue-700 mr-2">Sign in</button>
                                <button onClick={() => openSignIn({ redirectUrl: typeof window !== 'undefined' ? window.location.href : undefined })} className="text-blue-600 text-sm font-semibold hover:underline">Create an account</button>
                            </div>
                        </div>
                        <Image src="/images/gift.jpeg" alt="Genius Loyalty Program" width={80} height={80} className="mx-auto sm:mx-0 shrink-0" />
                    </div>
                </SignedOut>

                {/* ROOM SELECTION TABLE SECTION */}
                <div className="bg-white rounded-md border border-gray-300 mb-6">
                    {/* Date/Guest/Meal Plan selectors */}
                    <div className="bg-gray-50 p-4 border-b border-gray-200">
                        <h2 className="text-xl font-bold text-gray-800 mb-3">Select your rooms</h2>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                            <div> <label htmlFor="checkin-date-table" className="block text-xs font-medium text-gray-500 mb-1">Check-in</label> <input id="checkin-date-table" type="date" value={checkInDate ? checkInDate.toISOString().split('T')[0] : ''} onChange={handleCheckInChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm shadow-sm" min={property.startDate} max={property.endDate} required /> </div>
                             <div> <label htmlFor="checkout-date-table" className="block text-xs font-medium text-gray-500 mb-1">Check-out</label> <input id="checkout-date-table" type="date" value={checkOutDate ? checkOutDate.toISOString().split('T')[0] : ''} onChange={handleCheckOutChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm shadow-sm" min={checkInDate ? new Date(checkInDate.getTime() + 86400000).toISOString().split('T')[0] : property.startDate} max={property.endDate} required disabled={!checkInDate} /> </div>
                            <div> <label htmlFor="adult-count-selector" className="block text-xs font-medium text-gray-500 mb-1">Adults</label> <select id="adult-count-selector" value={adultCount} onChange={e => {setAdultCount(parseInt(e.target.value)); setBookingError(null);}} className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 text-sm shadow-sm"> {[...Array(10)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)} </select> </div>
                             <div> <label htmlFor="child-count-selector" className="block text-xs font-medium text-gray-500 mb-1">Children (0-17)</label> <select id="child-count-selector" value={childCount} onChange={e => {setChildCount(parseInt(e.target.value)); setBookingError(null);}} className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 text-sm shadow-sm"> {[...Array(6)].map((_, i) => <option key={i} value={i}>{i}</option>)} </select> </div>
                        </div>
                        <div className="mt-4">
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Preferred Meal Plan (for all rooms):</label>
                            <div className="flex flex-wrap gap-2"> {(['noMeal', 'breakfastOnly', 'allMeals'] as (keyof PricingByMealPlan)[]).map(plan => { const labelText = { noMeal: 'Room Only', breakfastOnly: 'Breakfast', allMeals: 'All Meals'}[plan]; return ( <label key={`meal-plan-table-${plan}`} className={`flex items-center px-2.5 py-1 border rounded-md cursor-pointer transition-colors text-xs ${selectedMealPlan === plan ? 'bg-blue-100 border-blue-400 ring-1 ring-blue-400' : 'border-gray-300 hover:bg-gray-100'}`}> <input type="radio" name="mealPlanTable" value={plan} checked={selectedMealPlan === plan} onChange={handleMealPlanChange} className="h-3 w-3 text-blue-600 border-gray-300 focus:ring-blue-500 mr-1.5" /> <span className={`${selectedMealPlan === plan ? 'text-blue-700 font-semibold' : 'text-gray-600'}`}>{labelText}</span> </label> ); })} </div>
                        </div>
                         {availabilityError && <div className="mt-3 p-2 bg-yellow-100 text-yellow-800 text-xs rounded-md border border-yellow-300 flex items-start"><CalendarOff className='h-3.5 w-3.5 mr-1.5 shrink-0 text-yellow-600 mt-px'/><p>{availabilityError}</p></div>}
                         {bookingError && <div id="main-page-booking-error" className="mt-3 p-2 bg-red-100 text-red-700 text-xs rounded-md border border-red-300 flex items-start"><AlertTriangle className='h-3.5 w-3.5 mr-1.5 shrink-0 text-red-500 mt-px'/><p>{bookingError}</p></div>}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full lg:min-w-[1400px] border-collapse">
                            <thead className="hidden lg:table-header-group bg-blue-800 text-left text-base text-white uppercase">
                                <tr>
                                    <th className="px-4 py-3 font-semibold w-[25%] border-r border-blue-700">Room type</th>
                                    <th className="px-3 py-3 font-semibold text-center w-[10%] border-r border-blue-700">Number of guests</th>
                                    <th className="px-3 py-3 font-semibold w-[15%] border-r border-blue-700">Today&apos;s price</th>
                                    <th className="px-3 py-3 font-semibold w-[20%] border-r border-blue-700">Your choices</th>
                                    <th className="px-3 py-3 font-semibold text-center w-[10%] border-r border-blue-700">Select rooms</th>
                                    <th className="px-3 py-3 font-semibold text-center w-[20%]">Make Reservation</th>
                                </tr>
                            </thead>
                            <tbody className="block lg:table-row-group lg:divide-y lg:divide-gray-200 border-b border-gray-300">
                                {displayableRoomOffers.length === 0 && property.categoryRooms && property.categoryRooms.length > 0 && (
                                    <tr className="block lg:table-row"><td colSpan={6} className="block lg:table-cell text-center py-6 text-gray-500">No pricing options available for the selected meal plan or dates. Try another plan or adjust dates.</td></tr>
                                )}
                                {(!property.categoryRooms || property.categoryRooms.length === 0) && (
                                        <tr className="block lg:table-row"><td colSpan={6} className="block lg:table-cell text-center py-8 text-gray-500">No room types available for this property.</td></tr>
                                )}

                                {displayableRoomOffers.map((offer, overallOfferIndex) => {
                                    const category = property.categoryRooms.find(cat => cat.id === offer.categoryId || cat._id === offer.categoryId);
                                    if (!category) return null;

                                    const offersForThisCategory = displayableRoomOffers.filter(o => o.categoryId === category.id || o.categoryId === category._id);
                                    const offerIndexInCategory = offersForThisCategory.findIndex(o => o.offerId === offer.offerId);

                                    const currentQtySelected = selectedOffers[offer.offerId] || 0;
                                    const totalPriceForOfferNights = offer.pricePerNight * (days > 0 ? days : 1);
                                    const illustrativeTaxForOffer = totalPriceForOfferNights * TAX_RATE_PERCENTAGE;
                                    let sumOfOtherOffersInCat = 0;
                                    Object.keys(selectedOffers).forEach(oId => {
                                        if ((oId.startsWith(category.id + '_') || oId.startsWith(category._id + '_')) && oId !== offer.offerId) {
                                            sumOfOtherOffersInCat += selectedOffers[oId];
                                        }
                                    });
                                    const maxSelectableForThisOffer = Math.min(category.qty - sumOfOtherOffersInCat, MAX_COMBINED_ROOMS - (totalSelectedPhysicalRooms - currentQtySelected));

                                    return (
                                        <tr key={offer.offerId} className={`block p-4 border rounded-lg mb-4 lg:p-0 lg:table-row lg:border-none lg:mb-0 lg:rounded-none lg:shadow-none ${currentQtySelected > 0 ? 'bg-blue-50/50 ring-1 ring-blue-200 lg:bg-blue-50/10' : 'bg-white'}`}>
                                            {offerIndexInCategory === 0 ? (
                                                <td className="block border-b pb-4 mb-4 lg:border-b-0 lg:pb-0 lg:mb-0 lg:table-cell lg:px-4 lg:py-3 lg:align-top lg:border-r lg:border-gray-300" rowSpan={offersForThisCategory.length}>
                                                    <a href="#" onClick={(e) => e.preventDefault()} className="font-semibold text-blue-600 hover:underline text-xl">{offer.categoryTitle}</a>
                                                    <div className="mt-1.5 p-1.5 bg-green-50 border border-green-200 rounded-sm text-xs text-green-700 flex items-center">
                                                        <UserCheck size={14} className="mr-1.5 shrink-0"/> Recommended for {offer.intendedAdults} adult{offer.intendedAdults > 1 ? 's' : ''}
                                                        {offer.guestCapacityInOffer > offer.intendedAdults ? ` (up to ${offer.guestCapacityInOffer - offer.intendedAdults} child${offer.guestCapacityInOffer - offer.intendedAdults > 1 ? 'ren' : ''})` : ''}
                                                    </div>
                                                    {category.qty > 0 && category.qty <= 5 && <p className="text-xs text-red-600 mt-1.5 flex items-center"><AlertCircle size={14} className="mr-1 shrink-0"/>Only {category.qty} rooms left on our site</p>}
                                                    {offer.bedConfiguration && <p className="text-xs text-gray-700 mt-1.5 flex items-center"><Bed size={14} className="mr-1.5 text-gray-500" />{offer.bedConfiguration}</p>}
                                                    {offer.size && <p className="text-xs text-gray-700 mt-1 flex items-center"><ImageIconLucide size={14} className="mr-1.5 text-gray-500" />{offer.size}</p>}
                                                    {category.categoryActivities && category.categoryActivities.length > 0 && (
                                                        <div className="mt-2">
                                                            <p className="text-xs font-semibold text-yellow-700 flex items-center"><Sparkles size={13} className="mr-1" />Activities:</p>
                                                            <div className="flex flex-wrap gap-1 mt-0.5">
                                                                {category.categoryActivities.slice(0,3).map(act => <span key={act} className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded-sm">{act}</span>)}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {category.categoryFacilities && category.categoryFacilities.length > 0 && (
                                                        <div className="mt-1.5">
                                                            <p className="text-xs font-semibold text-indigo-700 flex items-center"><Wrench size={13} className="mr-1" />Facilities:</p>
                                                                <div className="flex flex-wrap gap-1 mt-0.5">
                                                                {category.categoryFacilities.slice(0,3).map(fac => <span key={fac} className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded-sm">{fac}</span>)}
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>
                                            ) : null }
                                            
                                <td className="block py-2 border-b lg:border-b-0 lg:table-cell lg:px-3 lg:py-3 lg:align-top lg:text-center lg:border-r lg:border-gray-300">
                                    <span className="text-sm font-semibold text-gray-500 lg:hidden">Sleeps:</span>
                                    
                                    {/* Container to center the content vertically */}
                                    <div className="flex flex-col items-center justify-center mt-1 lg:mt-0">
                                        
                                        {/* The icons */}
                                        <div className="flex justify-start items-center lg:justify-center">
                                            {[...Array(offer.intendedAdults)].map((_, i) => (
                                                <UsersIcon key={i} size={18} className={`text-gray-600 ${i > 0 ? '-ml-1' : ''}`} />
                                            ))}
                                        </div>

                                        {/* The new descriptive text */}
                                        <p className="text-sm font-bold text-gray-700 mt-1">
                                            {offer.intendedAdults} {offer.intendedAdults === 1 ? 'person' : 'people'}
                                        </p>

                                    </div>
                                </td>
                                            <td className="block py-2 border-b lg:border-b-0 lg:table-cell lg:px-3 lg:py-3 lg:align-top lg:border-r lg:border-gray-300">
                                                <span className="text-sm font-semibold text-gray-500 lg:hidden">Price for {days > 0 ? `${days} night${days > 1 ? 's' : ''}` : 'selection'}:</span>
                                                <div className="mt-1 lg:mt-0">
                                                    {days > 0 && offer.pricePerNight > 0 ? ( <> <p className="text-lg font-bold text-gray-800">{currencySymbol} {totalPriceForOfferNights.toLocaleString()}</p> <p className="text-[11px] text-gray-500">+ {currencySymbol} {illustrativeTaxForOffer.toFixed(0)} taxes and charges</p> </> ) : days > 0 ? ( <p className="text-sm text-red-500">Price not available</p> ) : ( <p className="text-sm text-gray-500">Select dates to see price</p> )}
                                                </div>
                                            </td>
                                            <td className="block py-2 border-b lg:border-b-0 lg:table-cell lg:px-3 lg:py-3 lg:align-top text-xs text-gray-700 space-y-1.5 lg:border-r lg:border-gray-300">
                                                <span className="text-sm font-semibold text-gray-500 lg:hidden">Your choices include:</span>
                                                <div className="mt-1 lg:mt-0">
                                                    <p className="flex items-center font-semibold"> {selectedMealPlan === 'breakfastOnly' ? <CoffeeIconLucide size={14} className="mr-1.5 shrink-0 text-gray-600" /> : selectedMealPlan === 'allMeals' ? <Utensils size={14} className="mr-1.5 shrink-0 text-gray-600" /> : <Bed size={14} className="mr-1.5 shrink-0 text-gray-600" /> } <span className="flex-grow"> {selectedMealPlan === 'breakfastOnly' ? 'Very good breakfast included' : selectedMealPlan === 'allMeals' ? 'Breakfast & dinner included' : 'Room only accommodation'} </span> <HelpCircle size={13} className="ml-1 text-gray-400 hover:text-gray-600 cursor-pointer flex-shrink-0" aria-label={`This offer is for ${selectedMealPlan === 'noMeal' ? 'room only' : selectedMealPlan === 'breakfastOnly' ? 'room with breakfast' : 'room with all meals'}.`} /> </p>
                                                    {property.reservationPolicy?.some(p => ['Free Cancellation', 'Flexible', 'Moderate'].includes(p)) && ( <p className="flex items-center text-green-600"> <CheckCircle size={14} className="mr-1.5 shrink-0" /> Free cancellation <span className="text-gray-500 ml-1 text-[10px]">(before specific date/time - check details)</span> </p> )}
                                                    {property.reservationPolicy?.includes('Pay at Property') && ( <p className="flex items-center text-green-600"> <CheckCircle size={14} className="mr-1.5 shrink-0" /> No prepayment needed <span className="text-gray-500 ml-1 text-[10px]"> – pay at the property</span> </p> )}
                                                    {property.reservationPolicy?.some(p => ['Non-Refundable', 'Strict'].includes(p)) && !property.reservationPolicy?.some(p => ['Free Cancellation', 'Flexible', 'Moderate'].includes(p)) && ( <p className="flex items-center text-red-600 font-semibold"> <XCircle size={14} className="mr-1.5 shrink-0" /> Non-Refundable </p> )}
                                                </div>
                                            </td>
                                            <td className="block py-2 border-b lg:border-b-0 lg:table-cell lg:px-3 lg:py-3 lg:align-top lg:text-center lg:border-r lg:border-gray-300">
                                                    <div className="flex items-center justify-between lg:justify-center">
                                                    <span className="text-sm font-semibold text-gray-500 lg:hidden">Select rooms:</span>
                                                    <select value={currentQtySelected} onChange={(e) => handleOfferQuantityChange(offer.offerId, parseInt(e.target.value))} className="p-1.5 border border-gray-400 rounded text-sm focus:ring-1 focus:ring-blue-500 w-20" disabled={days <= 0 || maxSelectableForThisOffer < 0 || !!availabilityError} > {[...Array(Math.max(0, maxSelectableForThisOffer) + 1)].map((_, i) => ( <option key={i} value={i}>{i}</option> ))} </select>
                                                </div>
                                            </td>

                                            {overallOfferIndex === 0 && displayableRoomOffers.length > 0 && (
                                                <td className="lg:block pt-4 lg:pt-2 lg:table-cell lg:px-4 lg:py-3 lg:align-top lg:text-left relative hidden " rowSpan={displayableRoomOffers.length}>
                                                    {totalSelectedPhysicalRooms > 0 && totalBookingPricing > 0 && days > 0 && ( <div className="mb-3 text-sm"> <p className="font-semibold text-md"> {totalSelectedPhysicalRooms} room{totalSelectedPhysicalRooms > 1 ? 's' : ''} for </p> <p className="text-2xl font-bold text-gray-800"> {currencySymbol} {totalBookingPricing.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} </p> <p className="text-xs text-gray-500"> for {days} night{days > 1 ? 's' : ''}, incl. taxes </p> </div> )}
                                                    <button onClick={handleBookNowOrReserveClick} onMouseEnter={() => setShowReservePopover(true)} onMouseLeave={() => setShowReservePopover(false)} disabled={!checkInDate || !checkOutDate || days <= 0 || totalSelectedPhysicalRooms <= 0 || !!availabilityError || totalBookingPricing <=0 || !!bookingError} className="bg-blue-600 text-white font-semibold py-2.5 px-5 rounded-md hover:bg-blue-700 text-sm disabled:bg-gray-300 disabled:cursor-not-allowed w-full" > I&apos;ll reserve </button>
                                                    <p className="text-xs text-gray-500 mt-1.5"><span className="inline-block mr-1">•</span>You&apos;ll be taken to the next step</p>
                                                    <p className="text-xs text-green-600 mt-1"><span className="inline-block mr-1">•</span>Confirmation is immediate</p>
                                                    {showReservePopover && checkInDate && checkOutDate && days > 0 && property && totalSelectedPhysicalRooms > 0 && ( <div className="hidden lg:block absolute top-0 right-full mr-4 w-[340px] p-4 bg-slate-800 text-white rounded-lg shadow-xl z-20" > <h3 className="text-xl font-bold mb-1">{property.title}</h3> <p className="text-sm font-normal text-gray-300 mb-3">Enhanced personal experience</p> <div className="text-sm space-y-1 mb-4"> <p><strong>Total length of stay:</strong> {days} {days === 1 ? 'night' : 'nights'}</p> <p><strong>Check-in:</strong> {checkInDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p> <p><strong>Check-out:</strong> {checkOutDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p> </div> <div className="bg-yellow-400 text-black text-sm font-semibold p-3 rounded-md text-center"> No account needed! Booking takes just 2 minutes. </div> </div> )}
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                           
                    </div>
                </div>


                {/* Popular Facilities Section */}
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
        </div>
        <div className="w-[96vw] m-2 fixed bottom-0 block lg:hidden">
            {totalSelectedPhysicalRooms > 0 && totalBookingPricing > 0 && days > 0 && ( <div className="mb-3 text-sm"> <p className="font-semibold text-md"> {totalSelectedPhysicalRooms} room{totalSelectedPhysicalRooms > 1 ? 's' : ''} for </p> <p className="text-2xl font-bold text-gray-800"> {currencySymbol} {totalBookingPricing.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} </p> <p className="text-xs text-gray-500"> for {days} night{days > 1 ? 's' : ''}, incl. taxes </p> </div> )}
            <button onClick={handleBookNowOrReserveClick} onMouseEnter={() => setShowReservePopover(true)} onMouseLeave={() => setShowReservePopover(false)} disabled={!checkInDate || !checkOutDate || days <= 0 || totalSelectedPhysicalRooms <= 0 || !!availabilityError || totalBookingPricing <=0 || !!bookingError} className="bg-blue-600 text-white font-semibold py-3 px-5 border-3 border-black/40 rounded-md hover:bg-blue-700 text-sm disabled:bg-gray-300 disabled:cursor-not-allowed w-full" > I&apos;ll reserve </button>
            {/* <p className="text-xs text-gray-500 mt-1.5"><span className="inline-block mr-1">•</span>You&apos;ll be taken to the next step</p>
            <p className="text-xs text-green-600 mt-1"><span className="inline-block mr-1">•</span>Confirmation is immediate</p> */}
            {showReservePopover && checkInDate && checkOutDate && days > 0 && property && totalSelectedPhysicalRooms > 0 && ( <div className="hidden lg:block absolute top-0 right-full mr-4 w-[340px] p-4 bg-slate-800 text-white rounded-lg shadow-xl z-20" > <h3 className="text-xl font-bold mb-1">{property.title}</h3> <p className="text-sm font-normal text-gray-300 mb-3">Enhanced personal experience</p> <div className="text-sm space-y-1 mb-4"> <p><strong>Total length of stay:</strong> {days} {days === 1 ? 'night' : 'nights'}</p> <p><strong>Check-in:</strong> {checkInDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p> <p><strong>Check-out:</strong> {checkOutDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p> </div> <div className="bg-yellow-400 text-black text-sm font-semibold p-3 rounded-md text-center"> No account needed! Booking takes just 2 minutes. </div> </div> )}
        </div>
        </>
    );
}